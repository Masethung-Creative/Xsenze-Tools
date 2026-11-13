/// <reference lib="webworker" />
/**
 * Whisper in a worker, so transcribing never freezes the page.
 * In:  { type: 'run', id, pcm (mono 16 kHz), mode, language? }
 * Out: { type: 'progress', id, percent } while the model downloads
 *      { type: 'result', id, words } | { type: 'error', id, message }
 */
// the ONNX runtime binary, bundled (the package does not export this path)
import ortWasm from '../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url';
import {
  progressAggregator,
  resolveModel,
  type Device,
  type Mode,
  type ModelResolution,
  type Word,
} from 'xsenze-tools/lib/whisper-models';

interface AsrChunk {
  text: string;
  timestamp: [number | null, number | null];
}

interface AsrOutput {
  text: string;
  chunks?: AsrChunk[];
}

interface AsrPipeline {
  (audio: Float32Array, options: Record<string, unknown>): Promise<AsrOutput>;
  dispose?: () => unknown;
}

type Incoming = {
  type: 'run';
  id: number;
  pcm: Float32Array;
  mode: Mode;
  language?: string;
  /** iOS WebKit: the Cache API fails on the model files */
  noCache?: boolean;
};

let cached: { key: string; pipe: AsrPipeline } | null = null;

async function load(
  resolution: ModelResolution,
  onPercent: (percent: number) => void,
  noCache: boolean,
): Promise<AsrPipeline> {
  const key = `${resolution.model}:${resolution.device}:${resolution.dtype}`;
  if (cached?.key === key) return cached.pipe;
  const previous = cached;
  cached = null;
  await previous?.pipe.dispose?.();

  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;
  env.useBrowserCache = !noCache;
  // the ONNX runtime binary comes from the app bundle, not the library's CDN
  const onnx = env.backends.onnx as {
    wasm?: { wasmPaths?: string | { wasm?: string } };
  };
  if (onnx.wasm) onnx.wasm.wasmPaths = { wasm: ortWasm };

  const pipe = (await pipeline(
    'automatic-speech-recognition',
    resolution.model,
    {
      device: resolution.device,
      dtype: resolution.dtype,
      progress_callback: progressAggregator(onPercent),
    },
  )) as unknown as AsrPipeline;
  cached = { key, pipe };
  return pipe;
}

async function webGpuAvailable(): Promise<boolean> {
  const gpu = (navigator as { gpu?: { requestAdapter(): Promise<unknown> } })
    .gpu;
  if (!gpu) return false;
  try {
    return (await gpu.requestAdapter()) !== null;
  } catch {
    return false;
  }
}

function readWords(out: AsrOutput): Word[] {
  const words: Word[] = [];
  let cursor = 0;
  for (const chunk of out.chunks ?? []) {
    const text = chunk.text.trim();
    if (!text) continue;
    const start = chunk.timestamp[0] ?? cursor;
    const end = chunk.timestamp[1] ?? start;
    cursor = end;
    words.push({ text, start, end });
  }
  return words;
}

async function run(message: Incoming): Promise<Word[]> {
  const { mode, pcm, language, id } = message;
  const hasWebGpu = await webGpuAvailable();
  if (mode === 'accurate' && !hasWebGpu) throw new Error('webgpu-required');
  const onPercent = (percent: number) =>
    postMessage({ type: 'progress', id, percent });
  const build = (device: Device) =>
    load(resolveModel(mode, device), onPercent, !!message.noCache);
  const options = {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: 'word',
    language: language || undefined,
  };

  let device: Device = hasWebGpu ? 'webgpu' : 'wasm';
  let pipe: AsrPipeline;
  try {
    pipe = await build(device);
  } catch (error) {
    if (mode === 'accurate' || device === 'wasm') throw error;
    device = 'wasm';
    pipe = await build(device);
  }
  try {
    return readWords(await pipe(pcm, options));
  } catch (error) {
    if (mode === 'accurate' || device === 'wasm') throw error;
    pipe = await build('wasm');
    return readWords(await pipe(pcm, options));
  }
}

addEventListener('message', (event: MessageEvent<Incoming>) => {
  const message = event.data;
  run(message).then(
    (words) => postMessage({ type: 'result', id: message.id, words }),
    (error: unknown) =>
      postMessage({
        type: 'error',
        id: message.id,
        message: error instanceof Error ? error.message : String(error),
      }),
  );
});
