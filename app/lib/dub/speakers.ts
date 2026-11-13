/**
 * Who speaks each line: a voiceprint per line (speaker worker), lines grouped
 * by how alike their voiceprints are, then each group's pitch for a voice type
 * and a preset voice of its own.
 */
import {
  FEMALE_PRESETS,
  MALE_PRESETS,
  type Preset,
  type VoiceGender,
} from 'xsenze-tools/lib/dub/engines';
import type { Cue } from 'xsenze-tools/lib/subtitles';

export type VoiceType = 'woman' | 'man' | 'child' | 'older-woman' | 'older-man';
export type VoiceMode = 'auto' | VoiceGender;

export const VOICE_TYPES: VoiceType[] = [
  'woman',
  'man',
  'child',
  'older-woman',
  'older-man',
];
export const VOICE_TYPE_LABELS: Record<VoiceType, string> = {
  woman: 'Woman',
  man: 'Man',
  child: 'Child',
  'older-woman': 'Older woman',
  'older-man': 'Older man',
};

export interface Speaker {
  /** S1, S2…: the number shown, kept through renames and merges. */
  id: number;
  name: string;
  type: VoiceType;
  /** A chosen preset, or auto for the matched one. */
  voice: 'auto' | Preset;
  /** Median pitch in Hz; 0 when none was heard. */
  pitch: number;
}

export interface Diarization {
  speakers: Speaker[];
  /** Index into `speakers` for each cue. */
  assign: number[];
}

/** Auto finds at most this many. */
export const MAX_SPEAKERS = 8;
/** Lines whose voiceprints are at least this alike are one person (cosine). */
const SAME_VOICE = 0.82;
/** Lines shorter than this give weak voiceprints: they join the nearest group. */
const RELIABLE_S = 1;
const RATE = 16000;

export const genderOf = (type: VoiceType): VoiceGender =>
  type === 'man' || type === 'older-man' ? 'male' : 'female';

/* --- pitch --- */

/** Pitch apart by more than this many semitones counts against one voice. */
const PITCH_SLACK = 3;
/** Similarity taken off per semitone beyond the slack. */
const PITCH_WEIGHT = 0.04;

/** How much a pitch difference lowers two voiceprints' likeness. */
function pitchGap(a = 0, b = 0): number {
  if (!a || !b) return 0;
  const semitones = Math.abs(12 * Math.log2(a / b));
  return Math.max(0, semitones - PITCH_SLACK) * PITCH_WEIGHT;
}

/** Median fundamental of the voiced frames, by normalised autocorrelation. */
export function medianPitch(segments: Float32Array[]): number {
  const frame = 1024;
  const hop = 512;
  const minLag = Math.floor(RATE / 500);
  const maxLag = Math.ceil(RATE / 70);
  const found: number[] = [];
  for (const pcm of segments) {
    for (let at = 0; at + frame + maxLag < pcm.length; at += hop) {
      let energy = 0;
      for (let i = 0; i < frame; i++) energy += pcm[at + i]! ** 2;
      if (Math.sqrt(energy / frame) < 0.01) continue;
      const scores = new Float32Array(maxLag + 1);
      let best = 0;
      for (let lag = minLag; lag <= maxLag; lag++) {
        let sum = 0;
        let a = 0;
        let b = 0;
        for (let i = 0; i < frame; i++) {
          const x = pcm[at + i]!;
          const y = pcm[at + i + lag]!;
          sum += x * y;
          a += x * x;
          b += y * y;
        }
        const r = sum / (Math.sqrt(a * b) || 1);
        scores[lag] = r;
        if (r > best) best = r;
      }
      if (best < 0.6) continue;
      // the shortest lag near the best: avoids reading an octave low
      for (let lag = minLag; lag <= maxLag; lag++)
        if (scores[lag]! >= best * 0.9) {
          found.push(RATE / lag);
          break;
        }
    }
  }
  if (!found.length) return 0;
  found.sort((x, y) => x - y);
  return found[Math.floor(found.length / 2)]!;
}

function medianOf(values: number[]): number {
  const v = values.filter((x) => x > 0).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)]! : 0;
}

/** A first guess from pitch alone; the user can correct it. */
export function typeFromPitch(hz: number): VoiceType {
  if (hz > 255) return 'child';
  if (hz > 160) return 'woman';
  return 'man';
}

/* --- voiceprints --- */

type WorkerReply =
  | { type: 'progress'; id: number; phase: 'download' | 'embed'; ratio: number }
  | { type: 'result'; id: number; embeddings: Float32Array[] }
  | { type: 'error'; id: number; message: string };

let worker: Worker | null = null;
let nextId = 0;

function embed(
  segments: Float32Array[],
  onProgress: (phase: 'download' | 'embed', ratio: number) => void,
): Promise<Float32Array[]> {
  worker ??= new Worker(new URL('./speaker.worker.ts', import.meta.url), {
    type: 'module',
  });
  const w = worker;
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const listen = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data;
      if (reply.id !== id) return;
      if (reply.type === 'progress') {
        onProgress(reply.phase, reply.ratio);
        return;
      }
      w.removeEventListener('message', listen);
      if (reply.type === 'result') resolve(reply.embeddings);
      else reject(new Error(reply.message));
    };
    w.addEventListener('message', listen);
    w.postMessage({ type: 'embed', id, segments });
  });
}

function unit(v: Float32Array): Float32Array {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}

function dot(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
}

function mean(vectors: Float32Array[]): Float32Array {
  const out = new Float32Array(vectors[0]!.length);
  for (const v of vectors) for (let i = 0; i < v.length; i++) out[i]! += v[i]!;
  return unit(out);
}

/**
 * Average-linkage grouping: join the two most alike groups until `count`
 * remain, or (count 0) until no two are alike enough.
 */
export function cluster(
  prints: Float32Array[],
  count: number,
  pitches: number[] = [],
): number[][] {
  const groups = prints.map((_, i) => [i]);
  const sim = prints.map((a, i) =>
    prints.map((b, j) => dot(a, b) - pitchGap(pitches[i], pitches[j])),
  );
  const link = (g: number[], h: number[]) => {
    let s = 0;
    for (const i of g) for (const j of h) s += sim[i]![j]!;
    return s / (g.length * h.length);
  };
  for (;;) {
    if (groups.length <= 1) break;
    if (count > 0 && groups.length <= count) break;
    let best = -Infinity;
    let pair: [number, number] = [0, 1];
    for (let i = 0; i < groups.length; i++)
      for (let j = i + 1; j < groups.length; j++) {
        const s = link(groups[i]!, groups[j]!);
        if (s > best) {
          best = s;
          pair = [i, j];
        }
      }
    if (count === 0 && best < SAME_VOICE && groups.length <= MAX_SPEAKERS)
      break;
    const [i, j] = pair;
    groups[i] = [...groups[i]!, ...groups[j]!];
    groups.splice(j, 1);
  }
  return groups;
}

/** The cue's audio, at most 10 s; very short lines widen to half a second. */
function slice(pcm: Float32Array, cue: Cue): Float32Array {
  let start = Math.floor((cue.start / 1000) * RATE);
  let end = Math.min(
    Math.ceil((cue.end / 1000) * RATE),
    start + 10 * RATE,
    pcm.length,
  );
  const min = RATE / 2;
  if (end - start < min) {
    const mid = (start + end) / 2;
    start = Math.max(0, Math.floor(mid - min / 2));
    end = Math.min(pcm.length, start + min);
  }
  return pcm.slice(start, Math.max(start + 1, end));
}

/** `groups` of cue indices; `segments` the audio of each turn. */
function speakersFrom(
  groups: number[][],
  segments: Float32Array[],
  turns: number[][],
  cueCount: number,
): Diarization {
  const turnOf = new Array<number>(cueCount).fill(0);
  turns.forEach((t, k) => t.forEach((i) => (turnOf[i] = k)));
  // S1 is who speaks first
  const ordered = groups
    .filter((g) => g.length)
    .sort((a, b) => Math.min(...a) - Math.min(...b));
  const assign = new Array<number>(cueCount).fill(0);
  const speakers = ordered.map((members, index) => {
    for (const m of members) assign[m] = index;
    const own = [...new Set(members.map((m) => turnOf[m]!))];
    const pitch = medianPitch(own.map((t) => segments[t]!));
    return {
      id: index + 1,
      name: '',
      type: typeFromPitch(pitch),
      voice: 'auto' as const,
      pitch,
    };
  });
  return { speakers, assign };
}

/** Find the speakers of `cues` in mono 16 kHz `pcm`; `count` 0 finds how many. */
export async function diarize(
  pcm: Float32Array,
  cues: Cue[],
  count: number,
  onProgress: (phase: 'download' | 'embed', ratio: number) => void,
): Promise<Diarization> {
  // subtitle lines split sentences; a turn (lines with no pause between)
  // is one voice and gives a far steadier voiceprint
  const turns = turnsOf(cues);
  const spans: Cue[] = turns.map((t) => ({
    start: cues[t[0]!]!.start,
    end: cues[t[t.length - 1]!]!.end,
    text: '',
  }));
  const segments = spans.map((span) => slice(pcm, span));
  const toCues = (groups: number[][]) =>
    groups.map((g) => g.flatMap((t) => turns[t]!));
  if (count === 1 || turns.length < 2)
    return speakersFrom(
      toCues([turns.map((_, i) => i)]),
      segments,
      turns,
      cues.length,
    );

  const prints = (await embed(segments, onProgress)).map(unit);
  const long = spans
    .map((s, i) => ((s.end - s.start) / 1000 >= RELIABLE_S ? i : -1))
    .filter((i) => i >= 0);
  const core =
    long.length >= Math.max(2, count) ? long : spans.map((_, i) => i);
  const pitches = segments.map((seg) => medianPitch([seg]));
  const groups = cluster(
    core.map((i) => prints[i]!),
    Math.min(count, core.length),
    core.map((i) => pitches[i]!),
  ).map((g) => g.map((k) => core[k]!));

  // short turns join the group whose voiceprint is nearest
  const centres = groups.map((g) => mean(g.map((i) => prints[i]!)));
  const placed = new Set(core);
  for (let i = 0; i < spans.length; i++) {
    if (placed.has(i)) continue;
    let best = 0;
    let score = -Infinity;
    const centrePitch = groups.map((g) => medianOf(g.map((t) => pitches[t]!)));
    centres.forEach((c, k) => {
      const s = dot(c, prints[i]!) - pitchGap(centrePitch[k], pitches[i]);
      if (s > score) {
        score = s;
        best = k;
      }
    });
    groups[best]!.push(i);
  }
  return speakersFrom(toCues(groups), segments, turns, cues.length);
}

/** A pause shorter than this keeps the same speaker's turn going. */
const TURN_GAP_MS = 300;
/** A turn stops growing here, so one long run cannot hide a change. */
const TURN_MAX_MS = 12000;

/** Runs of cue indices with no real pause between them. */
function turnsOf(cues: Cue[]): number[][] {
  const turns: number[][] = [];
  cues.forEach((cue, i) => {
    const turn = turns[turns.length - 1];
    const prev = cues[i - 1];
    if (
      turn &&
      prev &&
      cue.start - prev.end < TURN_GAP_MS &&
      cue.end - cues[turn[0]!]!.start < TURN_MAX_MS
    )
      turn.push(i);
    else turns.push([i]);
  });
  return turns;
}

/* --- voices --- */

/**
 * A preset per speaker: a chosen one stays; the rest take the next unused
 * preset of their gender (from their type, or the forced gender), wrapping
 * when there are more speakers than presets.
 */
export function assignPresets(speakers: Speaker[], mode: VoiceMode): Preset[] {
  const used = new Set<Preset>(
    speakers.flatMap((s) => (s.voice === 'auto' ? [] : [s.voice])),
  );
  const next = { female: 0, male: 0 };
  return speakers.map((s) => {
    if (s.voice !== 'auto') return s.voice;
    const gender = mode === 'auto' ? genderOf(s.type) : mode;
    const list = gender === 'female' ? FEMALE_PRESETS : MALE_PRESETS;
    const free = list.find((p) => !used.has(p));
    if (free) {
      used.add(free);
      return free;
    }
    return list[next[gender]++ % list.length]!;
  });
}

export const speakerLabel = (s: Speaker) =>
  s.name ? `S${s.id} ${s.name}` : `S${s.id}`;

/** The decoded file as mono 16 kHz, the rate the speaker model hears. */
export async function mono16k(buffer: AudioBuffer): Promise<Float32Array> {
  const frames = Math.max(1, Math.ceil(buffer.duration * RATE));
  const offline = new OfflineAudioContext(1, frames, RATE);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start();
  return (await offline.startRendering()).getChannelData(0);
}
