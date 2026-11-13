/**
 * Chatterbox Multilingual (Resemble AI, MIT) on ONNX Runtime Web: speaks a
 * line in the voice of a short reference clip. Runs inside the voice worker.
 *
 * Four models: the speech encoder turns the reference clip into a voice
 * (conditioning, prompt tokens, speaker embedding and features), a Llama
 * language model writes speech tokens one at a time from the text, and the
 * conditional decoder turns those tokens into 24 kHz audio in that voice.
 */
import { loadOrt, type Ort } from 'xsenze-tools/lib/dub/ort';
import {
  cangjieFrom,
  chatterboxTokenizer,
  prepareChatterbox,
  type Cangjie,
  type ChatterboxTokenizer,
} from 'xsenze-tools/lib/dub/chatterbox-text';
import { CLONE_RATE, CLONE_SECONDS } from 'xsenze-tools/lib/dub/engines';
import {
  fetchCached,
  type FetchProgress,
} from 'xsenze-tools/lib/dub/fetch-cached';

type Session = import('onnxruntime-web').InferenceSession;
type Tensor = import('onnxruntime-web').Tensor;

const BASE =
  'https://huggingface.co/onnx-community/chatterbox-multilingual-ONNX/resolve/452d3f434aa592098f1eedac9099f33642ab2da5';

const START_SPEECH = 6561;
const STOP_SPEECH = 6562;
const LAYERS = 30;
const KV_HEADS = 16;
const HEAD_DIM = 64;
const REPETITION_PENALTY = 1.2;
const EXAGGERATION = 0.5;

/** Model files: the 4-bit language model keeps the download near 1.5 GB. */
const MODELS = {
  encoder: 'speech_encoder',
  embed: 'embed_tokens',
  lm: 'language_model_q4',
  decoder: 'conditional_decoder',
} as const;

interface Loaded {
  ort: Ort;
  tokenizer: ChatterboxTokenizer;
  encoder: Session;
  embed: Session;
  lm: Session;
  decoder: Session;
}

/** A reference voice, encoded once and reused for every line it speaks. */
interface Voice {
  cond: Tensor;
  promptTokens: Tensor;
  speakerEmbeddings: Tensor;
  speakerFeatures: Tensor;
}

/** Share of a line's time spent writing speech tokens; the decoder takes the rest. */
const GEN_SHARE = 0.3;
/** How long the decoder took lately, for the progress bar (0 until known). */
let decodeMs = 0;

let loading: Promise<Loaded> | null = null;
let cangjie: Promise<Cangjie> | null = null;
const voices = new Map<string, Promise<Voice>>();

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

export function loadChatterbox(
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
    const bytes = (file: string) =>
      fetchCached(`${BASE}/${file}`, report(file))
        .then((r) => r.arrayBuffer())
        .then((b) => new Uint8Array(b));

    const tokenizer = fetchCached(`${BASE}/tokenizer.json`)
      .then((r) => r.json())
      .then(chatterboxTokenizer);
    const gpu = await webGpu();
    // one at a time, so only one model's bytes are held in memory at once
    const sessions: Session[] = [];
    for (const name of Object.values(MODELS)) {
      // the speech encoder's AveragePool (ceil mode) is not supported on WebGPU;
      // it runs once per voice, so the CPU costs little
      const providers =
        gpu && name !== MODELS.encoder ? ['webgpu', 'wasm'] : ['wasm'];
      // the language model's cache stays on the GPU between tokens: reading
      // all 60 cache tensors back after every token was most of the time spent
      const onGpu = gpu && name === MODELS.lm;
      const [graph, data] = await Promise.all([
        bytes(`onnx/${name}.onnx`),
        bytes(`onnx/${name}.onnx_data`),
      ]);
      sessions.push(
        await ort.InferenceSession.create(graph, {
          executionProviders: providers,
          graphOptimizationLevel: 'all',
          externalData: [{ path: `${name}.onnx_data`, data }],
          ...(onGpu ? { preferredOutputLocation: 'gpu-buffer' as const } : {}),
        }),
      );
    }
    const [encoder, embed, lm, decoder] = sessions;
    return {
      ort,
      tokenizer: await tokenizer,
      encoder: encoder!,
      embed: embed!,
      lm: lm!,
      decoder: decoder!,
    };
  })();
  loading.catch(() => (loading = null));
  return loading;
}

function loadCangjie(): Promise<Cangjie> {
  cangjie ??= fetchCached(`${BASE}/Cangjie5_TC.json`)
    .then((r) => r.json() as Promise<string[]>)
    .then(cangjieFrom);
  cangjie.catch(() => (cangjie = null));
  return cangjie;
}

function voiceOf(m: Loaded, key: string, reference: Float32Array) {
  let voice = voices.get(key);
  if (!voice) {
    voice = (async () => {
      const clip = reference.slice(0, CLONE_SECONDS * CLONE_RATE);
      const out = await m.encoder.run({
        audio_values: new m.ort.Tensor('float32', clip, [1, clip.length]),
      });
      const [cond, promptTokens, speakerEmbeddings, speakerFeatures] =
        m.encoder.outputNames.map((n) => out[n]!);
      return {
        cond: cond!,
        promptTokens: promptTokens!,
        speakerEmbeddings: speakerEmbeddings!,
        speakerFeatures: speakerFeatures!,
      };
    })();
    voice.catch(() => voices.delete(key));
    voices.set(key, voice);
  }
  return voice;
}

/** Forget encoded voices (a new file brings new speakers). */
export function forgetVoices() {
  voices.clear();
}

const int64 = (ort: Ort, values: number[], dims: number[]) =>
  new ort.Tensor('int64', BigInt64Array.from(values.map(BigInt)), dims);

/** Join two [1, n, d] tensors along n. */
function concatSeq(ort: Ort, a: Tensor, b: Tensor): Tensor {
  const d = a.dims[2]!;
  const out = new Float32Array(a.data.length + b.data.length);
  out.set(a.data as Float32Array);
  out.set(b.data as Float32Array, a.data.length);
  return new ort.Tensor('float32', out, [1, out.length / d, d]);
}

/**
 * Speak `text` in `lang` in the voice of `reference` (mono 24 kHz), cached
 * under `voiceKey`.
 */
export async function speakChatterbox(
  text: string,
  lang: string,
  voiceKey: string,
  reference: Float32Array,
  onProgress: (ratio: number) => void,
  onSpeaking?: (ratio: number) => void,
): Promise<{ audio: Float32Array; rate: number }> {
  const m = await loadChatterbox(onProgress);
  const { ort } = m;
  const voice = await voiceOf(m, voiceKey, reference);
  const prepared = prepareChatterbox(
    text,
    lang,
    lang === 'zh' ? await loadCangjie() : undefined,
  );
  const ids = m.tokenizer.encode(prepared);
  // positions count text tokens from the one after the first; speech tokens sit at 0
  const positions = ids.map((id, i) => (id >= START_SPEECH ? 0 : i - 1));
  // speech runs about 1.3 tokens a character (25 a second); the stop token
  // ends a line, and this cap only stops a model that never stops
  const maxTokens = Math.min(1000, 60 + Math.ceil(text.length * 3));
  // the usual length, for progress only
  const expected = 10 + text.length * 1.4;

  const exaggeration = new ort.Tensor(
    'float32',
    new Float32Array([EXAGGERATION]),
    [1],
  );
  const embedOut = await m.embed.run({
    input_ids: int64(ort, ids, [1, ids.length]),
    position_ids: int64(ort, positions, [1, ids.length]),
    exaggeration,
  });
  let embeds = concatSeq(ort, voice.cond, embedOut[m.embed.outputNames[0]!]!);

  const empty = new Float32Array(0);
  let past: Record<string, Tensor> = {};
  for (let l = 0; l < LAYERS; l++)
    for (const kv of ['key', 'value'])
      past[`past_key_values.${l}.${kv}`] = new ort.Tensor('float32', empty, [
        1,
        KV_HEADS,
        0,
        HEAD_DIM,
      ]);
  let length = embeds.dims[1]!;
  const generated: number[] = [START_SPEECH];

  for (let step = 0; step < maxTokens; step++) {
    const out = await m.lm.run({
      inputs_embeds: embeds,
      attention_mask: int64(ort, new Array<number>(length).fill(1), [
        1,
        length,
      ]),
      ...past,
    });
    const logitsTensor = out[m.lm.outputNames[0]!]!;
    const vocab = logitsTensor.dims[2]!;
    // only the logits come back to the CPU (getData also reads a GPU tensor)
    const all = (await logitsTensor.getData()) as Float32Array;
    const logits = all.slice(all.length - vocab);
    for (const id of new Set(generated)) {
      const s = logits[id]!;
      logits[id] = s < 0 ? s * REPETITION_PENALTY : s / REPETITION_PENALTY;
    }
    let next = 0;
    for (let i = 1; i < vocab; i++) if (logits[i]! > logits[next]!) next = i;
    generated.push(next);

    const nextPast: Record<string, Tensor> = {};
    for (const name of m.lm.outputNames.slice(1))
      nextPast[name.replace('present', 'past_key_values')] = out[name]!;
    for (const t of Object.values(past)) t.dispose();
    logitsTensor.dispose();
    past = nextPast;
    if (next === STOP_SPEECH) break;
    if (step % 4 === 0) onSpeaking?.(GEN_SHARE * Math.min(1, step / expected));

    const e = await m.embed.run({
      input_ids: int64(ort, [next], [1, 1]),
      position_ids: int64(ort, [step + 1], [1, 1]),
      exaggeration,
    });
    embeds = e[m.embed.outputNames[0]!]!;
    length++;
  }
  for (const t of Object.values(past)) t.dispose();

  // drop the start token and the stop token (if it came); the voice's own tokens lead
  const speech = generated
    .slice(1)
    .filter((id, i, a) => !(i === a.length - 1 && id === STOP_SPEECH));
  const prompt = Array.from(voice.promptTokens.data as BigInt64Array, Number);
  const tokens = [...prompt, ...speech];
  // the decoder is one long call: the bar moves on by how long the last one took
  const started = performance.now();
  const tick = setInterval(() => {
    const share = (performance.now() - started) / (decodeMs || 10000);
    onSpeaking?.(GEN_SHARE + (0.97 - GEN_SHARE) * Math.min(1, share));
  }, 250);
  const wav = await m.decoder
    .run({
      speech_tokens: int64(ort, tokens, [1, tokens.length]),
      speaker_embeddings: voice.speakerEmbeddings,
      speaker_features: voice.speakerFeatures,
    })
    .finally(() => clearInterval(tick));
  const took = performance.now() - started;
  decodeMs = decodeMs ? (decodeMs + took) / 2 : took;
  const audio = (wav[m.decoder.outputNames[0]!]!.data as Float32Array).slice();
  return { audio, rate: CLONE_RATE };
}
