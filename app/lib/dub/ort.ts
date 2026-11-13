/**
 * The ONNX runtime our own model code runs on (Chatterbox, Supertonic, the
 * speaker voiceprints): a stable onnxruntime-web release with its matching
 * WebGPU binary, bundled. Transformers.js keeps the pre-release runtime it
 * pins for itself; that build's WebGPU kernels turned Chatterbox's speech
 * into noise, while the same models speak clearly on a stable release.
 */
// the binary the WebGPU build loads, bundled (the package does not export this path)
import ortWasm from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.wasm?url';

export type Ort = typeof import('onnxruntime-web');

let loading: Promise<Ort> | null = null;

export function loadOrt(): Promise<Ort> {
  loading ??= (async () => {
    const ort = (await import('onnxruntime-web/webgpu')) as unknown as Ort;
    ort.env.wasm.wasmPaths = { wasm: ortWasm };
    ort.env.logLevel = 'error';
    return ort;
  })();
  loading.catch(() => (loading = null));
  return loading;
}
