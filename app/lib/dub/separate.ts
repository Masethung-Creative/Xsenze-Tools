/**
 * A recording's voices and its background (music, effects), split on the
 * device by HTDemucs in a worker. The model hears 44.1 kHz stereo; both parts
 * come back at the mix rate.
 */
import { MIX_RATE } from 'xsenze-tools/lib/dub/mix';

export interface Separated {
  background: AudioBuffer;
  voice: AudioBuffer;
}

type Reply =
  | {
      type: 'progress';
      id: number;
      phase: 'download' | 'separate';
      ratio: number;
    }
  | { type: 'result'; id: number; voice: Float32Array[]; rest: Float32Array[] }
  | { type: 'error'; id: number; message: string };

const MODEL_RATE = 44100;

let worker: Worker | null = null;
let nextId = 0;

/** `buffer` at `rate` with `channels` channels (mono is copied to both sides). */
function resampled(
  buffer: AudioBuffer,
  rate: number,
  channels: number,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(
    channels,
    Math.ceil(buffer.duration * rate),
    rate,
  );
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();
  return ctx.startRendering();
}

function stereo(channels: Float32Array[]): Promise<AudioBuffer> {
  const buffer = new AudioBuffer({
    numberOfChannels: 2,
    length: channels[0]!.length,
    sampleRate: MODEL_RATE,
  });
  buffer.copyToChannel(channels[0] as Float32Array<ArrayBuffer>, 0);
  buffer.copyToChannel(channels[1] as Float32Array<ArrayBuffer>, 1);
  return resampled(buffer, MIX_RATE, 2);
}

export async function separate(
  original: AudioBuffer,
  onProgress?: (phase: 'download' | 'separate', ratio: number) => void,
  signal?: AbortSignal,
): Promise<Separated> {
  const input = await resampled(original, MODEL_RATE, 2);
  const left = input.getChannelData(0).slice();
  const right = input.getChannelData(1).slice();
  worker ??= new Worker(new URL('./separate.worker.ts', import.meta.url), {
    type: 'module',
  });
  const w = worker;
  const id = nextId++;
  const parts = await new Promise<{
    voice: Float32Array[];
    rest: Float32Array[];
  }>((resolve, reject) => {
    const stop = () => {
      w.removeEventListener('message', listen);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const listen = (event: MessageEvent<Reply>) => {
      const reply = event.data;
      if (reply.id !== id) return;
      if (reply.type === 'progress') {
        onProgress?.(reply.phase, reply.ratio);
        return;
      }
      w.removeEventListener('message', listen);
      signal?.removeEventListener('abort', stop);
      if (reply.type === 'result') resolve(reply);
      else reject(new Error(reply.message));
    };
    signal?.addEventListener('abort', stop, { once: true });
    w.addEventListener('message', listen);
    w.postMessage({ type: 'separate', id, left, right }, [
      left.buffer,
      right.buffer,
    ]);
  });
  return {
    background: await stereo(parts.rest),
    voice: await stereo(parts.voice),
  };
}
