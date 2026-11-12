import { channelsOf, fftMagnitudes } from 'xsenze-tools/lib/audio';

const fftSize = 1024;
const mostColumns = 800;
const rows = 256;
const floorDb = -90;
const columnsPerFrame = 24;

/** Brand ramp: warm black floor, Xsenze orange, near white. */
function palette(): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256 * 3);
  const stops: [number, number, number][] = [
    [12, 10, 9],
    [255, 56, 0],
    [250, 250, 249],
  ];
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const seg = t < 0.5 ? 0 : 1;
    const local = (t - seg * 0.5) * 2;
    for (let c = 0; c < 3; c++)
      lut[i * 3 + c] =
        stops[seg]![c]! + (stops[seg + 1]![c]! - stops[seg]![c]!) * local;
  }
  return lut;
}

const hann = Float32Array.from(
  { length: fftSize },
  (_, i) => 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1))),
);

/** Seconds a spectrogram of the view covers: at least one FFT block. */
export function coverage(
  buffer: AudioBuffer,
  start: number,
  end: number,
): [number, number] {
  const { sampleRate, length } = buffer;
  const from = Math.floor(start * sampleRate);
  const to = Math.min(
    length,
    Math.max(from + fftSize, Math.ceil(end * sampleRate)),
  );
  return [from / sampleRate, to / sampleRate];
}

/**
 * Paints the mono mix of `start` to `end` into `canvas`, low frequencies at
 * the bottom, a few columns a frame. Resolves false once `live` turns false.
 */
export function paint(
  canvas: HTMLCanvasElement,
  buffer: AudioBuffer,
  [start, end]: [number, number],
  live: () => boolean,
): Promise<boolean> {
  const { sampleRate } = buffer;
  const from = Math.round(start * sampleRate);
  const to = Math.round(end * sampleRate);
  const channels = channelsOf(buffer);
  const mono = new Float32Array(to - from);
  for (const channel of channels)
    for (let i = 0; i < mono.length; i++)
      mono[i]! += channel[from + i]! / channels.length;

  const hop = Math.max(
    fftSize / 8,
    Math.floor((mono.length - fftSize) / mostColumns),
  );
  const columns = Math.max(1, Math.floor((mono.length - fftSize) / hop) + 1);
  canvas.width = columns;
  canvas.height = rows;
  const context = canvas.getContext('2d');
  if (!context) return Promise.resolve(false);

  const lut = palette();
  const block = new Float32Array(fftSize);
  const binsPerRow = fftSize / 2 / rows;
  let column = 0;

  return new Promise((resolve) => {
    const some = () => {
      if (!live()) return resolve(false);
      const image = context.createImageData(
        Math.min(columnsPerFrame, columns - column),
        rows,
      );
      for (let x = 0; x < image.width; x++, column++) {
        const offset = column * hop;
        for (let i = 0; i < fftSize; i++)
          block[i] = (mono[offset + i] ?? 0) * hann[i]!;
        const magnitudes = fftMagnitudes(block);
        for (let row = 0; row < rows; row++) {
          const bin = Math.floor((rows - 1 - row) * binsPerRow);
          const db = 20 * Math.log10(magnitudes[bin]! + 1e-12);
          const t = Math.min(1, Math.max(0, 1 - db / floorDb));
          const entry = Math.round(t * 255) * 3;
          const px = (row * image.width + x) * 4;
          image.data[px] = lut[entry]!;
          image.data[px + 1] = lut[entry + 1]!;
          image.data[px + 2] = lut[entry + 2]!;
          image.data[px + 3] = 255;
        }
      }
      context.putImageData(image, column - image.width, 0);
      if (column < columns) requestAnimationFrame(some);
      else resolve(true);
    };
    requestAnimationFrame(some);
  });
}
