/**
 * Kaldi-style log mel filterbank features, as speaker-embedding models are
 * trained on: 25 ms frames every 10 ms, DC removed, 0.97 pre-emphasis, Povey
 * window, 512-point power spectrum, 80 mel bands from 20 Hz to Nyquist, no
 * dither, then each band's mean over time taken off. Input is mono 16 kHz in
 * -1..1. Returns `frames` rows of `bins` values, row after row.
 */
const RATE = 16000;
const FRAME = 400;
const SHIFT = 160;
const FFT = 512;
const LOW_HZ = 20;
const EPSILON = 1.1920929e-7;

const mel = (hz: number) => 1127 * Math.log(1 + hz / 700);

/** Triangular mel weights over the FFT bins below Nyquist, one row per band. */
function melBank(bins: number): { first: number; weights: Float32Array }[] {
  const half = FFT / 2;
  const low = mel(LOW_HZ);
  const high = mel(RATE / 2);
  const step = (high - low) / (bins + 1);
  const bank: { first: number; weights: Float32Array }[] = [];
  for (let b = 0; b < bins; b++) {
    const left = low + b * step;
    const centre = left + step;
    const right = centre + step;
    let first = -1;
    const row: number[] = [];
    for (let i = 0; i < half; i++) {
      const m = mel((i * RATE) / FFT);
      if (m <= left || m >= right) continue;
      if (first < 0) first = i;
      row.length = i - first;
      row.push(m <= centre ? (m - left) / step : (right - m) / step);
    }
    bank.push({
      first: Math.max(0, first),
      weights: Float32Array.from(row, (w) => w || 0),
    });
  }
  return bank;
}

const banks = new Map<number, ReturnType<typeof melBank>>();
const window = Float32Array.from(
  { length: FRAME },
  (_, i) => (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FRAME - 1))) ** 0.85,
);

/** In-place radix-2 FFT of `re` + i`im` (length a power of two). */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j]!, re[i]!];
      [im[i], im[j]] = [im[j]!, im[i]!];
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const angle = (-2 * Math.PI) / size;
    const wr = Math.cos(angle);
    const wi = Math.sin(angle);
    for (let start = 0; start < n; start += size) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < size / 2; k++) {
        const a = start + k;
        const b = a + size / 2;
        const tr = re[b]! * cr - im[b]! * ci;
        const ti = re[b]! * ci + im[b]! * cr;
        re[b] = re[a]! - tr;
        im[b] = im[a]! - ti;
        re[a] = re[a]! + tr;
        im[a] = im[a]! + ti;
        const next = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = next;
      }
    }
  }
}

export function fbank(
  pcm: Float32Array,
  bins = 80,
): { data: Float32Array; frames: number } {
  const frames =
    pcm.length < FRAME ? 0 : 1 + Math.floor((pcm.length - FRAME) / SHIFT);
  let bank = banks.get(bins);
  if (!bank) banks.set(bins, (bank = melBank(bins)));
  const data = new Float32Array(frames * bins);
  const re = new Float64Array(FFT);
  const im = new Float64Array(FFT);
  for (let f = 0; f < frames; f++) {
    const at = f * SHIFT;
    let mean = 0;
    for (let i = 0; i < FRAME; i++) mean += pcm[at + i]!;
    mean /= FRAME;
    for (let i = 0; i < FRAME; i++) re[i] = pcm[at + i]! - mean;
    for (let i = FRAME - 1; i > 0; i--) re[i] = re[i]! - 0.97 * re[i - 1]!;
    re[0] = re[0]! * (1 - 0.97);
    for (let i = 0; i < FRAME; i++) re[i] = re[i]! * window[i]!;
    re.fill(0, FRAME);
    im.fill(0);
    fft(re, im);
    for (let b = 0; b < bins; b++) {
      const { first, weights } = bank[b]!;
      let energy = 0;
      for (let k = 0; k < weights.length; k++) {
        const i = first + k;
        energy += weights[k]! * (re[i]! * re[i]! + im[i]! * im[i]!);
      }
      data[f * bins + b] = Math.log(Math.max(energy, EPSILON));
    }
  }
  // each band's mean over the clip comes off, as in training
  for (let b = 0; b < bins && frames; b++) {
    let sum = 0;
    for (let f = 0; f < frames; f++) sum += data[f * bins + b]!;
    const mean = sum / frames;
    for (let f = 0; f < frames; f++)
      data[f * bins + b] = data[f * bins + b]! - mean;
  }
  return { data, frames };
}
