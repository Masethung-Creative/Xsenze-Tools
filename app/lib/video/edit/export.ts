/**
 * Video Edit's export: the edit rendered and encoded into one file, on the
 * device. The video track is drawn frame by frame onto one canvas (black
 * bars or a crop, fades, transitions), with the text and overlays over it;
 * every sound (the videos' own, Music, Voice) is mixed with its volume and
 * fades into 48 kHz stereo. Both are made in windows of a few seconds, so
 * memory stays low and the two tracks are written side by side.
 */
import type { StreamTargetChunk } from 'mediabunny';
import { loadMediabunny, openInput } from 'xsenze-tools/lib/video/media-probe';
import { stretchBuffer } from 'xsenze-tools/lib/audio/stretch';
import { encodeWav } from 'xsenze-tools/lib/audio/audio';
import { AnimatedGifEncoder } from 'xsenze-tools/lib/video/gif';
import {
  drawShots,
  type Fit,
  type Picture,
  type Shot,
} from 'xsenze-tools/lib/video/edit/draw';
import { drawLayer, fontsOf } from 'xsenze-tools/lib/video/edit/layers';
import {
  duckAt,
  endOf,
  layerEnd,
  total,
  editLength,
  fadeAt,
  layersAt,
  lengthOf,
  overlapOf,
  showingAt,
  starts,
  type Clip,
  type Edit,
  type Level,
  type Place,
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
  /**
   * Writes the file here as it renders, so a long video never sits whole
   * in memory; the result then has no blob.
   */
  writable?: WritableStream<StreamTargetChunk>;
}

export interface ExportResult {
  /** The file, or null when it went straight to `writable`. */
  blob: Blob | null;
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
  /** Plays this many times faster; its sound is stretched with the pitch kept. */
  speed?: number;
  gain: number;
  fadeIn: number;
  fadeOut: number;
  /** A further level over timeline seconds: the music's ducking. */
  shape?: (t: number) => number;
  /** Decoded audio of in..out, filled on first use. */
  buffers?: { buffer: AudioBuffer; at: number }[];
}

/** One buffer of `in`..`out` from decoded pieces that may run past either end. */
function joined(
  buffers: { buffer: AudioBuffer; at: number }[],
  from: number,
  to: number,
): AudioBuffer | null {
  const first = buffers[0]?.buffer;
  if (!first) return null;
  const rate = first.sampleRate;
  const channels = first.numberOfChannels;
  const length = Math.max(1, Math.round((to - from) * rate));
  const out = new AudioBuffer({
    numberOfChannels: channels,
    length,
    sampleRate: rate,
  });
  for (const { buffer, at } of buffers) {
    const offset = Math.round((at - from) * rate);
    for (let c = 0; c < channels; c++) {
      const data = buffer.getChannelData(
        Math.min(c, buffer.numberOfChannels - 1),
      );
      const skip = Math.max(0, -offset);
      const room = length - Math.max(0, offset);
      if (room <= 0 || skip >= data.length) continue;
      out.copyToChannel(
        data.subarray(skip, skip + Math.min(room, data.length - skip)),
        c,
        Math.max(0, offset),
      );
    }
  }
  return out;
}

/** Every sound in the edit as stretches; silent ones are left out. */
function stretches(clips: ReadonlyMap<string, Clip>, edit: Edit): Stretch[] {
  const out: Stretch[] = [];
  const videoLevel = levelGain(edit.mix.video);
  const begins = starts(edit.pieces);
  edit.pieces.forEach((piece, i) => {
    const clip = clips.get(piece.clip);
    const gain = (piece.muted ? 0 : piece.volume) * videoLevel;
    if (!clip?.hasAudio || clip.kind !== 'video' || gain <= 0) return;
    out.push({
      clip,
      start: begins[i]!,
      in: piece.in,
      out: piece.out,
      speed: piece.speed || 1,
      gain,
      // a transition crossfades the sound of the two pieces
      fadeIn: Math.max(piece.fadeIn, overlapOf(edit.pieces, i)),
      fadeOut: Math.max(piece.fadeOut, overlapOf(edit.pieces, i + 1)),
    });
  });
  for (const layer of edit.layers) {
    const clip = clips.get(layer.clip ?? '');
    const gain = (layer.muted ? 0 : layer.volume) * videoLevel;
    if (layer.kind !== 'video' || !clip?.hasAudio || gain <= 0) continue;
    out.push({
      clip,
      start: layer.start,
      in: layer.in,
      out: Math.min(clip.duration, layer.in + layer.length),
      gain,
      fadeIn: 0,
      fadeOut: 0,
    });
  }
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
      shape: item.lane === 'music' ? (t) => duckAt(edit, t) : undefined,
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
  const speed = stretch.speed ?? 1;
  if (Math.abs(speed - 1) >= 0.01 && buffers.length) {
    // a sped-up piece: its sound is stretched with the pitch kept, and the
    // stretch is then measured in timeline seconds from 0
    const whole = joined(buffers, stretch.in, stretch.out);
    if (whole) {
      const faster = await stretchBuffer(whole, speed);
      stretch.in = 0;
      stretch.out = faster.duration;
      stretch.speed = 1;
      stretch.buffers = [{ buffer: faster, at: 0 }];
      return stretch.buffers;
    }
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
  rate = sampleRate,
  channelCount = channels,
): Promise<AudioBuffer> {
  const frames = Math.max(1, Math.round((to - from) * rate));
  const context = new OfflineAudioContext(channelCount, frames, rate);
  for (const stretch of all) {
    const timelineLength = (stretch.out - stretch.in) / (stretch.speed ?? 1);
    if (stretch.start + timelineLength <= from || stretch.start >= to) continue;
    // decoding first turns a sped-up stretch into timeline seconds
    await decode(m, stretch);
    const length = stretch.out - stretch.in;
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
      return stretch.shape ? g * stretch.shape(t) : g;
    };
    // fine enough for a duck's easing
    const steps = 256;
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

type Sample = import('mediabunny').VideoSample;

/** Frames of one stretch of a video, handed out in time order. */
class Reader {
  #samples: AsyncGenerator<Sample> | null;
  #current: Sample | null = null;
  #next: Sample | null = null;

  private constructor(samples: AsyncGenerator<Sample> | null) {
    this.#samples = samples;
  }

  static async open(m: Mediabunny, clip: Clip, from: number, to: number) {
    const track = await openInput(m, clip.file).getPrimaryVideoTrack();
    const samples =
      track && (await track.canDecode())
        ? new m.VideoSampleSink(track).samples(from, to)
        : null;
    return new Reader(samples);
  }

  /** The last frame that starts at or before clip second `t`. */
  async at(t: number): Promise<Picture | null> {
    while (this.#samples) {
      if (!this.#next) {
        const step = await this.#samples.next();
        if (step.done) break;
        this.#next = step.value;
      }
      if (this.#current && this.#next.timestamp > t + 1e-6) break;
      this.#current?.close();
      this.#current = this.#next;
      this.#next = null;
    }
    const sample = this.#current;
    return sample
      ? {
          source: sample.toCanvasImageSource(),
          width: sample.codedWidth,
          height: sample.codedHeight,
          rotation: sample.rotation,
        }
      : null;
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

/**
 * Hands out the pictures each output frame needs: the pieces on show and
 * the overlay videos and pictures. A reader closes once its stretch is past.
 */
class Pictures {
  #m: Mediabunny;
  #readers = new Map<string, Promise<Reader>>();
  #photos = new Map<string, Promise<ImageBitmap | null>>();
  #used = new Set<string>();
  /**
   * How far before the asked-for second a reader starts: all of its stretch
   * for an export, a moment for a single frame.
   */
  #after: number;

  constructor(m: Mediabunny, after = Infinity) {
    this.#m = m;
    this.#after = after;
  }

  /** A video's frame at clip second `t`, from the reader under `key`. */
  async frame(
    key: string,
    clip: Clip,
    from: number,
    to: number,
    t: number,
  ): Promise<Picture | null> {
    this.#used.add(key);
    let reader = this.#readers.get(key);
    if (!reader) {
      reader = Reader.open(
        this.#m,
        clip,
        Math.max(from, Math.min(t, to) - this.#after),
        to,
      );
      this.#readers.set(key, reader);
    }
    return (await reader).at(t);
  }

  /** A photo, decoded once for the whole export. */
  async photo(clip: Clip): Promise<Picture | null> {
    let bitmap = this.#photos.get(clip.id);
    if (!bitmap) {
      bitmap = createImageBitmap(clip.file).catch(() => null);
      this.#photos.set(clip.id, bitmap);
    }
    const image = await bitmap;
    return image
      ? { source: image, width: image.width, height: image.height }
      : null;
  }

  /** Closes the readers this frame did not use: time only goes on. */
  async sweep() {
    for (const [key, reader] of this.#readers)
      if (!this.#used.has(key)) {
        this.#readers.delete(key);
        await (await reader).close();
      }
    this.#used.clear();
  }

  async close() {
    for (const reader of this.#readers.values()) await (await reader).close();
    this.#readers.clear();
    for (const bitmap of this.#photos.values()) (await bitmap)?.close();
    this.#photos.clear();
  }
}

/** Draws output second `t`: the video track, then the layers. */
async function drawFrame(
  context: OffscreenCanvasRenderingContext2D,
  pictures: Pictures,
  clips: ReadonlyMap<string, Clip>,
  edit: Edit,
  t: number,
  W: number,
  H: number,
  fit: Fit,
) {
  const show = showingAt(edit.pieces, t);
  const shot = async (place: Place): Promise<Shot> => {
    const { piece, index, clipTime } = place;
    const clip = clips.get(piece.clip);
    const picture = !clip
      ? null
      : clip.kind === 'image'
        ? await pictures.photo(clip)
        : await pictures.frame(
            `p${index}`,
            clip,
            piece.in,
            piece.out,
            clipTime,
          );
    const local = (clipTime - piece.in) / (piece.speed || 1);
    return {
      picture,
      look: piece.look,
      fade: fadeAt(local, lengthOf(piece), piece.fadeIn, piece.fadeOut),
      progress: local / Math.max(1e-6, lengthOf(piece)),
    };
  };
  if (show) {
    const a = await shot(show.a);
    const b = show.b ? await shot(show.b) : null;
    drawShots(context, a, b, show.kind, show.p, W, H, fit, edit.background);
  } else {
    context.save();
    context.globalAlpha = 1;
    context.filter = 'none';
    context.fillStyle = '#000';
    context.fillRect(0, 0, W, H);
    context.restore();
  }
  for (const layer of layersAt(edit.layers, t)) {
    const clip = clips.get(layer.clip ?? '');
    let picture: Picture | null = null;
    if (layer.kind === 'picture' && clip) picture = await pictures.photo(clip);
    if (layer.kind === 'video' && clip)
      picture = await pictures.frame(
        `l${layer.id}`,
        clip,
        layer.in,
        layer.in + layer.length,
        layer.in + (t - layer.start),
      );
    if (layer.kind === 'video' && picture?.rotation) {
      // an overlay video is drawn as stored; turned files go through a canvas
      picture = upright(picture);
    }
    drawLayer(
      context,
      layer,
      picture?.source ?? null,
      picture ? picture.width / picture.height : 1,
      W,
      H,
      t,
    );
  }
  await pictures.sweep();
}

let turnCanvas: OffscreenCanvas | null = null;

/** A turned video frame, drawn the right way up. */
function upright(picture: Picture): Picture {
  const turned = (picture.rotation ?? 0) % 180 !== 0;
  const width = turned ? picture.height : picture.width;
  const height = turned ? picture.width : picture.height;
  turnCanvas ??= new OffscreenCanvas(width, height);
  turnCanvas.width = width;
  turnCanvas.height = height;
  const ctx = turnCanvas.getContext('2d')!;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(((picture.rotation ?? 0) * Math.PI) / 180);
  ctx.drawImage(
    picture.source,
    -picture.width / 2,
    -picture.height / 2,
    picture.width,
    picture.height,
  );
  ctx.restore();
  return { source: turnCanvas, width, height };
}

/** Waits for the fonts the titles use, so the first frames have them. */
async function fontsReady(edit: Edit) {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all(
    fontsOf(edit.layers).map((font) =>
      document.fonts.load(font).catch(() => []),
    ),
  );
}

/**
 * The edit's speech as 16 kHz mono, for Whisper: the videos' sound and the
 * Voice layer, without the music.
 */
export async function mixSpeech(
  clips: readonly Clip[],
  edit: Edit,
  onProgress?: (fraction: number) => void,
): Promise<Float32Array> {
  const m = await loadMediabunny();
  const clipMap = new Map(clips.map((clip) => [clip.id, clip]));
  const music = new Set(
    edit.audio.filter((item) => item.lane === 'music').map((item) => item.id),
  );
  const speech = stretches(clipMap, {
    ...edit,
    audio: edit.audio.filter((item) => !music.has(item.id)),
  });
  // to the last sound, not the last caption
  const length = Math.max(
    total(edit.pieces),
    ...edit.audio.map(endOf),
    ...edit.layers.filter((l) => l.kind === 'video').map(layerEnd),
    0,
  );
  const rate = 16000;
  const out = new Float32Array(Math.max(1, Math.ceil(length * rate)));
  for (let from = 0; from < length; from += windowSeconds) {
    const to = Math.min(length, from + windowSeconds);
    const mixed = await mixWindow(m, speech, from, to, rate, 1);
    out.set(
      mixed.getChannelData(0).subarray(0, out.length - Math.round(from * rate)),
      Math.round(from * rate),
    );
    onProgress?.(to / length);
  }
  return out;
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
  await fontsReady(edit);
  const direct = options.writable;
  const format =
    options.container === 'webm'
      ? new m.WebMOutputFormat()
      : // written to disk, the index goes at the end: nothing waits in memory
        new m.Mp4OutputFormat({ fastStart: direct ? false : 'in-memory' });
  const target = direct
    ? new m.StreamTarget(direct, { chunked: true })
    : new m.BufferTarget();
  const output = new m.Output({ format, target });

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

  const pictures = new Pictures(m);
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
        await drawFrame(
          context,
          pictures,
          clipMap,
          edit,
          t,
          width,
          height,
          options.fit,
        );
        await video.add(t, 1 / fps);
        options.onProgress?.(Math.min(0.99, (frame + 1) / totalFrames));
      }
    }
    await pictures.close();
    await output.finalize();
  } catch (error) {
    await pictures.close();
    await output.cancel().catch(() => undefined);
    throw error;
  }
  options.onProgress?.(1);
  const ext = format.fileExtension.replace(/^\./, '');
  if (direct) return { blob: null, ext };
  const buffer = (target as InstanceType<Mediabunny['BufferTarget']>).buffer;
  if (!buffer) throw new Error('export-empty');
  return { blob: new Blob([buffer], { type: format.mimeType }), ext };
}

/** One frame of the edit, as the export draws it, as a PNG. */
export async function exportFrame(
  clips: readonly Clip[],
  edit: Edit,
  t: number,
  width: number,
  height: number,
  fit: Fit,
): Promise<Blob> {
  const m = await loadMediabunny();
  await fontsReady(edit);
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d', { alpha: false })!;
  const pictures = new Pictures(m, 0.05);
  try {
    await drawFrame(
      context,
      pictures,
      new Map(clips.map((clip) => [clip.id, clip])),
      edit,
      Math.max(0, t),
      width,
      height,
      fit,
    );
  } finally {
    await pictures.close();
  }
  return canvas.convertToBlob({ type: 'image/png' });
}

export interface GifOptions {
  width: number;
  height: number;
  fps: number;
  fit: Fit;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

/** The edit as a looping GIF, without sound. */
export async function exportGif(
  clips: readonly Clip[],
  edit: Edit,
  options: GifOptions,
): Promise<Blob> {
  const m = await loadMediabunny();
  const length = editLength(edit);
  if (length <= 0) throw new Error('export-empty');
  const { width, height, fps, signal } = options;
  await fontsReady(edit);
  const clipMap = new Map(clips.map((clip) => [clip.id, clip]));
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d', {
    alpha: false,
    willReadFrequently: true,
  })!;
  const encoder = new AnimatedGifEncoder(width, height);
  const pictures = new Pictures(m);
  const frames = Math.max(1, Math.round(length * fps));
  try {
    for (let frame = 0; frame < frames; frame++) {
      if (signal?.aborted)
        throw new DOMException('The export was stopped', 'AbortError');
      await drawFrame(
        context,
        pictures,
        clipMap,
        edit,
        frame / fps,
        width,
        height,
        options.fit,
      );
      // GIF times are in hundredths: rounded as running totals, they keep time
      const delay =
        Math.round(((frame + 1) * 100) / fps) - Math.round((frame * 100) / fps);
      encoder.addFrame(
        context.getImageData(0, 0, width, height).data,
        delay * 10,
      );
      options.onProgress?.(Math.min(0.99, (frame + 1) / frames));
    }
  } finally {
    await pictures.close();
  }
  options.onProgress?.(1);
  return new Blob([encoder.finish()], { type: 'image/gif' });
}

export type SoundFormat = 'wav' | 'mp3';

export interface SoundOptions {
  format: SoundFormat;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

/** The edit's mixed sound alone, 48 kHz stereo, as WAV or MP3. */
export async function exportSound(
  clips: readonly Clip[],
  edit: Edit,
  options: SoundOptions,
): Promise<Blob> {
  const m = await loadMediabunny();
  const length = editLength(edit);
  if (length <= 0) throw new Error('export-empty');
  const sounds = stretches(new Map(clips.map((c) => [c.id, c])), edit);
  const abort = () => {
    if (options.signal?.aborted)
      throw new DOMException('The export was stopped', 'AbortError');
  };
  if (options.format === 'wav') {
    const frames = Math.max(1, Math.ceil(length * sampleRate));
    const left = new Float32Array(frames);
    const right = new Float32Array(frames);
    for (let from = 0; from < length; from += windowSeconds) {
      abort();
      const to = Math.min(length, from + windowSeconds);
      const mixed = await mixWindow(m, sounds, from, to);
      const at = Math.round(from * sampleRate);
      const room = frames - at;
      left.set(mixed.getChannelData(0).subarray(0, room), at);
      right.set(mixed.getChannelData(1).subarray(0, room), at);
      options.onProgress?.(Math.min(0.99, to / length));
    }
    options.onProgress?.(1);
    return new Blob([encodeWav([left, right], sampleRate)], {
      type: 'audio/wav',
    });
  }
  // browsers have no MP3 encoder of their own: a WASM one is added
  if (!(await m.canEncodeAudio('mp3'))) {
    const { registerMp3Encoder } = await import('@mediabunny/mp3-encoder');
    registerMp3Encoder();
  }
  const target = new m.BufferTarget();
  const output = new m.Output({ format: new m.Mp3OutputFormat(), target });
  const audio = new m.AudioBufferSource({ codec: 'mp3', bitrate: 192_000 });
  output.addAudioTrack(audio);
  try {
    await output.start();
    for (let from = 0; from < length; from += windowSeconds) {
      abort();
      const to = Math.min(length, from + windowSeconds);
      await audio.add(await mixWindow(m, sounds, from, to));
      options.onProgress?.(Math.min(0.99, to / length));
    }
    await output.finalize();
  } catch (error) {
    await output.cancel().catch(() => undefined);
    throw error;
  }
  options.onProgress?.(1);
  if (!target.buffer) throw new Error('export-empty');
  return new Blob([target.buffer], { type: 'audio/mpeg' });
}
