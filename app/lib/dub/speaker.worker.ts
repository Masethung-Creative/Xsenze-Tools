/// <reference lib="webworker" />
/**
 * Speaker embeddings in a worker: one voiceprint per stretch of speech, so
 * lines by the same person can be grouped. CAM++ (3D-Speaker, Apache 2.0),
 * trained on 200k Chinese and English speakers, about 28 MB once. It reads
 * Kaldi filterbank features (see `fbank.ts`) and gives a 192-value print.
 * In:  { type: 'embed', id, segments: Float32Array[] (mono 16 kHz) }
 * Out: { type: 'progress', id, phase: 'download' | 'embed', ratio }
 *      { type: 'result', id, embeddings: Float32Array[] } | { type: 'error', id, message }
 */
import { loadOrt, type Ort } from 'xsenze-tools/lib/dub/ort';
import { fbank } from 'xsenze-tools/lib/dub/fbank';
import { fetchCached } from 'xsenze-tools/lib/dub/fetch-cached';

type Session = import('onnxruntime-web').InferenceSession;

const MODEL =
  'https://huggingface.co/csukuangfj/speaker-embedding-models/resolve/0743f301363dec56491a490f6d6cbc9d67f9a3bf/3dspeaker_speech_campplus_sv_zh_en_16k-common_advanced.onnx';
const BINS = 80;
/** Shorter than this gives the model too few frames to read a voice. */
const MIN_SAMPLES = 16000 / 4;

type Incoming = { type: 'embed'; id: number; segments: Float32Array[] };

interface Loaded {
  ort: Ort;
  session: Session;
}

let loading: Promise<Loaded> | null = null;

function load(onProgress: (ratio: number) => void): Promise<Loaded> {
  loading ??= (async () => {
    const ort = await loadOrt();
    const bytes = await fetchCached(MODEL, (p) =>
      onProgress(p.total ? p.loaded / p.total : 0),
    ).then((r) => r.arrayBuffer());
    const session = await ort.InferenceSession.create(new Uint8Array(bytes), {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    return { ort, session };
  })();
  loading.catch(() => (loading = null));
  return loading;
}

/** Repeat a very short clip so the model still sees enough frames. */
function padded(segment: Float32Array): Float32Array {
  if (segment.length >= MIN_SAMPLES || !segment.length) return segment;
  const out = new Float32Array(MIN_SAMPLES);
  for (let i = 0; i < out.length; i++) out[i] = segment[i % segment.length]!;
  return out;
}

async function embed(message: Incoming): Promise<Float32Array[]> {
  const report = (phase: 'download' | 'embed', ratio: number) =>
    postMessage({ type: 'progress', id: message.id, phase, ratio });
  const { ort, session } = await load((r) => report('download', r));
  const input = session.inputNames[0]!;
  const output = session.outputNames[0]!;
  const out: Float32Array[] = [];
  for (const [i, segment] of message.segments.entries()) {
    const { data, frames } = fbank(padded(segment), BINS);
    const x = new ort.Tensor('float32', data, [1, frames, BINS]);
    const result = await session.run({ [input]: x });
    x.dispose();
    const print = result[output]!;
    out.push(Float32Array.from(print.data as Float32Array));
    print.dispose();
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
