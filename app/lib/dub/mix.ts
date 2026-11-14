/**
 * Turning spoken lines into a dub track: fit each line to its slot, even out
 * the loudness so every engine sounds alike, and mix over the background (the
 * original's music and effects without its voices), over the original kept
 * quietly under the voice, or over nothing.
 */
import { audioContext } from 'xsenze-tools/lib/audio';
import type { Speech } from 'xsenze-tools/lib/dub/voice';

export const MIX_RATE = 48000;
/** Fastest a line may be sped up to fit its slot. */
export const MAX_SPEED = 1.3;
/** Slowest a hurried line may be slowed towards the original's pace. */
export const MIN_SPEED = 0.85;
/** Silence fed before a line while stretching, so the stretcher's warm-up falls on it. */
const STRETCH_LEAD = 0.25;
/** The original's level under the voice when ducked (about -15 dB). */
const DUCK_GAIN = 0.18;
const DUCK_RAMP = 0.12;
/** Every line is brought to this RMS level before mixing (about -20 dBFS). */
const TARGET_RMS = 0.1;
const PEAK_LIMIT = 0.95;

/** music: the separated background at full level; duck: the original, quieter under each line; dub: nothing. */
export type Background = 'music' | 'duck' | 'dub';

export interface PlacedLine {
  /** Seconds from the start of the file. */
  start: number;
  speech: Speech;
  /** Speed applied at mix time when the engine has no speed control: above 1 is faster. Pitch is kept. */
  rate?: number;
}

/** `speech` played at `rate` (above 1 is faster) with its pitch kept. */
export async function stretched(speech: Speech, rate: number): Promise<Speech> {
  if (Math.abs(rate - 1) < 0.01) return speech;
  const { default: SignalsmithStretch } = await import('signalsmith-stretch');
  const lead = Math.round(STRETCH_LEAD * speech.rate);
  const input = new Float32Array(lead + speech.audio.length);
  input.set(speech.audio, lead);
  const length = Math.ceil(input.length / rate) + Math.round(0.1 * speech.rate);
  const ctx = new OfflineAudioContext(1, length, speech.rate);
  const node = await SignalsmithStretch(ctx, {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [1],
  });
  await node.addBuffers([input]);
  node.schedule({ active: true, input: 0, output: 0, rate });
  node.connect(ctx.destination);
  const out = (await ctx.startRendering()).getChannelData(0);
  const from = Math.round(lead / rate);
  return {
    audio: out.slice(from, from + Math.round(speech.audio.length / rate)),
    rate: speech.rate,
  };
}

/** Decode any audio or video file to an AudioBuffer at the mix rate. */
export async function decodeForMix(file: Blob): Promise<AudioBuffer> {
  const decoded = await audioContext().decodeAudioData(
    await file.arrayBuffer(),
  );
  if (decoded.sampleRate === MIX_RATE) return decoded;
  const offline = new OfflineAudioContext(
    Math.min(2, decoded.numberOfChannels),
    Math.ceil(decoded.duration * MIX_RATE),
    MIX_RATE,
  );
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  return offline.startRendering();
}

/** Seconds of a spoken line. */
export const seconds = (s: Speech) => s.audio.length / s.rate;

/** The line at a common level: RMS to the target, peaks kept under the limit. */
function levelled(s: Speech): Float32Array {
  let sum = 0;
  let peak = 0;
  for (const v of s.audio) {
    sum += v * v;
    peak = Math.max(peak, Math.abs(v));
  }
  const rms = Math.sqrt(sum / Math.max(1, s.audio.length));
  if (!rms || !peak) return s.audio;
  const gain = Math.min(TARGET_RMS / rms, PEAK_LIMIT / peak);
  return s.audio.map((v) => v * gain);
}

/** Merged [start, end] windows where some line is speaking. */
function speakingWindows(lines: PlacedLine[]): [number, number][] {
  const spans = lines
    .map((l): [number, number] => [
      l.start,
      l.start + seconds(l.speech) / (l.rate ?? 1),
    ])
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [a, b] of spans) {
    const last = merged.at(-1);
    if (last && a <= last[1] + 0.4) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  return merged;
}

/** Mix the lines into one stereo track at the mix rate; 'music' plays `bed`, the separated background. */
export async function renderDub(
  original: AudioBuffer,
  lines: PlacedLine[],
  background: Background,
  bed?: AudioBuffer,
): Promise<AudioBuffer> {
  const end = Math.max(
    original.duration,
    ...lines.map((l) => l.start + seconds(l.speech) / (l.rate ?? 1)),
  );
  const ctx = new OfflineAudioContext(2, Math.ceil(end * MIX_RATE), MIX_RATE);

  if (background === 'duck') {
    const src = ctx.createBufferSource();
    src.buffer = original;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1, 0);
    for (const [a, b] of speakingWindows(lines)) {
      const from = Math.max(0, a - DUCK_RAMP);
      gain.gain.setValueAtTime(1, from);
      gain.gain.linearRampToValueAtTime(DUCK_GAIN, from + DUCK_RAMP);
      gain.gain.setValueAtTime(DUCK_GAIN, b);
      gain.gain.linearRampToValueAtTime(1, b + DUCK_RAMP);
    }
    src.connect(gain).connect(ctx.destination);
    src.start();
  } else if (background === 'music' && bed) {
    const src = ctx.createBufferSource();
    src.buffer = bed;
    src.connect(ctx.destination);
    src.start();
  }

  for (const line of lines) {
    const speech = await stretched(line.speech, line.rate ?? 1);
    const data = levelled(speech);
    const buffer = ctx.createBuffer(1, data.length, speech.rate);
    buffer.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(line.start);
  }

  const out = await ctx.startRendering();
  // keep the sum under full scale
  let peak = 0;
  for (let c = 0; c < out.numberOfChannels; c++)
    for (const v of out.getChannelData(c)) peak = Math.max(peak, Math.abs(v));
  if (peak > PEAK_LIMIT) {
    const g = PEAK_LIMIT / peak;
    for (let c = 0; c < out.numberOfChannels; c++) {
      const ch = out.getChannelData(c);
      for (let i = 0; i < ch.length; i++) ch[i] = ch[i]! * g;
    }
  }
  return out;
}
