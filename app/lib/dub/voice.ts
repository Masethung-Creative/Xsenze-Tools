import type { EngineId, VoiceGender } from 'xsenze-tools/lib/dub/engines';

/** One spoken line: mono samples at `rate`. */
export interface Speech {
  audio: Float32Array;
  rate: number;
}

type WorkerReply =
  | { type: 'progress'; id: number; ratio: number }
  | { type: 'result'; id: number; audio: Float32Array; rate: number }
  | { type: 'error'; id: number; message: string };

let worker: Worker | null = null;
let nextId = 0;

function voiceWorker(): Worker {
  worker ??= new Worker(new URL('./voice.worker.ts', import.meta.url), {
    type: 'module',
  });
  return worker;
}

/** Speak `text` with `engine` in the voice worker; `speed` above 1 is faster. */
export function speak(
  engine: EngineId,
  lang: string,
  text: string,
  voice: VoiceGender,
  speed = 1,
  onDownload?: (ratio: number) => void,
): Promise<Speech> {
  const w = voiceWorker();
  const id = nextId++;
  return new Promise<Speech>((resolve, reject) => {
    const listen = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data;
      if (reply.id !== id) return;
      if (reply.type === 'progress') {
        onDownload?.(reply.ratio);
        return;
      }
      w.removeEventListener('message', listen);
      if (reply.type === 'result')
        resolve({ audio: reply.audio, rate: reply.rate });
      else reject(new Error(reply.message));
    };
    w.addEventListener('message', listen);
    w.postMessage({ type: 'speak', id, engine, lang, text, voice, speed });
  });
}
