/**
 * Indic Parler-TTS in the voice worker: loading, voices and retries. The
 * generation itself is in `parler-gen.ts`.
 *
 * Files: the T5 description encoder at 4 bits, both decoder graphs at fp16
 * (the 4-bit decoder never finds the end of a line) and DAC's fp16 decoder,
 * about 2 GB once. The description is tokenised with flan-t5's tokenizer and
 * the line with the model's own: the encoder only knows T5's 32k tokens.
 *
 * Not offered yet (see `PARLER_ENGINE` in engines.ts): on the CPU these files
 * speak clearly, but onnxruntime-web 1.29's WebGPU kernels get the fp16
 * decoder wrong from its very first step (scores off by up to 7.7, with
 * the same inputs), so the speech comes out garbled. The graphs use fp16
 * LayerNormalization (73 of them) and Softmax, the likeliest suspects.
 */
// the ONNX runtime binary for Transformers.js, which only tokenises here
import ortWasmJsep from '../../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url';
import { parlerVoice, type Preset } from 'xsenze-tools/lib/dub/engines';
import {
  fetchCached,
  type FetchProgress,
} from 'xsenze-tools/lib/dub/fetch-cached';
import { loadOrt } from 'xsenze-tools/lib/dub/ort';
import {
  PARLER_RATE,
  parlerGenerate,
  type ParlerModels,
} from 'xsenze-tools/lib/dub/parler-gen';

type Session = import('onnxruntime-web').InferenceSession;

const REPO = 'naklitechie/indic-parler-tts-ONNX';
const REVISION = 'd4598da15f7085dc41f697e26e2bc6e944bb1a22';
const BASE = `https://huggingface.co/${REPO}/resolve/${REVISION}`;
const DAC = `https://huggingface.co/onnx-community/dac_44khz-ONNX/resolve/c831ed0363c5e97ab0026399fe0ecb01f7a392bd/onnx/decoder_model_fp16.onnx`;
const T5 = 'google/flan-t5-large';
const T5_REVISION = '0613663d0d48ea86ba8cb3d7a44f0f65dc596a2a';

/** Graph file and its weights, at `BASE`. */
const GRAPHS = {
  encoder: 'text_encoder_q4f16',
  decoder: 'decoder_model_fp16',
  decoderWithPast: 'decoder_with_past_model_fp16',
} as const;

/** Spoken characters a second, for the expected length of a line. */
const CHARS_PER_SECOND = 15;

type Tokenize = (text: string) => number[];

interface Loaded {
  ort: Awaited<ReturnType<typeof loadOrt>>;
  models: ParlerModels;
  description: Tokenize;
  prompt: Tokenize;
}

let loading: Promise<Loaded> | null = null;

/** WebGPU with half-precision shaders, which the fp16 graphs need. */
async function webGpuF16(): Promise<boolean> {
  const gpu = (
    navigator as {
      gpu?: {
        requestAdapter(): Promise<{ features: Set<string> } | null>;
      };
    }
  ).gpu;
  if (!gpu) return false;
  try {
    const adapter = await gpu.requestAdapter();
    return !!adapter?.features.has('shader-f16');
  } catch {
    return false;
  }
}

async function loadTokenizers(): Promise<[Tokenize, Tokenize]> {
  const { AutoTokenizer, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;
  const onnx = env.backends.onnx as {
    wasm?: { wasmPaths?: string | { wasm?: string } };
  };
  if (onnx.wasm) onnx.wasm.wasmPaths = { wasm: ortWasmJsep };
  const [t5, own] = await Promise.all([
    AutoTokenizer.from_pretrained(T5, { revision: T5_REVISION }),
    AutoTokenizer.from_pretrained(REPO, { revision: REVISION }),
  ]);
  type Call = (text: string) => { input_ids: { tolist(): bigint[][] } };
  const ids =
    (tokenizer: unknown): Tokenize =>
    (text) =>
      (tokenizer as Call)(text).input_ids.tolist()[0]!.map(Number);
  return [ids(t5), ids(own)];
}

export function loadParler(
  onProgress: (ratio: number) => void,
): Promise<Loaded> {
  loading ??= (async () => {
    const ort = await loadOrt();
    const progress = new Map<string, FetchProgress>();
    const report = (file: string) => (p: FetchProgress) => {
      progress.set(file, p);
      let loaded = 0;
      let total = 0;
      for (const v of progress.values()) {
        loaded += v.loaded;
        total += v.total;
      }
      if (total) onProgress(loaded / total);
    };
    const bytes = (url: string) =>
      fetchCached(url, report(url))
        .then((r) => r.arrayBuffer())
        .then((b) => new Uint8Array(b));
    const tokenizers = loadTokenizers();
    const gpu = await webGpuF16();
    const providers = gpu ? ['webgpu', 'wasm'] : ['wasm'];

    // one model at a time: less memory held at once, and WebGPU builds one session at a time
    const sessions: Partial<Record<keyof typeof GRAPHS | 'dac', Session>> = {};
    for (const [key, name] of Object.entries(GRAPHS) as [
      keyof typeof GRAPHS,
      string,
    ][]) {
      const [graph, data] = await Promise.all([
        bytes(`${BASE}/${name}.onnx`),
        bytes(`${BASE}/${name}.onnx.data`),
      ]);
      sessions[key] = await ort.InferenceSession.create(graph, {
        executionProviders: providers,
        graphOptimizationLevel: 'all',
        externalData: [{ path: `${name}.onnx.data`, data }],
        // the decoders' caches stay on the GPU from one frame to the next
        ...(gpu && key !== 'encoder'
          ? { preferredOutputLocation: 'gpu-buffer' as const }
          : {}),
      });
    }
    sessions.dac = await ort.InferenceSession.create(await bytes(DAC), {
      executionProviders: providers,
      graphOptimizationLevel: 'all',
    });
    const [description, prompt] = await tokenizers;
    return {
      ort,
      models: sessions as ParlerModels,
      description,
      prompt,
    };
  })();
  loading.catch(() => (loading = null));
  return loading;
}

/** FNV-1a, so a voice and a line always give the same take. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const describe = (name: string) =>
  `${name} speaks at a moderate pace with a clear, expressive voice. The recording is of very high quality, with no background noise.`;

/** Speak `text` in `lang` with the named voice `preset` stands for; mono 44.1 kHz. */
export async function speakParler(
  text: string,
  lang: string,
  preset: Preset,
  onProgress: (ratio: number) => void,
  onSpeaking?: (ratio: number) => void,
): Promise<{ audio: Float32Array; rate: number }> {
  const m = await loadParler(onProgress);
  const name = parlerVoice(lang, preset);
  const description = m.description(describe(name));
  const prompt = m.prompt(text);
  const expected = Math.max(1, text.length / CHARS_PER_SECOND);
  const maxSeconds = Math.min(30, Math.max(5, expected * 2.5));
  // sampling now and then stops after the first sentence or never stops:
  // try another seed, keep the take nearest the expected length
  let best: Float32Array | null = null;
  let bestGap = Infinity;
  for (let attempt = 0; attempt < 3; attempt++) {
    const audio = await parlerGenerate(m.ort, m.models, description, prompt, {
      seed: hash(`${name}\n${text}`) + attempt,
      maxSeconds,
      expectedSeconds: expected,
      onProgress: (r) => onSpeaking?.(Math.min(0.97, r)),
    });
    const seconds = audio.length / PARLER_RATE;
    const gap = Math.abs(Math.log(Math.max(0.1, seconds) / expected));
    if (gap < bestGap) {
      best = audio;
      bestGap = gap;
    }
    const tooShort = seconds < expected * 0.45;
    const runaway = seconds >= maxSeconds - 0.5;
    if (!tooShort && !runaway) break;
  }
  return { audio: best!, rate: PARLER_RATE };
}
