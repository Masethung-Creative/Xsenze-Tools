/**
 * Noise reduction by spectral gating, on the device and without a model.
 * The sound is cut into short overlapping frames; the quietest frames give
 * the noise's level at each pitch, and every frame then keeps only what
 * stands above that level. Gains are smoothed over pitch and time, so the
 * result does not chirp.
 */

const SIZE = 1024;
const HOP = SIZE / 4;
const BINS = SIZE / 2 + 1;
/** Share of frames, the quietest, that teach the noise. */
const QUIET = 0.15;

const window = (() => {
  const w = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i++)
    w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / SIZE);
  return w;
})();

/** In-place radix-2 FFT; `inverse` without the 1/N. */
function fft(re: Float32Array, im: Float32Array, inverse: boolean) {
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
  for (let len = 2; len <= n; len <<= 1) {
    const angle = ((inverse ? 2 : -2) * Math.PI) / len;
    const wr = Math.cos(angle);
    const wi = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
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

/** Lets the page breathe during long work. */
const breathe = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function frameCount(length: number) {
  return Math.max(1, Math.ceil((length + SIZE) / HOP));
}

/** One windowed frame's spectrum, starting at sample `at` (may be negative). */
function spectrum(
  data: Float32Array,
  at: number,
  re: Float32Array,
  im: Float32Array,
) {
  for (let i = 0; i < SIZE; i++) {
    const s = at + i;
    re[i] = s >= 0 && s < data.length ? data[s]! * window[i]! : 0;
    im[i] = 0;
  }
  fft(re, im, false);
}

/** The noise's level at each pitch, from the quietest frames. */
async function noiseProfile(data: Float32Array): Promise<Float32Array> {
  const frames = frameCount(data.length);
  const energy = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let e = 0;
    const at = f * HOP - SIZE;
    for (let i = 0; i < SIZE; i++) {
      const s = at + i;
      if (s >= 0 && s < data.length) e += data[s]! * data[s]!;
    }
    energy[f] = e;
  }
  // frames that are not silence padding at the very ends
  const order = [...energy.keys()]
    .filter((f) => energy[f]! > 1e-10)
    .sort((a, b) => energy[a]! - energy[b]!);
  const quiet = order.slice(0, Math.max(1, Math.round(order.length * QUIET)));
  const noise = new Float32Array(BINS);
  const re = new Float32Array(SIZE);
  const im = new Float32Array(SIZE);
  for (let k = 0; k < quiet.length; k++) {
    spectrum(data, quiet[k]! * HOP - SIZE, re, im);
    for (let b = 0; b < BINS; b++)
      noise[b] = noise[b]! + Math.hypot(re[b]!, im[b]!);
    if (k % 400 === 399) await breathe();
  }
  for (let b = 0; b < BINS; b++) noise[b] = noise[b]! / quiet.length;
  return noise;
}

/** One channel, cleaned. `strength` 0 to 1. */
async function cleanChannel(
  data: Float32Array,
  strength: number,
): Promise<Float32Array<ArrayBuffer>> {
  const noise = await noiseProfile(data);
  const over = 1.5 + 1.5 * strength;
  const floor = 0.3 - 0.25 * strength;
  const frames = frameCount(data.length);
  const out = new Float32Array(data.length + SIZE * 2);
  const re = new Float32Array(SIZE);
  const im = new Float32Array(SIZE);
  const gain = new Float32Array(BINS);
  const last = new Float32Array(BINS).fill(1);
  for (let f = 0; f < frames; f++) {
    const at = f * HOP - SIZE;
    spectrum(data, at, re, im);
    for (let b = 0; b < BINS; b++) {
      const mag = Math.hypot(re[b]!, im[b]!) + 1e-12;
      gain[b] = Math.max(floor, 1 - (over * noise[b]!) / mag);
    }
    // smoothed over neighbouring pitches, and falling slowly over time
    for (let b = 0; b < BINS; b++) {
      const near =
        (gain[Math.max(0, b - 1)]! +
          gain[b]! +
          gain[Math.min(BINS - 1, b + 1)]!) /
        3;
      const g = Math.max(near, last[b]! * 0.6);
      last[b] = g;
      re[b] = re[b]! * g;
      im[b] = im[b]! * g;
      // the mirrored half keeps the signal real
      if (b > 0 && b < SIZE / 2) {
        re[SIZE - b] = re[b]!;
        im[SIZE - b] = -im[b]!;
      }
    }
    fft(re, im, true);
    for (let i = 0; i < SIZE; i++) {
      const s = at + i + SIZE;
      // Hann in and out at a quarter hop sums to 1.5
      out[s] = out[s]! + ((re[i]! / SIZE) * window[i]!) / 1.5;
    }
    if (f % 400 === 399) await breathe();
  }
  return out.subarray(SIZE, SIZE + data.length);
}

/** The sound with its steady background noise taken down. */
export async function denoise(
  buffer: AudioBuffer,
  strength: number,
): Promise<AudioBuffer> {
  const out = new AudioBuffer({
    numberOfChannels: buffer.numberOfChannels,
    length: buffer.length,
    sampleRate: buffer.sampleRate,
  });
  for (let c = 0; c < buffer.numberOfChannels; c++)
    out.copyToChannel(
      await cleanChannel(buffer.getChannelData(c), strength),
      c,
    );
  return out;
}
