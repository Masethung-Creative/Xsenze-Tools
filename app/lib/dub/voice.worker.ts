/// <reference lib="webworker" />
/**
 * The voice engines in a worker, so speaking never freezes the page.
 * In:  { type: 'speak', id, engine, lang, text, voice, speed, clone? }
 * Out: { type: 'progress', id, ratio } while an engine's model downloads,
 *      { type: 'progress', id, ratio, phase: 'speak' } through a slow line
 *      { type: 'result', id, audio, rate } | { type: 'error', id, message }
 */
// the ONNX runtime binary, bundled (the package does not export this path)
import ortWasm from '../../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url';
import {
  MMS_MODELS,
  type EngineId,
  type Preset,
} from 'xsenze-tools/lib/dub/engines';
import { speakSupertonic } from 'xsenze-tools/lib/dub/supertonic';
import { speakChatterbox } from 'xsenze-tools/lib/dub/chatterbox';
import type { CloneRef } from 'xsenze-tools/lib/dub/voice';

type Incoming = {
  type: 'speak';
  id: number;
  engine: EngineId;
  lang: string;
  text: string;
  voice: Preset;
  speed: number;
  clone?: CloneRef;
};

type MmsPipe = (
  text: string,
) => Promise<{ audio: Float32Array; sampling_rate: number }>;

const mms = new Map<string, Promise<MmsPipe>>();

function loadMms(lang: string, onProgress: (ratio: number) => void) {
  let pipe = mms.get(lang);
  if (!pipe) {
    pipe = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      env.allowLocalModels = false;
      // the ONNX runtime binary comes from the app bundle, not the library's CDN
      const onnx = env.backends.onnx as {
        wasm?: { wasmPaths?: string | { wasm?: string } };
      };
      if (onnx.wasm) onnx.wasm.wasmPaths = { wasm: ortWasm };
      const files = new Map<string, { loaded: number; total: number }>();
      const p = await pipeline(
        'text-to-speech',
        `Xenova/mms-tts-${MMS_MODELS[lang]}`,
        {
          progress_callback: (info: {
            status: string;
            file?: string;
            loaded?: number;
            total?: number;
          }) => {
            if (info.status !== 'progress' || !info.file || !info.total) return;
            files.set(info.file, {
              loaded: info.loaded ?? 0,
              total: info.total,
            });
            let loaded = 0;
            let total = 0;
            for (const f of files.values()) {
              loaded += f.loaded;
              total += f.total;
            }
            onProgress(total ? loaded / total : 0);
          },
        },
      );
      return p as unknown as MmsPipe;
    })();
    pipe.catch(() => mms.delete(lang));
    mms.set(lang, pipe);
  }
  return pipe;
}

async function speak(
  message: Incoming,
): Promise<{ audio: Float32Array; rate: number }> {
  const onProgress = (ratio: number) =>
    postMessage({ type: 'progress', id: message.id, ratio });
  if (message.engine === 'supertonic')
    return speakSupertonic(
      message.text,
      message.lang,
      message.voice,
      message.speed,
      onProgress,
    );
  if (message.engine === 'chatterbox') {
    if (!message.clone) throw new Error('Chatterbox needs a voice to clone');
    return speakChatterbox(
      message.text,
      message.lang,
      message.clone.key,
      message.clone.audio,
      onProgress,
      (ratio) =>
        postMessage({
          type: 'progress',
          id: message.id,
          ratio,
          phase: 'speak',
        }),
    );
  }
  const pipe = await loadMms(message.lang, onProgress);
  const out = await pipe(message.text);
  return { audio: out.audio, rate: out.sampling_rate };
}

addEventListener('message', (event: MessageEvent<Incoming>) => {
  const message = event.data;
  speak(message).then(
    ({ audio, rate }) => {
      // a copy owns its buffer, so it can be transferred
      const owned = audio.slice();
      postMessage({ type: 'result', id: message.id, audio: owned, rate }, [
        owned.buffer,
      ]);
    },
    (error: unknown) =>
      postMessage({
        type: 'error',
        id: message.id,
        message: error instanceof Error ? error.message : String(error),
      }),
  );
});
