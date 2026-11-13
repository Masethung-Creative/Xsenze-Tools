/// <reference lib="webworker" />
/**
 * Speaker embeddings in a worker: one voiceprint per stretch of speech, so
 * lines by the same person can be grouped. WavLM Base Plus (speaker
 * verification head), MIT licence, about 30 MB once.
 * In:  { type: 'embed', id, segments: Float32Array[] (mono 16 kHz) }
 * Out: { type: 'progress', id, phase: 'download' | 'embed', ratio }
 *      { type: 'result', id, embeddings: Float32Array[] } | { type: 'error', id, message }
 */
// the ONNX runtime binary, bundled (the package does not export this path)
import ortWasm from '../../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url';

const MODEL = 'Xenova/wavlm-base-plus-sv';

type Incoming = { type: 'embed'; id: number; segments: Float32Array[] };

interface Loaded {
  processor: (audio: Float32Array) => Promise<Record<string, unknown>>;
  model: (
    inputs: Record<string, unknown>,
  ) => Promise<{ embeddings: { data: Float32Array } }>;
}

let loading: Promise<Loaded> | null = null;

function load(onProgress: (ratio: number) => void): Promise<Loaded> {
  loading ??= (async () => {
    const { AutoProcessor, AutoModel, env } =
      await import('@huggingface/transformers');
    env.allowLocalModels = false;
    // the ONNX runtime binary comes from the app bundle, not the library's CDN
    const onnx = env.backends.onnx as {
      wasm?: { wasmPaths?: string | { wasm?: string } };
    };
    if (onnx.wasm) onnx.wasm.wasmPaths = { wasm: ortWasm };
    const files = new Map<string, { loaded: number; total: number }>();
    const progress_callback = (info: {
      status: string;
      file?: string;
      loaded?: number;
      total?: number;
    }) => {
      if (info.status !== 'progress' || !info.file || !info.total) return;
      files.set(info.file, { loaded: info.loaded ?? 0, total: info.total });
      let loaded = 0;
      let total = 0;
      for (const f of files.values()) {
        loaded += f.loaded;
        total += f.total;
      }
      onProgress(total ? loaded / total : 0);
    };
    const [processor, model] = await Promise.all([
      AutoProcessor.from_pretrained(MODEL, { progress_callback }),
      AutoModel.from_pretrained(MODEL, {
        dtype: 'q8',
        device: 'wasm',
        progress_callback,
      }),
    ]);
    return {
      processor: processor as unknown as Loaded['processor'],
      model: model as unknown as Loaded['model'],
    };
  })();
  loading.catch(() => (loading = null));
  return loading;
}

async function embed(message: Incoming): Promise<Float32Array[]> {
  const report = (phase: 'download' | 'embed', ratio: number) =>
    postMessage({ type: 'progress', id: message.id, phase, ratio });
  const { processor, model } = await load((r) => report('download', r));
  const out: Float32Array[] = [];
  for (const [i, segment] of message.segments.entries()) {
    const inputs = await processor(segment);
    const { embeddings } = await model(inputs);
    out.push(Float32Array.from(embeddings.data));
    report('embed', (i + 1) / message.segments.length);
  }
  return out;
}

addEventListener('message', (event: MessageEvent<Incoming>) => {
  const message = event.data;
  embed(message).then(
    (embeddings) =>
      postMessage(
        { type: 'result', id: message.id, embeddings },
        embeddings.map((e) => e.buffer),
      ),
    (error: unknown) =>
      postMessage({
        type: 'error',
        id: message.id,
        message: error instanceof Error ? error.message : String(error),
      }),
  );
});
