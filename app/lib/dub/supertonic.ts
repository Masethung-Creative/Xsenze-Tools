/**
 * Supertonic 3 text-to-speech on ONNX Runtime Web (runs inside the voice worker).
 *
 * Adapted from the Supertonic web example, MIT License,
 * Copyright (c) 2025 Supertone Inc. The model weights are OpenRAIL-M and are
 * downloaded by the visitor's browser from the pinned archive revision below.
 */
// the ONNX runtime binary, bundled (the package does not export this path)
import ortWasm from '../../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url';
import {
  fetchCached,
  type FetchProgress,
} from 'xsenze-tools/lib/dub/fetch-cached';
import type { Preset } from 'xsenze-tools/lib/dub/engines';

type Ort = typeof import('onnxruntime-web');
type Session = import('onnxruntime-web').InferenceSession;
type Tensor = import('onnxruntime-web').Tensor;

const BASE =
  'https://huggingface.co/supertone-oss-archive/supertonic-3/resolve/aafc6e32416a594460b32413efc49d7fe4ce6d46';

/** Denoising steps: the example's default, a balance of quality and speed. */
const STEPS = 8;

interface Config {
  ae: { sample_rate: number; base_chunk_size: number };
  ttl: { chunk_compress_factor: number; latent_dim: number };
}

interface StyleJson {
  style_ttl: { dims: number[]; data: unknown };
  style_dp: { dims: number[]; data: unknown };
}

interface Loaded {
  ort: Ort;
  cfg: Config;
  indexer: number[];
  dp: Session;
  textEnc: Session;
  vectorEst: Session;
  vocoder: Session;
  styles: Map<Preset, { ttl: Tensor; dp: Tensor }>;
}

let loading: Promise<Loaded> | null = null;

const FILES = [
  'onnx/duration_predictor.onnx',
  'onnx/text_encoder.onnx',
  'onnx/vector_estimator.onnx',
  'onnx/vocoder.onnx',
];

async function webGpu(): Promise<boolean> {
  const gpu = (navigator as { gpu?: { requestAdapter(): Promise<unknown> } })
    .gpu;
  if (!gpu) return false;
  try {
    return (await gpu.requestAdapter()) !== null;
  } catch {
    return false;
  }
}

export function loadSupertonic(
  onProgress: (ratio: number) => void,
): Promise<Loaded> {
  loading ??= (async () => {
    const ort = (await import('onnxruntime-web/webgpu')) as unknown as Ort;
    ort.env.wasm.wasmPaths = { wasm: ortWasm };
    // its notices about CPU-assigned nodes are expected, not errors
    ort.env.logLevel = 'error';
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
    const [cfg, indexer, ...models] = await Promise.all([
      fetchCached(`${BASE}/onnx/tts.json`).then(
        (b) => b.json() as Promise<Config>,
      ),
      fetchCached(`${BASE}/onnx/unicode_indexer.json`).then(
        (b) => b.json() as Promise<number[]>,
      ),
      ...FILES.map((f) =>
        fetchCached(`${BASE}/${f}`, report(f)).then((b) => b.arrayBuffer()),
      ),
    ]);
    const providers = (await webGpu()) ? ['webgpu', 'wasm'] : ['wasm'];
    const session = (bytes: ArrayBuffer) =>
      ort.InferenceSession.create(new Uint8Array(bytes), {
        executionProviders: providers,
        graphOptimizationLevel: 'all',
      });
    const [dp, textEnc, vectorEst, vocoder] = await Promise.all(
      models.map((m) => session(m)),
    );
    return {
      ort,
      cfg,
      indexer,
      dp: dp!,
      textEnc: textEnc!,
      vectorEst: vectorEst!,
      vocoder: vocoder!,
      styles: new Map(),
    };
  })();
  loading.catch(() => (loading = null));
  return loading;
}

async function styleFor(m: Loaded, preset: Preset) {
  const cached = m.styles.get(preset);
  if (cached) return cached;
  const json = (await (
    await fetchCached(`${BASE}/voice_styles/${preset}.json`)
  ).json()) as StyleJson;
  const tensor = (s: StyleJson['style_ttl']) =>
    new m.ort.Tensor(
      'float32',
      Float32Array.from((s.data as unknown[]).flat(Infinity) as number[]),
      s.dims,
    );
  const style = { ttl: tensor(json.style_ttl), dp: tensor(json.style_dp) };
  m.styles.set(preset, style);
  return style;
}

const REPLACE: [string, string][] = [
  ['–', '-'],
  ['‑', '-'],
  ['—', '-'],
  ['_', ' '],
  ['“', '"'],
  ['”', '"'],
  ['‘', "'"],
  ['’', "'"],
  ['´', "'"],
  ['`', "'"],
  ['[', ' '],
  [']', ' '],
  ['|', ' '],
  ['/', ' '],
  ['#', ' '],
  ['→', ' '],
  ['←', ' '],
  ['@', ' at '],
  ['e.g.,', 'for example, '],
  ['i.e.,', 'that is, '],
];

const EMOJI =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]+/gu;

/** The example's normaliser: symbols out, spacing fixed, a final stop, language tags. */
function prepare(input: string, lang: string): string {
  let text = input.normalize('NFKD').replace(EMOJI, '');
  for (const [from, to] of REPLACE) text = text.replaceAll(from, to);
  text = text
    .replace(/[♥☆♡©\\]/g, '')
    .replace(/ ([,.!?;:'])/g, '$1')
    .replace(/""+/g, '"')
    .replace(/''+/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (!/[.!?;:,'"')\]}…。」』】〉》›»]$/.test(text)) text += '.';
  return `<${lang}>${text}</${lang}>`;
}

/** Box-Muller standard normal. */
function gaussian(): number {
  const u1 = Math.max(0.0001, Math.random());
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Speak one line; `speed` above 1 is faster (pitch kept). */
export async function speakSupertonic(
  text: string,
  lang: string,
  preset: Preset,
  speed: number,
  onProgress: (ratio: number) => void,
): Promise<{ audio: Float32Array; rate: number }> {
  const m = await loadSupertonic(onProgress);
  const { ort, cfg } = m;
  const style = await styleFor(m, preset);

  const prepared = prepare(text, lang);
  const ids = new BigInt64Array(prepared.length);
  for (let j = 0; j < prepared.length; j++) {
    const code = prepared.codePointAt(j) ?? 0;
    ids[j] = BigInt(code < m.indexer.length ? (m.indexer[code] ?? -1) : -1);
  }
  const len = ids.length;
  const textIds = new ort.Tensor('int64', ids, [1, len]);
  const textMask = new ort.Tensor('float32', new Float32Array(len).fill(1), [
    1,
    1,
    len,
  ]);

  const dpOut = await m.dp.run({
    text_ids: textIds,
    style_dp: style.dp,
    text_mask: textMask,
  });
  const seconds = (dpOut.duration!.data as Float32Array)[0]! / speed;

  const encOut = await m.textEnc.run({
    text_ids: textIds,
    style_ttl: style.ttl,
    text_mask: textMask,
  });

  const rate = cfg.ae.sample_rate;
  const chunk = cfg.ae.base_chunk_size * cfg.ttl.chunk_compress_factor;
  const wavLen = Math.floor(seconds * rate);
  const latentLen = Math.max(1, Math.ceil(wavLen / chunk));
  const latentDim = cfg.ttl.latent_dim * cfg.ttl.chunk_compress_factor;

  let xt = new Float32Array(latentDim * latentLen);
  for (let i = 0; i < xt.length; i++) xt[i] = gaussian();
  const latentMask = new ort.Tensor(
    'float32',
    new Float32Array(latentLen).fill(1),
    [1, 1, latentLen],
  );
  const total = new ort.Tensor('float32', new Float32Array([STEPS]), [1]);

  for (let step = 0; step < STEPS; step++) {
    const out = await m.vectorEst.run({
      noisy_latent: new ort.Tensor('float32', xt, [1, latentDim, latentLen]),
      text_emb: encOut.text_emb!,
      style_ttl: style.ttl,
      latent_mask: latentMask,
      text_mask: textMask,
      current_step: new ort.Tensor('float32', new Float32Array([step]), [1]),
      total_step: total,
    });
    xt = Float32Array.from(out.denoised_latent!.data as Float32Array);
  }

  const voc = await m.vocoder.run({
    latent: new ort.Tensor('float32', xt, [1, latentDim, latentLen]),
  });
  const wav = voc.wav_tts!.data as Float32Array;
  // the vocoder pads to whole chunks; keep the predicted length
  return { audio: wav.slice(0, Math.min(wav.length, wavLen)), rate };
}
