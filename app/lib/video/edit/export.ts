/**
 * Video Edit's export: the edit rendered and encoded into one file, on the
 * device. The video track is drawn frame by frame onto one canvas (black
 * bars or a crop, fades to black); every sound (the video's own, Music,
 * Voice) is mixed with its volume and fades into 48 kHz stereo. Both are
 * made in windows of a few seconds, so memory stays low and the two tracks
 * are written side by side.
 */
import { loadMediabunny, openInput } from 'xsenze-tools/lib/video/media-probe';
import type { Fit } from 'xsenze-tools/lib/video/edit/player';
import {
  editLength,
  lengthOf,
  starts,
  total,
  type Clip,
  type Edit,
  type Level,
} from 'xsenze-tools/lib/video/edit/timeline';

export type ExportContainer = 'mp4' | 'webm';
export type ExportCodec = 'avc' | 'hevc' | 'vp9' | 'av1';

export interface ExportOptions {
  container: ExportContainer;
  codec: ExportCodec;
  width: number;
  height: number;
  fps: number;
  fit: Fit;
  /** Video bits a second. */
  bitrate: number;
  /** Drops every sound when false. */
  sound: boolean;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

export interface ExportResult {
  blob: Blob;
  ext: string;
}

const sampleRate = 48000;
const channels = 2;
/** Seconds rendered at a time. */
const windowSeconds = 5;
const audioBitrate = 192_000;

/** Which codecs each container holds, and the sound codec it uses. */
export const CONTAINER_CODECS: Record<
  ExportContainer,
  { video: ExportCodec[]; audio: 'aac' | 'opus' }
> = {
  mp4: { video: ['avc', 'hevc', 'av1'], audio: 'aac' },
  webm: { video: ['vp9', 'av1'], audio: 'opus' },
};

/** Codecs this browser can encode at a size, for the export panel. */
export async function exportCodecs(
  width: number,
  height: number,
): Promise<Set<ExportCodec>> {
  if (!('VideoEncoder' in globalThis)) return new Set();
  const { canEncodeVideo } = await loadMediabunny();
  const all: ExportCodec[] = ['avc', 'hevc', 'vp9', 'av1'];
  const answers = await Promise.all(
    all.map((codec) => canEncodeVideo(codec, { width, height })),
  );
  return new Set(all.filter((_, i) => answers[i]));
}

const levelGain = (level: Level) => (level.muted ? 0 : level.volume);

/** A stretch of sound to mix: where it sits, its gain and its fades. */
interface Stretch {
  clip: Clip;
  /** Timeline seconds. */
  start: number;
  in: number;
  out: number;
  gain: number;
  fadeIn: number;
  fadeOut: number;
  /** Decoded audio of in..out, filled on first use. */
  buffers?: { buffer: AudioBuffer; at: number }[];
}

/** Every sound in the edit as stretches; silent ones are left out. */
function stretches(clips: ReadonlyMap<string, Clip>, edit: Edit): Stretch[] {
  const out: Stretch[] = [];
  const videoLevel = levelGain(edit.mix.video);
  const begins = starts(edit.pieces);
  edit.pieces.forEach((piece, i) => {
    const clip = clips.get(piece.clip);
    const gain = (piece.muted ? 0 : piece.volume) * videoLevel;
    if (!clip?.hasAudio || gain <= 0) return;
    out.push({
      clip,
      start: begins[i]!,
      in: piece.in,
      out: piece.out,
      gain,
      fadeIn: piece.fadeIn,
      fadeOut: piece.fadeOut,
    });
  });
  for (const item of edit.audio) {
    const clip = clips.get(item.clip);
    const gain =
      (item.muted ? 0 : item.volume) * levelGain(edit.mix[item.lane]);
    if (!clip || gain <= 0) continue;
    out.push({
      clip,
      start: item.start,
      in: item.in,
      out: item.out,
      gain,
      fadeIn: item.fadeIn,
      fadeOut: item.fadeOut,
    });
  }
  return out;
}

type Mediabunny = Awaited<ReturnType<typeof loadMediabunny>>;

/** Decodes a stretch's sound once; a file without sound gives nothing. */
async function decode(m: Mediabunny, stretch: Stretch) {
  if (stretch.buffers) return stretch.buffers;
  const buffers: { buffer: AudioBuffer; at: number }[] = [];
  const track = await openInput(m, stretch.clip.file).getPrimaryAudioTrack();
  if (track && (await track.canDecode())) {
    const sink = new m.AudioBufferSink(track);
    for await (const wrapped of sink.buffers(stretch.in, stretch.out))
      buffers.push({ buffer: wrapped.buffer, at: wrapped.timestamp });
  }
  stretch.buffers = buffers;
  return buffers;
}

/** Mixes timeline seconds `from` to `to` of every stretch into one buffer. */
async function mixWindow(
  m: Mediabunny,
  all: Stretch[],
  from: number,
  to: number,
): Promise<AudioBuffer> {
  const frames = Math.max(1, Math.round((to - from) * sampleRate));
  const context = new OfflineAudioContext(channels, frames, sampleRate);
  for (const stretch of all) {
    const length = stretch.out - stretch.in;
    const end = stretch.start + length;
    if (end <= from || stretch.start >= to) continue;
    const gain = context.createGain();
    gain.connect(context.destination);
    // the stretch's loudness over this window, fades included
    const at = (t: number) => {
      const local = t - stretch.start;
      let g = stretch.gain;
      if (stretch.fadeIn > 0 && local < stretch.fadeIn)
        g *= Math.max(0, local / stretch.fadeIn);
      if (stretch.fadeOut > 0 && local > length - stretch.fadeOut)
        g *= Math.max(0, (length - local) / stretch.fadeOut);
      return g;
    };
    const steps = 64;
    const curve = new Float32Array(steps);
    for (let i = 0; i < steps; i++)
      curve[i] = at(from + ((to - from) * i) / (steps - 1));
    gain.gain.setValueCurveAtTime(curve, 0, to - from);
    for (const { buffer, at: clipAt } of await decode(m, stretch)) {
      // where this decoded piece lands on the timeline
      const begins = stretch.start + (clipAt - stretch.in);
      const finish = begins + buffer.duration;
      if (finish <= from || begins >= to) continue;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      const when = Math.max(0, begins - from);
      const offset = Math.max(0, from - begins);
      // a decoded piece may start before the in point or run past the out point
      const clipStart = Math.max(offset, stretch.in - clipAt);
      const clipEnd = Math.min(buffer.duration, stretch.out - clipAt);
      if (clipEnd <= clipStart) continue;
      source.start(
        when + (clipStart - offset),
        clipStart,
        Math.min(clipEnd - clipStart, to - from - when),
      );
    }
  }
  return context.startRendering();
}

/** Hands out the frame for each output time, piece by piece, in order. */
class Frames {
  #m: Mediabunny;
  #clips: ReadonlyMap<string, Clip>;
  #edit: Edit;
  #begins: number[];
  #index = -1;
  #samples: AsyncGenerator<import('mediabunny').VideoSample> | null = null;
  #current: import('mediabunny').VideoSample | null = null;
  #next: import('mediabunny').VideoSample | null = null;

  constructor(m: Mediabunny, clips: ReadonlyMap<string, Clip>, edit: Edit) {
    this.#m = m;
    this.#clips = clips;
    this.#edit = edit;
    this.#begins = starts(edit.pieces);
  }

  /** The piece at timeline second `t` and its frame there, or null past the video. */
  async at(t: number) {
    const pieces = this.#edit.pieces;
    if (t >= total(pieces)) {
      await this.close();
      return null;
    }
    let index = this.#index;
    while (
      index < pieces.length - 1 &&
      (index < 0 || t >= this.#begins[index]! + lengthOf(pieces[index]!))
    )
      index++;
    const piece = pieces[index]!;
    if (index !== this.#index) {
      await this.close();
      this.#index = index;
      const clip = this.#clips.get(piece.clip);
      if (clip) {
        const track = await openInput(
          this.#m,
          clip.file,
        ).getPrimaryVideoTrack();
        if (track && (await track.canDecode()))
          this.#samples = new this.#m.VideoSampleSink(track).samples(
            piece.in,
            piece.out,
          );
      }
    }
    const clipTime = piece.in + (t - this.#begins[index]!);
    // step forward to the last frame that starts at or before clipTime
    while (this.#samples) {
      if (!this.#next) {
        const step = await this.#samples.next();
        if (step.done) break;
        this.#next = step.value;
      }
      if (this.#current && this.#next.timestamp > clipTime + 1e-6) break;
      this.#current?.close();
      this.#current = this.#next;
      this.#next = null;
    }
    return { piece, sample: this.#current, local: t - this.#begins[index]! };
  }

  async close() {
    this.#current?.close();
    this.#next?.close();
    this.#current = null;
    this.#next = null;
    await this.#samples?.return(undefined);
    this.#samples = null;
  }
}

/** Renders and encodes the edit. Aborting the signal stops it with an AbortError. */
export async function exportEdit(
  clips: readonly Clip[],
  edit: Edit,
  options: ExportOptions,
): Promise<ExportResult> {
  const m = await loadMediabunny();
  const clipMap = new Map(clips.map((clip) => [clip.id, clip]));
  const length = editLength(edit);
  if (length <= 0) throw new Error('export-empty');
  const { width, height, fps, signal } = options;
  const format =
    options.container === 'webm'
      ? new m.WebMOutputFormat()
      : new m.Mp4OutputFormat({ fastStart: 'in-memory' });
  const output = new m.Output({ format, target: new m.BufferTarget() });

  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d', { alpha: false })!;
  const video = new m.CanvasSource(canvas, {
    codec: options.codec,
    bitrate: options.bitrate,
  });
  output.addVideoTrack(video, { frameRate: fps });

  const sounds = options.sound ? stretches(clipMap, edit) : [];
  const audio = options.sound
    ? new m.AudioBufferSource({
        codec: CONTAINER_CODECS[options.container].audio,
        bitrate: audioBitrate,
      })
    : null;
  if (audio) output.addAudioTrack(audio);

  const frames = new Frames(m, clipMap, edit);
  const totalFrames = Math.max(1, Math.round(length * fps));
  const abort = () => {
    if (signal?.aborted)
      throw new DOMException('The export was stopped', 'AbortError');
  };

  try {
    await output.start();
    let frame = 0;
    for (let from = 0; from < length; from += windowSeconds) {
      abort();
      const to = Math.min(length, from + windowSeconds);
      if (audio) await audio.add(await mixWindow(m, sounds, from, to));
      for (; frame < totalFrames && frame / fps < to - 1e-9; frame++) {
        abort();
        const t = frame / fps;
        const shown = await frames.at(t);
        context.globalAlpha = 1;
        context.fillStyle = '#000';
        context.fillRect(0, 0, width, height);
        if (shown?.sample) {
          const { piece, sample, local } = shown;
          const len = lengthOf(piece);
          let alpha = 1;
          if (piece.fadeIn > 0 && local < piece.fadeIn)
            alpha = Math.min(alpha, local / piece.fadeIn);
          if (piece.fadeOut > 0 && local > len - piece.fadeOut)
            alpha = Math.min(alpha, (len - local) / piece.fadeOut);
          context.globalAlpha = Math.max(0, Math.min(1, alpha));
          sample.drawWithFit(context, { fit: options.fit });
          context.globalAlpha = 1;
        }
        await video.add(t, 1 / fps);
        options.onProgress?.(Math.min(0.99, (frame + 1) / totalFrames));
      }
    }
    await frames.close();
    await output.finalize();
  } catch (error) {
    await frames.close();
    await output.cancel().catch(() => undefined);
    throw error;
  }
  const buffer = output.target.buffer;
  if (!buffer) throw new Error('export-empty');
  options.onProgress?.(1);
  return {
    blob: new Blob([buffer], { type: format.mimeType }),
    ext: format.fileExtension.replace(/^\./, ''),
  };
}
