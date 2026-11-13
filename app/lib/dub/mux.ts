/**
 * Video output for Audio Dub: the original picture copied packet for packet
 * (never re-encoded) with one or more new audio tracks, each tagged with its
 * language so players can switch between them.
 */
import { loadMediabunny, openInput } from 'xsenze-tools/lib/media-probe';

export interface AudioTrackIn {
  buffer: AudioBuffer;
  /** ISO 639-2/T, e.g. hin */
  language: string;
  /** Shown in players' audio menus, e.g. Hindi */
  name: string;
}

/** Does the file have a video track we can copy? */
export async function hasVideo(file: File): Promise<boolean> {
  try {
    const m = await loadMediabunny();
    return !!(await openInput(m, file).getPrimaryVideoTrack());
  } catch {
    return false;
  }
}

/** An MP4 of `file`'s picture with `tracks` as its audio, the first being the default. */
export async function videoWithAudio(
  file: File,
  tracks: AudioTrackIn[],
  signal?: AbortSignal,
): Promise<Blob> {
  const m = await loadMediabunny();
  const input = openInput(m, file);
  const video = await input.getPrimaryVideoTrack();
  if (!video?.codec) throw new Error('no-video');

  const audioCodec = (await m.canEncodeAudio('aac')) ? 'aac' : 'opus';
  const output = new m.Output({
    format: new m.Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new m.BufferTarget(),
  });

  const videoSource = new m.EncodedVideoPacketSource(video.codec);
  output.addVideoTrack(videoSource, { rotation: video.rotation });
  const audioSources = tracks.map((track, i) => {
    const source = new m.AudioBufferSource({
      codec: audioCodec,
      bitrate: 160_000,
    });
    output.addAudioTrack(source, {
      languageCode: track.language,
      name: track.name,
      disposition: { default: i === 0 },
    });
    return source;
  });

  await output.start();

  const decoderConfig = await video.getDecoderConfig();
  const sink = new m.EncodedPacketSink(video);
  let first = true;
  for await (const packet of sink.packets()) {
    if (signal?.aborted) {
      await output.cancel();
      throw new DOMException('Aborted', 'AbortError');
    }
    await videoSource.add(
      packet,
      first && decoderConfig ? { decoderConfig } : undefined,
    );
    first = false;
  }
  videoSource.close();

  for (const [i, source] of audioSources.entries()) {
    await source.add(tracks[i]!.buffer);
    source.close();
  }

  await output.finalize();
  const bytes = (output.target as { buffer: ArrayBuffer | null }).buffer;
  if (!bytes) throw new Error('empty-output');
  return new Blob([bytes], { type: 'video/mp4' });
}
