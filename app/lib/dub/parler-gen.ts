/**
 * Indic Parler-TTS generation (AI4Bharat, Apache 2.0): a description of the
 * voice ("Jaya speaks at a moderate pace…") goes through a T5 encoder, the
 * line to speak is prefixed to a 24-layer decoder, and the decoder writes
 * nine DAC codebooks one frame at a time, each codebook a step behind the
 * last (the delay pattern). DAC turns the codes into 44.1 kHz audio.
 *
 * No imports, so the same code runs in the voice worker and in a plain
 * ONNX runtime test: the caller hands over the runtime and the sessions.
 */
type Tensor = import('onnxruntime-web').Tensor;
type Session = import('onnxruntime-web').InferenceSession;
type Ort = typeof import('onnxruntime-web');

export interface ParlerModels {
  encoder: Session;
  /** First step: prompt prefix + the start frame. */
  decoder: Session;
  /** Every later step, with the key/value cache. */
  decoderWithPast: Session;
  dac: Session;
}

export const PARLER_RATE = 44100;
const CODEBOOKS = 9;
const CODES = 1024;
/** End of audio (also padding). */
const EOS = 1024;
/** Start frame, and the filler before each delayed codebook begins. */
const BOS = 1025;
const TOP_K = 50;
/** DAC frames a second (44100 / 512). */
const FRAMES_PER_SECOND = PARLER_RATE / 512;

export interface ParlerOptions {
  /** Same seed, same text and description: the same take. */
  seed: number;
  /** Stop after this many seconds even without an end token. */
  maxSeconds: number;
  /** A guess at the length, for progress only. */
  expectedSeconds: number;
  onProgress?: (ratio: number) => void;
}

/** Small seeded generator (mulberry32), so a line can be voiced again identically. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Top-k sampling at temperature 1 over `logits[from..from+size)`, limited to ids below `limit`. */
function sample(
  logits: Float32Array,
  from: number,
  limit: number,
  rand: () => number,
): number {
  const top: { id: number; v: number }[] = [];
  for (let id = 0; id < limit; id++) {
    const v = logits[from + id]!;
    if (top.length < TOP_K) {
      top.push({ id, v });
      if (top.length === TOP_K) top.sort((a, b) => b.v - a.v);
    } else if (v > top[TOP_K - 1]!.v) {
      let i = TOP_K - 1;
      while (i > 0 && top[i - 1]!.v < v) {
        top[i] = top[i - 1]!;
        i--;
      }
      top[i] = { id, v };
    }
  }
  if (top.length < TOP_K) top.sort((a, b) => b.v - a.v);
  const max = top[0]!.v;
  let sum = 0;
  const weights = top.map((t) => (sum += Math.exp(t.v - max)));
  const pick = rand() * sum;
  return top[weights.findIndex((w) => w >= pick)]!.id;
}

const int64 = (ort: Ort, values: number[], dims: number[]) =>
  new ort.Tensor('int64', BigInt64Array.from(values.map(BigInt)), dims);

/**
 * Speak `promptIds` (the line, from the prompt tokenizer) in the voice that
 * `descriptionIds` (the description, from the T5 tokenizer) asks for.
 * Returns mono 44.1 kHz samples.
 */
export async function parlerGenerate(
  ort: Ort,
  m: ParlerModels,
  descriptionIds: number[],
  promptIds: number[],
  options: ParlerOptions,
): Promise<Float32Array> {
  const rand = random(options.seed);
  const S = descriptionIds.length;
  const P = promptIds.length;
  const encoderMask = int64(ort, new Array<number>(S).fill(1), [1, S]);

  const encoded = await m.encoder.run({
    input_ids: int64(ort, descriptionIds, [1, S]),
    attention_mask: encoderMask,
  });
  const hidden = encoded[m.encoder.outputNames[0]!]!;

  const maxSteps =
    Math.ceil(options.maxSeconds * FRAMES_PER_SECOND) + CODEBOOKS;
  const expectedSteps = options.expectedSeconds * FRAMES_PER_SECOND + CODEBOOKS;
  // tokens[t][k]: codebook k at position t; position 0 is the start frame
  const tokens: number[][] = [new Array<number>(CODEBOOKS).fill(BOS)];
  let eosAt = -1;

  let out = await m.decoder.run({
    codec_input_ids: int64(ort, tokens[0]!, [1, CODEBOOKS, 1]),
    prompt_input_ids: int64(ort, promptIds, [1, P]),
    prompt_attention_mask: int64(ort, new Array<number>(P).fill(1), [1, P]),
    encoder_hidden_states: hidden,
    encoder_attention_mask: encoderMask,
  });
  hidden.dispose();
  let session = m.decoder;

  // the cross-attention cache never changes after the first step: keep that
  // one for the whole line. The later steps hand it straight back, and on
  // the GPU that can be the very buffer passed in, so freeing it as "old"
  // garbled every frame after the first few
  const cross: Record<string, Tensor> = {};
  for (const name of m.decoder.outputNames)
    if (name.includes('.encoder.'))
      cross[name.replace('present', 'past_key_values')] = out[name]!;
  const crossKept = new Set(Object.values(cross));
  // (a GPU tensor's .data and a CPU tensor's .gpuBuffer throw: check the location first)
  const isCross = (t: Tensor) =>
    crossKept.has(t) ||
    [...crossKept].some((c) =>
      c.location === 'gpu-buffer'
        ? t.location === 'gpu-buffer' && c.gpuBuffer === t.gpuBuffer
        : c.location === 'cpu' && t.location === 'cpu' && c.data === t.data,
    );
  // free a step's outputs, except anything that is (or shares) the kept cache
  const release = (tensors: Record<string, Tensor>) => {
    for (const tensor of Object.values(tensors))
      if (!isCross(tensor)) tensor.dispose();
  };

  let logitsRead = false;
  for (let t = 1; t < maxSteps; t++) {
    const logitsTensor = out[session.outputNames[0]!]!;
    logitsRead = true;
    // [9, steps, 1088]: each codebook's scores for the next position
    const [, steps, vocab] = logitsTensor.dims as [number, number, number];
    const all = (await logitsTensor.getData()) as Float32Array;
    logitsTensor.dispose();
    const next: number[] = [];
    for (let k = 0; k < CODEBOOKS; k++) {
      if (t <= k) next.push(BOS);
      else if (eosAt > 0 && t >= eosAt + k) next.push(EOS);
      else {
        const from = (k * steps + steps - 1) * vocab;
        // only the first codebook may end the audio; the rest follow it
        next.push(sample(all, from, k === 0 ? CODES + 1 : CODES, rand));
      }
    }
    if (eosAt < 0 && next[0] === EOS) eosAt = t;
    tokens.push(next);
    if (eosAt > 0 && t >= eosAt + CODEBOOKS - 1) break;
    if (t % 8 === 0) options.onProgress?.(Math.min(1, t / expectedSteps));

    // this step's self-attention cache feeds the next, with the kept cross cache
    const past: Record<string, Tensor> = { ...cross };
    const spent: Record<string, Tensor> = {};
    for (const name of session.outputNames.slice(1)) {
      if (name.includes('.encoder.')) spent[name] = out[name]!;
      else past[name.replace('present', 'past_key_values')] = out[name]!;
    }
    const length = P + t + 1;
    const step = await m.decoderWithPast.run({
      codec_input_ids: int64(ort, next, [1, CODEBOOKS, 1]),
      attention_mask: int64(ort, new Array<number>(length).fill(1), [
        1,
        length,
      ]),
      encoder_attention_mask: encoderMask,
      cache_position: int64(ort, [P + t], [1]),
      ...past,
    });
    // the self cache that went in, and the previous step's cross copies
    const used: Record<string, Tensor> = { ...spent };
    for (const [name, tensor] of Object.entries(past))
      if (!(name in cross)) used[name] = tensor;
    release(used);
    out = step;
    session = m.decoderWithPast;
    logitsRead = false;
  }
  // a line that ran to the cap leaves its last scores unread
  if (!logitsRead) out[session.outputNames[0]!]?.dispose();
  const last: Record<string, Tensor> = {};
  for (const name of session.outputNames.slice(1)) last[name] = out[name]!;
  release(last);
  for (const tensor of crossKept) tensor.dispose();

  // undo the delay: frame f of codebook k sits at position f + 1 + k
  const frames = (eosAt > 0 ? eosAt : tokens.length - CODEBOOKS + 1) - 1;
  const keep: number[] = [];
  for (let f = 0; f < frames; f++) {
    let ok = true;
    for (let k = 0; k < CODEBOOKS && ok; k++)
      ok = (tokens[f + 1 + k]?.[k] ?? EOS) < CODES;
    if (ok) keep.push(f);
  }
  if (!keep.length) return new Float32Array(0);
  const codes: number[] = [];
  for (let k = 0; k < CODEBOOKS; k++)
    for (const f of keep) codes.push(tokens[f + 1 + k]![k]!);
  const wav = await m.dac.run({
    audio_codes: int64(ort, codes, [1, CODEBOOKS, keep.length]),
  });
  const audio = wav[m.dac.outputNames[0]!]!;
  const samples = ((await audio.getData()) as Float32Array).slice();
  audio.dispose();
  return samples;
}
