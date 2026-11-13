/// <reference lib="webworker" />
/**
 * NLLB-200 in a worker, so translating never freezes the page.
 * In:  { type: 'load', model }
 *      { type: 'translate', id, texts, src, tgt }
 * Out: { type: 'progress', ratio } while the model downloads
 *      { type: 'ready' } | { type: 'result', id, texts } | { type: 'error', id?, message }
 */

// the ONNX runtime binary, bundled (the package does not export this path)
import ortWasm from '../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url';
type NllbPipe = (
  text: string[],
  options: { src_lang: string; tgt_lang: string; max_new_tokens?: number },
) => Promise<{ translation_text: string }[]>;

type Incoming =
  | { type: 'load'; model: string }
  | {
      type: 'translate';
      id: number;
      texts: string[];
      src: string;
      tgt: string;
    };

let pipe: Promise<NllbPipe> | null = null;

function load(model: string): Promise<NllbPipe> {
  pipe ??= (async () => {
    const { pipeline, env } = await import('@huggingface/transformers');
    env.allowLocalModels = false;
    // the ONNX runtime binary is bundled with the app (same file the
    // library would otherwise fetch from its default CDN)
    const onnx = env.backends.onnx as {
      wasm?: { wasmPaths?: string | { wasm?: string } };
    };
    if (onnx.wasm) onnx.wasm.wasmPaths = { wasm: ortWasm };
    const files = new Map<string, { loaded: number; total: number }>();
    const p = await pipeline('translation', model, {
      dtype: 'q8',
      progress_callback: (info: {
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
        postMessage({ type: 'progress', ratio: total ? loaded / total : 0 });
      },
    });
    return p as unknown as NllbPipe;
  })();
  pipe.catch(() => (pipe = null));
  return pipe;
}

addEventListener('message', (event: MessageEvent<Incoming>) => {
  const message = event.data;
  if (message.type === 'load') {
    load(message.model).then(
      () => postMessage({ type: 'ready' }),
      (error: unknown) =>
        postMessage({ type: 'error', message: String(error) }),
    );
    return;
  }
  const { id, texts, src, tgt } = message;
  void (async () => {
    try {
      const p = await pipe!;
      // one line per call: batched lines of different lengths make NLLB run on
      // into repeated text; the token cap stops a runaway line
      const out: { translation_text: string }[] = [];
      for (const text of texts) {
        const [first] = await p([text], {
          src_lang: src,
          tgt_lang: tgt,
          max_new_tokens: Math.min(256, 32 + text.length),
        });
        out.push(first ?? { translation_text: '' });
      }
      postMessage({
        type: 'result',
        id,
        texts: out.map((o) => o.translation_text),
      });
    } catch (error) {
      postMessage({ type: 'error', id, message: String(error) });
    }
  })();
});
