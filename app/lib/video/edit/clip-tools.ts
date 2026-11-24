/**
 * Video Edit's clip tools that make a new file from a clip, on the device:
 * a copy that plays backwards (picture and sound), and a still of one frame
 * for a freeze. Both come out upright, so a turned phone video needs no
 * rotation flag.
 */
import { loadMediabunny, openInput } from 'xsenze-tools/lib/video/media-probe';
import type { Clip } from 'xsenze-tools/lib/video/edit/timeline';

type Mediabunny = Awaited<ReturnType<typeof loadMediabunny>>;
type Sample = import('mediabunny').VideoSample;

/** The longest clip that can be reversed, seconds: it is rebuilt in memory. */
export const reverseLimit = 600;
/** Seconds of frames held at once while reversing. */
const reverseWindow = 0.5;

const stem = (name: string) => name.replace(/\.[^.]+$/, '');

/** A sample's picture drawn the right way up onto a canvas of its upright size. */
function drawUpright(
  ctx: OffscreenCanvasRenderingContext2D,
  sample: Sample,
  width: number,
  height: number,
) {
  const rotation = ((sample.rotation % 360) + 360) % 360;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(
    sample.toCanvasImageSource(),
    -sample.codedWidth / 2,
    -sample.codedHeight / 2,
    sample.codedWidth,
    sample.codedHeight,
  );
  ctx.restore();
}

const uprightSize = (sample: Sample) =>
  sample.rotation % 180
    ? { width: sample.codedHeight, height: sample.codedWidth }
    : { width: sample.codedWidth, height: sample.codedHeight };

/** The frame at clip second `t` as a PNG file, upright. */
export async function clipStill(clip: Clip, t: number): Promise<File> {
  const m = await loadMediabunny();
  const track = await openInput(m, clip.file).getPrimaryVideoTrack();
  if (!track || !(await track.canDecode())) throw new Error('still-decode');
  const sink = new m.VideoSampleSink(track);
  const sample =
    (await sink.getSample(Math.max(0, t))) ??
    (await sink.getSample(Math.max(0, t - 0.1)));
  if (!sample) throw new Error('still-decode');
  const { width, height } = uprightSize(sample);
  const canvas = new OffscreenCanvas(width, height);
  drawUpright(canvas.getContext('2d')!, sample, width, height);
  sample.close();
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  const at = `${Math.floor(t / 60)}-${String(Math.floor(t % 60)).padStart(2, '0')}`;
  return new File([blob], `${stem(clip.name)} still ${at}.png`, {
    type: 'image/png',
  });
}

/** A video codec this browser can encode at a size, H.264 first. */
async function codecFor(m: Mediabunny, width: number, height: number) {
  for (const codec of ['avc', 'hevc', 'vp9', 'av1'] as const)
    if (await m.canEncodeVideo(codec, { width, height })) return codec;
  return null;
}

/** The whole sound of a clip as one buffer, or null without sound. */
async function wholeSound(m: Mediabunny, clip: Clip) {
  const track = await openInput(m, clip.file).getPrimaryAudioTrack();
  if (!track || !(await track.canDecode())) return null;
  const parts: { buffer: AudioBuffer; at: number }[] = [];
  for await (const wrapped of new m.AudioBufferSink(track).buffers())
    parts.push({ buffer: wrapped.buffer, at: wrapped.timestamp });
  const first = parts[0]?.buffer;
  if (!first) return null;
  const rate = first.sampleRate;
  const end = Math.max(...parts.map((p) => p.at + p.buffer.duration));
  const out = new AudioBuffer({
    numberOfChannels: first.numberOfChannels,
    length: Math.max(1, Math.round(end * rate)),
    sampleRate: rate,
  });
  for (const { buffer, at } of parts) {
    const offset = Math.max(0, Math.round(at * rate));
    for (let c = 0; c < out.numberOfChannels; c++) {
      const data = buffer.getChannelData(
        Math.min(c, buffer.numberOfChannels - 1),
      );
      const room = out.length - offset;
      if (room > 0) out.copyToChannel(data.subarray(0, room), c, offset);
    }
  }
  return out;
}

/**
 * A copy of a video that plays backwards, sound and all, as an MP4 (or WebM
 * where MP4 can't be made). It reads the clip from its end in short windows,
 * so only half a second of frames is held at a time.
 */
export async function reverseClip(
  clip: Clip,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<File> {
  const m = await loadMediabunny();
  const input = openInput(m, clip.file);
  const track = await input.getPrimaryVideoTrack();
  if (!track || !(await track.canDecode())) throw new Error('reverse-decode');
  const turned = track.rotation % 180 !== 0;
  const width = turned ? track.displayHeight : track.displayWidth;
  const height = turned ? track.displayWidth : track.displayHeight;
  // even sizes: encoders want them
  const W = Math.max(2, width - (width % 2));
  const H = Math.max(2, height - (height % 2));
  const codec = await codecFor(m, W, H);
  if (!codec) throw new Error('reverse-encode');
  const mp4 = codec !== 'vp9';
  const format = mp4
    ? new m.Mp4OutputFormat({ fastStart: 'in-memory' })
    : new m.WebMOutputFormat();
  const target = new m.BufferTarget();
  const output = new m.Output({ format, target });
  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext('2d', { alpha: false })!;
  const fps = clip.fps || 30;
  // plenty for a copy that is cut and encoded again on export
  const bitrate = Math.min(40e6, Math.max(2e6, W * H * fps * 0.2));
  const video = new m.CanvasSource(canvas, { codec, bitrate });
  output.addVideoTrack(video, { frameRate: fps });

  const sound = clip.hasAudio ? await wholeSound(m, clip) : null;
  let audio: InstanceType<Mediabunny['AudioBufferSource']> | null = null;
  if (sound) {
    const aac = mp4 && (await m.canEncodeAudio('aac'));
    audio = new m.AudioBufferSource({
      codec: aac ? 'aac' : 'opus',
      bitrate: 192_000,
    });
    output.addAudioTrack(audio);
  }

  const abort = () => {
    if (signal?.aborted)
      throw new DOMException('Reversing was stopped', 'AbortError');
  };
  const sink = new m.VideoSampleSink(track);
  const duration = clip.duration;
  try {
    await output.start();
    if (sound && audio) {
      for (let c = 0; c < sound.numberOfChannels; c++)
        sound.getChannelData(c).reverse();
      await audio.add(sound);
    }
    let out = 0;
    for (let end = duration; end > 1e-6; end -= reverseWindow) {
      abort();
      const start = Math.max(0, end - reverseWindow);
      const held: { bitmap: ImageBitmap; length: number }[] = [];
      for await (const sample of sink.samples(start, end)) {
        // a window starts at the frame on show at its start: that frame
        // belongs to the window before, unless this is the first
        const inside = sample.timestamp >= start - 1e-6 || start === 0;
        if (inside && sample.timestamp < end - 1e-6) {
          const size = uprightSize(sample);
          const sheet = new OffscreenCanvas(size.width, size.height);
          drawUpright(sheet.getContext('2d')!, sample, size.width, size.height);
          held.push({
            bitmap: sheet.transferToImageBitmap(),
            length: sample.duration || 1 / fps,
          });
        }
        sample.close();
      }
      for (const { bitmap, length } of held.reverse()) {
        abort();
        ctx.drawImage(bitmap, 0, 0, W, H);
        bitmap.close();
        await video.add(out, length);
        out += length;
      }
      onProgress?.(Math.min(0.99, 1 - start / duration));
    }
    await output.finalize();
  } catch (error) {
    await output.cancel().catch(() => undefined);
    throw error;
  }
  onProgress?.(1);
  const buffer = target.buffer;
  if (!buffer) throw new Error('reverse-encode');
  const ext = mp4 ? 'mp4' : 'webm';
  return new File([buffer], `${stem(clip.name)} reversed.${ext}`, {
    type: format.mimeType,
  });
}
