import type { Cue } from 'xsenze-tools/lib/subtitles';
import { isIosWebKit } from 'xsenze-tools/lib/platform';
import type { Mode, Word } from 'xsenze-tools/lib/whisper-models';

export {
  LANGUAGES,
  MODELS,
  resolveModel,
  progressAggregator,
  type Device,
  type DType,
  type Mode,
  type ModelResolution,
  type ProgressEvent,
  type Word,
} from 'xsenze-tools/lib/whisper-models';

export interface TranscribeOptions {
  mode: Mode;
  language?: string;
  onProgress?: (percent: number) => void;
}

const MAX_CHARS = 42;
const MAX_DURATION = 6000;
const GAP_BREAK = 0.8;

const SENTENCE_END = /[.!?…]["')\]]?$/;

export function wordsToCues(words: Word[]): Cue[] {
  const cues: Cue[] = [];
  let buf: Word[] = [];

  const flush = () => {
    if (buf.length === 0) return;
    cues.push({
      start: Math.round(buf[0]!.start * 1000),
      end: Math.round(buf[buf.length - 1]!.end * 1000),
      text: buf.map((w) => w.text).join(' '),
    });
    buf = [];
  };

  for (const w of words) {
    const last = buf[buf.length - 1];
    if (last) {
      const gap = w.start - last.end;
      const wouldLen =
        buf.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
      const wouldDur = w.end * 1000 - buf[0]!.start * 1000;
      if (gap > GAP_BREAK || wouldLen > MAX_CHARS || wouldDur > MAX_DURATION)
        flush();
    }
    buf.push(w);
    if (SENTENCE_END.test(w.text)) flush();
  }
  flush();
  return cues;
}

export async function toMono16k(file: File): Promise<Float32Array> {
  const ctx = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(await file.arrayBuffer());
  } finally {
    void ctx.close();
  }
  // offline context resamples mono
  const frames = Math.max(1, Math.ceil(decoded.duration * 16000));
  const offline = new OfflineAudioContext(1, frames, 16000);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

/* --- the worker: one for the page's lifetime, the model loads into it once --- */

type WorkerReply =
  | { type: 'progress'; id: number; percent: number }
  | { type: 'result'; id: number; words: Word[] }
  | { type: 'error'; id: number; message: string };

let worker: Worker | null = null;
let nextId = 0;

function whisperWorker(): Worker {
  worker ??= new Worker(new URL('./whisper.worker.ts', import.meta.url), {
    type: 'module',
  });
  return worker;
}

/** The words Whisper hears in `pcm` (mono, 16 kHz), with times in seconds. */
export function transcribeWords(
  pcm: Float32Array,
  options: TranscribeOptions,
): Promise<Word[]> {
  const w = whisperWorker();
  const id = nextId++;
  return new Promise<Word[]>((resolve, reject) => {
    const listen = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data;
      if (reply.id !== id) return;
      if (reply.type === 'progress') {
        options.onProgress?.(reply.percent);
        return;
      }
      w.removeEventListener('message', listen);
      if (reply.type === 'result') resolve(reply.words);
      else reject(new Error(reply.message));
    };
    w.addEventListener('message', listen);
    w.postMessage({
      type: 'run',
      id,
      pcm,
      mode: options.mode,
      language: options.language,
      noCache: isIosWebKit(),
    });
  });
}

/** Decode `file`, transcribe it in the worker and group the words into cues. */
export async function transcribe(
  file: File,
  options: TranscribeOptions,
): Promise<Cue[]> {
  const pcm = await toMono16k(file);
  return wordsToCues(await transcribeWords(pcm, options));
}
