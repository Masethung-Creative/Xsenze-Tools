/**
 * Green screen for overlay pictures and videos: pixels near the key colour
 * become see-through, with a soft edge, and the key colour's glow on what
 * stays is toned down. Colours are compared by their tint (the two colour
 * parts of YCbCr), so a shadow on the screen is taken out as well.
 */
import type { ChromaKey } from 'xsenze-tools/lib/video/edit/timeline';

/** #rrggbb as 0..255 parts. */
export function hexToRgb(hex: string): [number, number, number] {
  const value = /^#?([0-9a-f]{6})$/i.exec(hex.trim())?.[1] ?? '00b140';
  const n = parseInt(value, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

const cb = (r: number, g: number, b: number) =>
  -0.1687 * r - 0.3313 * g + 0.5 * b;
const cr = (r: number, g: number, b: number) =>
  0.5 * r - 0.4187 * g - 0.0813 * b;

/** Takes the key out of RGBA pixels, in place. */
export function keyPixels(data: Uint8ClampedArray, key: ChromaKey) {
  const [kr, kg, kb] = hexToRgb(key.colour);
  const kcb = cb(kr, kg, kb);
  const kcr = cr(kr, kg, kb);
  // distances are measured against how strongly tinted the key itself is
  const reach = Math.max(12, Math.hypot(kcb, kcr));
  const near = Math.max(0, Math.min(1, key.range)) * 0.8;
  const far = near + 0.05 + Math.max(0, Math.min(1, key.soft)) * 0.4;
  // the key's strongest part is the one its glow shows in
  const main = kg >= kr && kg >= kb ? 1 : kb >= kr ? 2 : 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const d = Math.hypot(cb(r, g, b) - kcb, cr(r, g, b) - kcr) / reach;
    if (d >= far + 0.15) continue;
    let alpha = 1;
    if (d <= near) alpha = 0;
    else if (d < far) {
      const x = (d - near) / (far - near);
      alpha = x * x * (3 - 2 * x);
    }
    data[i + 3] = Math.round(data[i + 3]! * alpha);
    // the glow: the key's part no stronger than the other two
    const others =
      main === 1
        ? Math.max(r, b)
        : main === 2
          ? Math.max(r, g)
          : Math.max(g, b);
    const at = i + main;
    if (data[at]! > others) data[at] = others;
  }
}

let scratch: OffscreenCanvas | null = null;
/** Longest side keyed; bigger overlays are scaled up from this. */
const limit = 1280;

/** `source` drawn at about `w`×`h` with its key taken out. */
export function keyed(
  source: CanvasImageSource,
  w: number,
  h: number,
  key: ChromaKey,
): CanvasImageSource {
  const scale = Math.min(1, limit / Math.max(w, h, 1));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  scratch ??= new OffscreenCanvas(cw, ch);
  if (scratch.width !== cw) scratch.width = cw;
  if (scratch.height !== ch) scratch.height = ch;
  const ctx = scratch.getContext('2d', { willReadFrequently: true });
  if (!ctx) return source;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(source, 0, 0, cw, ch);
  const image = ctx.getImageData(0, 0, cw, ch);
  keyPixels(image.data, key);
  ctx.putImageData(image, 0, 0);
  return scratch;
}

/** The colour most of a picture's edge has: usually the screen behind. */
export function edgeColour(source: CanvasImageSource, w: number, h: number) {
  const size = 64;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !w || !h) return null;
  ctx.drawImage(source, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  // coarse buckets of the border pixels; the fullest one wins
  const buckets = new Map<
    number,
    { n: number; r: number; g: number; b: number }
  >();
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      if (x > 2 && x < size - 3 && y > 2 && y < size - 3) continue;
      const i = (y * size + x) * 4;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const id = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
      const bucket = buckets.get(id) ?? { n: 0, r: 0, g: 0, b: 0 };
      bucket.n++;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      buckets.set(id, bucket);
    }
  let best: { n: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values())
    if (!best || bucket.n > best.n) best = bucket;
  return best
    ? rgbToHex(best.r / best.n, best.g / best.n, best.b / best.n)
    : null;
}
