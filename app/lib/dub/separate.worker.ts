/// <reference lib="webworker" />
/**
 * Splits a recording into its voices and everything else (music, effects) with
 * HTDemucs on WebGPU, so a dub can keep the background without the original speech.
 * In:  { type: 'separate', id, left, right }  44.1 kHz stereo
 * Out: { type: 'progress', id, phase: 'download' | 'separate', ratio }
 *      { type: 'result', id, rest: [left, right], voice: [left, right] }
 *      { type: 'error', id, message }
 */
import { CONSTANTS, prepareModelInput, standaloneIspec } from 'demucs-web';
import { loadOrt, type Ort } from 'xsenze-tools/lib/dub/ort';
import { fetchCached } from 'xsenze-tools/lib/dub/fetch-cached';

type Session = import('onnxruntime-web').InferenceSession;
type Tensor = import('onnxruntime-web').Tensor;
type Provider =
  import('onnxruntime-web').InferenceSession.ExecutionProviderConfig;

/** HTDemucs in fp16 (fp32 convolutions), cut into 21 pieces that run in order. */
const REPO =
  'https://huggingface.co/monteslu/htdemucs-web-onnx/resolve/a4a57cc0cf707e5b9a3e6ad3c2c4b21fcbe608c1';
/** All 21 pieces, for the download bar. */
const TOTAL_BYTES = 125.9e6;
/** Piece 0's input normalisation turns to NaN in fp16 on WebGPU, so it runs on the CPU. */
const CPU_NODES = [
  '/ReduceMean',
  '/Sub',
  '/Pow',
  '/ReduceMean_1',
  '/Clip',
  '/Sqrt',
  '/Add',
  '/Div',
  '/ReduceMean_2',
  '/Sub_1',
  '/Pow_1',
  '/ReduceMean_3',
  '/Clip_1',
  '/Sqrt_1',
  '/Add_1',
  '/Div_1',
];
const N = CONSTANTS.TRAINING_SAMPLES;
const PLANE = CONSTANTS.MODEL_SPEC_BINS * CONSTANTS.MODEL_SPEC_FRAMES;
/** Stems come out as drums, bass, other, vocals. */
const VOICE = [3];
const REST = [0, 1, 2];

interface Piece {
  file: string;
  inputs: string[];
  outputs: string[];
}

interface Model {
  ort: Ort;
  pieces: Piece[];
  sessions: Session[];
  freq: string;
  time: string;
}

type Stereo = [Float32Array, Float32Array];

let loading: Promise<Model> | null = null;

function load(onProgress: (ratio: number) => void): Promise<Model> {
  loading ??= (async () => {
    if (!navigator.gpu || !(await navigator.gpu.requestAdapter()))
      throw new Error('Separating music needs WebGPU');
    const ort = await loadOrt();
    const manifest = (await (
      await fetchCached(`${REPO}/htdemucs_split_manifest.json`)
    ).json()) as {
      pieces: Piece[];
      outputs: { freq: string; time: string };
    };
    let done = 0;
    const sessions: Session[] = [];
    for (const [i, piece] of manifest.pieces.entries()) {
      const bytes = await (
        await fetchCached(`${REPO}/${piece.file}`, (p) =>
          onProgress(Math.min(1, (done + p.loaded) / TOTAL_BYTES)),
        )
      ).arrayBuffer();
      done += bytes.byteLength;
      const provider = (
        i === 0 ? { name: 'webgpu', forceCpuNodeNames: CPU_NODES } : 'webgpu'
      ) as Provider;
      // WebGPU sessions are made one at a time
      sessions.push(
        await ort.InferenceSession.create(new Uint8Array(bytes), {
          executionProviders: [provider],
          graphOptimizationLevel: 'all',
          preferredOutputLocation: 'gpu-buffer',
        }),
      );
    }
    onProgress(1);
    return {
      ort,
      pieces: manifest.pieces,
      sessions,
      freq: manifest.outputs.freq,
      time: manifest.outputs.time,
    };
  })();
  loading.catch(() => (loading = null));
  return loading;
}

/** The sum of `stems`: the frequency branch through the inverse STFT, plus the time branch. */
function stems(
  freq: Float32Array,
  time: Float32Array,
  which: number[],
): Stereo {
  const spec = {
    leftReal: new Float32Array(PLANE),
    leftImag: new Float32Array(PLANE),
    rightReal: new Float32Array(PLANE),
    rightImag: new Float32Array(PLANE),
  };
  const parts = [spec.leftReal, spec.leftImag, spec.rightReal, spec.rightImag];
  for (const s of which)
    for (const [c, part] of parts.entries()) {
      const base = (s * 4 + c) * PLANE;
      for (let i = 0; i < PLANE; i++) part[i]! += freq[base + i]!;
    }
  const { left, right } = standaloneIspec(spec, N);
  for (const s of which) {
    const base = s * 2 * N;
    for (let i = 0; i < N; i++) {
      left[i]! += time[base + i]!;
      right[i]! += time[base + N + i]!;
    }
  }
  return [left, right];
}

/** One model-length segment through the pieces: its voice and the rest. */
async function segment(m: Model, left: Float32Array, right: Float32Array) {
  const input = prepareModelInput(left, right);
  const feeds: Record<string, Tensor> = {
    mix: new m.ort.Tensor('float32', input.waveform, [1, 2, N]),
    mag: new m.ort.Tensor('float32', input.magSpec, [
      1,
      4,
      CONSTANTS.MODEL_SPEC_BINS,
      CONSTANTS.MODEL_SPEC_FRAMES,
    ]),
  };
  const made: Tensor[] = [];
  try {
    for (const [i, piece] of m.pieces.entries()) {
      const inputs = Object.fromEntries(
        piece.inputs.map((name) => [name, feeds[name]!]),
      );
      const out = await m.sessions[i]!.run(inputs);
      for (const [name, tensor] of Object.entries(out)) {
        feeds[name] = tensor;
        made.push(tensor);
      }
    }
    const freq = (await feeds[m.freq]!.getData()) as Float32Array;
    const time = (await feeds[m.time]!.getData()) as Float32Array;
    return { voice: stems(freq, time, VOICE), rest: stems(freq, time, REST) };
  } finally {
    for (const t of made) t.dispose();
  }
}

/** The whole recording, segment by overlapping segment, cross-faded back together. */
async function separate(
  m: Model,
  left: Float32Array,
  right: Float32Array,
  onProgress: (ratio: number) => void,
) {
  const total = left.length;
  const stride = Math.floor(N * (1 - CONSTANTS.SEGMENT_OVERLAP));
  const fade = stride * 0.5;
  const count = Math.max(1, Math.ceil(total / stride));
  const voice: Stereo = [new Float32Array(total), new Float32Array(total)];
  const rest: Stereo = [new Float32Array(total), new Float32Array(total)];
  const weight = new Float32Array(total);
  let k = 0;
  for (let start = 0; start < total; start += stride) {
    const length = Math.min(N, total - start);
    const l = new Float32Array(N);
    const r = new Float32Array(N);
    l.set(left.subarray(start, start + length));
    r.set(right.subarray(start, start + length));
    const out = await segment(m, l, r);
    for (let i = 0; i < length; i++) {
      const w = Math.min(i / fade, (length - i) / fade, 1);
      const at = start + i;
      voice[0][at]! += out.voice[0][i]! * w;
      voice[1][at]! += out.voice[1][i]! * w;
      rest[0][at]! += out.rest[0][i]! * w;
      rest[1][at]! += out.rest[1][i]! * w;
      weight[at]! += w;
    }
    onProgress(++k / count);
  }
  for (let i = 0; i < total; i++) {
    const w = weight[i]!;
    if (!w) continue;
    voice[0][i]! /= w;
    voice[1][i]! /= w;
    rest[0][i]! /= w;
    rest[1][i]! /= w;
  }
  return { voice, rest };
}

type Incoming = {
  type: 'separate';
  id: number;
  left: Float32Array;
  right: Float32Array;
};

// one job at a time: two runs must never share the sessions at once
let queue: Promise<unknown> = Promise.resolve();

addEventListener('message', (event: MessageEvent<Incoming>) => {
  const { id, left, right } = event.data;
  queue = queue.then(async () => {
    try {
      const m = await load((ratio) =>
        postMessage({ type: 'progress', id, phase: 'download', ratio }),
      );
      const { voice, rest } = await separate(m, left, right, (ratio) =>
        postMessage({ type: 'progress', id, phase: 'separate', ratio }),
      );
      postMessage({ type: 'result', id, voice, rest }, [
        voice[0].buffer,
        voice[1].buffer,
        rest[0].buffer,
        rest[1].buffer,
      ]);
    } catch (error) {
      postMessage({
        type: 'error',
        id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
});
