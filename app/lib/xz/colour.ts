/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted.
 */
/**
 * Colour maths, ported from DelphiCore's DelphiColour. A colour is sRGB,
 * each channel 0...1 and unclamped until it is shown; every conversion goes
 * through sRGB.
 */
export type Rgb = readonly [r: number, g: number, b: number];
export type Triple = [number, number, number];

export type ColourFormat =
  'hex' | 'rgb' | 'hsl' | 'lab' | 'lch' | 'oklab' | 'oklch';

export const colourFormats: ColourFormat[] = [
  'hex',
  'rgb',
  'hsl',
  'lab',
  'lch',
  'oklab',
  'oklch',
];

export const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const byte = (v: number) => Math.round(clamp01(v) * 255);
const turn = (degrees: number) => (degrees < 0 ? degrees + 360 : degrees);

export function clamped(colour: Rgb): Triple {
  return [clamp01(colour[0]), clamp01(colour[1]), clamp01(colour[2])];
}

/** `#RRGGBB`, upper case, clamped. */
export function hex(colour: Rgb): string {
  return (
    '#' +
    colour
      .map((v) => byte(v).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/** Six or three hex digits, with or without `#`. */
export function parseHex(text: string): Triple | undefined {
  let digits = text.trim().replace(/^#/, '');
  if (/^[\da-f]{3}$/i.test(digits))
    digits = [...digits].map((d) => d + d).join('');
  if (!/^[\da-f]{6}$/i.test(digits)) return undefined;
  return [0, 2, 4].map(
    (i) => parseInt(digits.slice(i, i + 2), 16) / 255,
  ) as Triple;
}

export function rgb255(colour: Rgb): Triple {
  return [byte(colour[0]), byte(colour[1]), byte(colour[2])];
}

/** Hue 0...360, saturation and lightness 0...100. */
export function hsl(colour: Rgb): Triple {
  const [r, g, b] = clamped(colour);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta <= 1e-10) return [0, 0, l * 100];
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = 60 * (((g - b) / delta) % 6);
  else if (max === g) h = 60 * ((b - r) / delta + 2);
  else h = 60 * ((r - g) / delta + 4);
  return [turn(h), s * 100, l * 100];
}

export function fromHsl(h: number, s: number, l: number): Triple {
  const s1 = s / 100;
  const l1 = l / 100;
  const c = (1 - Math.abs(2 * l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l1 - c / 2;
  const [r, g, b]: Triple =
    h >= 0 && h < 60
      ? [c, x, 0]
      : h >= 60 && h < 120
        ? [x, c, 0]
        : h >= 120 && h < 180
          ? [0, c, x]
          : h >= 180 && h < 240
            ? [0, x, c]
            : h >= 240 && h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [r + m, g + m, b + m];
}

/** Hue 0...360, saturation and brightness 0...1. */
export function hsb(colour: Rgb): Triple {
  const [r, g, b] = clamped(colour);
  const top = Math.max(r, g, b);
  return [hsl(colour)[0], top > 0 ? (top - Math.min(r, g, b)) / top : 0, top];
}

/** Hue 0...1 to the fully saturated sRGB colour at that hue. */
export function hueRgb(h: number): Triple {
  return [h * 6, h * 6 + 4, h * 6 + 2].map((k) => {
    const wrapped = k - 6 * Math.floor(k / 6);
    return clamp01(Math.abs(wrapped - 3) - 1);
  }) as Triple;
}

export function fromHsb(h: number, s: number, b: number): Triple {
  return hueRgb(h / 360).map((v) => b * (1 - s + s * v)) as Triple;
}

function toLinear(v: number) {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function fromLinear(v: number) {
  const c = Math.max(0, v);
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

function linear(colour: Rgb): Triple {
  return clamped(colour).map(toLinear) as Triple;
}

const d65 = [0.95047, 1, 1.08883] as const;

export function xyz(colour: Rgb): Triple {
  const [r, g, b] = linear(colour);
  return [
    0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    0.2126729 * r + 0.7151522 * g + 0.072175 * b,
    0.0193339 * r + 0.119192 * g + 0.9503041 * b,
  ];
}

const delta = 6 / 29;
const labF = (t: number) =>
  t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta * delta) + 4 / 29;
const labFInverse = (t: number) =>
  t > delta ? t ** 3 : 3 * delta * delta * (t - 4 / 29);

/** CIELAB, D65. */
export function lab(colour: Rgb): Triple {
  const [x, y, z] = xyz(colour);
  const fx = labF(x / d65[0]);
  const fy = labF(y / d65[1]);
  const fz = labF(z / d65[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** CIELAB to linear sRGB, unclamped: outside 0...1 is outside the gamut. */
export function labToLinear(l: number, a: number, b: number): Triple {
  const fy = (l + 16) / 116;
  const x = d65[0] * labFInverse(a / 500 + fy);
  const y = d65[1] * labFInverse(fy);
  const z = d65[2] * labFInverse(fy - b / 200);
  return [
    3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  ];
}

export function fromLab(l: number, a: number, b: number): Triple {
  return labToLinear(l, a, b).map(fromLinear) as Triple;
}

function polar([l, a, b]: Triple): Triple {
  return [l, Math.hypot(a, b), turn((Math.atan2(b, a) * 180) / Math.PI)];
}

function cartesian(l: number, c: number, h: number): Triple {
  const radians = (h * Math.PI) / 180;
  return [l, c * Math.cos(radians), c * Math.sin(radians)];
}

export function lch(colour: Rgb): Triple {
  return polar(lab(colour));
}

export function fromLch(l: number, c: number, h: number): Triple {
  return fromLab(...cartesian(l, c, h));
}

export function oklab(colour: Rgb): Triple {
  const [r, g, b] = linear(colour);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab to linear sRGB, unclamped: outside 0...1 is outside the gamut. */
export function oklabToLinear(l: number, a: number, b: number): Triple {
  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
}

export function fromOklab(l: number, a: number, b: number): Triple {
  return oklabToLinear(l, a, b).map(fromLinear) as Triple;
}

export function oklch(colour: Rgb): Triple {
  return polar(oklab(colour));
}

export function fromOklch(l: number, c: number, h: number): Triple {
  return fromOklab(...cartesian(l, c, h));
}

/** Naive CMYK, each 0...1: black takes the darkest channel, no ink limit or profile. */
export function cmyk(colour: Rgb): [number, number, number, number] {
  const [r, g, b] = clamped(colour);
  const black = 1 - Math.max(r, g, b);
  if (black >= 1) return [0, 0, 0, 1];
  const ink = (v: number) => (1 - v - black) / (1 - black);
  return [ink(r), ink(g), ink(b), black];
}

export function fromCmyk(c: number, m: number, y: number, k: number): Triple {
  return [(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)];
}

/** WCAG 2.2 relative luminance. */
export function luminance(colour: Rgb): number {
  const [r, g, b] = linear(colour);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(one: Rgb, two: Rgb): number {
  const a = luminance(one);
  const b = luminance(two);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** WCAG 2.2 levels (1.4.3, 1.4.6, 1.4.11). */
export const contrastLevels = { aaLarge: 3, aa: 4.5, aaa: 7 } as const;

/** Not rounded up: 4.499 shows 4.49, which fails 4.5. No trailing zeros. */
export function contrastFigure(ratio: number): string {
  const floored = Math.floor(ratio * 100 + 1e-9) / 100;
  return floored.toFixed(2).replace(/\.?0+$/, '');
}

/** Black type has more contrast on this colour than white. */
export function takesBlackInk(colour: Rgb): boolean {
  return contrastRatio(colour, [0, 0, 0]) >= contrastRatio(colour, [1, 1, 1]);
}

export function formatLabel(format: ColourFormat): string {
  return format.toUpperCase();
}

/** The colour as CSS-like text, in the decimals DelphiCore uses. */
export function formatColour(colour: Rgb, format: ColourFormat): string {
  const fixed = (values: Triple, digits: number[]) =>
    values.map((v, i) => v.toFixed(digits[i])).join(' ');
  switch (format) {
    case 'hex':
      return hex(colour);
    case 'rgb':
      return `rgb(${rgb255(colour).join(', ')})`;
    case 'hsl': {
      const [h, s, l] = hsl(colour).map((v) => v.toFixed(0));
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    case 'lab':
      return `lab(${fixed(lab(colour), [1, 1, 1])})`;
    case 'lch':
      return `lch(${fixed(lch(colour), [1, 1, 1])})`;
    case 'oklab':
      return `oklab(${fixed(oklab(colour), [4, 4, 4])})`;
    case 'oklch':
      return `oklch(${fixed(oklch(colour), [4, 4, 1])})`;
  }
}

const notations: Record<string, (a: number, b: number, c: number) => Triple> = {
  rgb: (r, g, b) => [r / 255, g / 255, b / 255],
  hsl: fromHsl,
  lab: fromLab,
  lch: fromLch,
  oklab: fromOklab,
  oklch: fromOklch,
};

/**
 * Any notation the app reads: `#RRGGBB`, `RRGGBB`, `#RGB`, and rgb, hsl, lab,
 * lch, oklab and oklch functions with commas or spaces and optional `%`.
 */
export function parseColour(input: string): Triple | undefined {
  const text = input.trim();
  const fromHex = parseHex(text);
  if (fromHex) return fromHex;
  const match = /^([a-z]+)\((.*)\)$/.exec(text.toLowerCase());
  const convert = match && notations[match[1]!];
  if (!match || !convert) return undefined;
  const parts = match[2]!
    .replace(/[,%]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(Number);
  if (parts.length !== 3 || !parts.every(Number.isFinite)) return undefined;
  const colour = convert(...(parts as Triple));
  return colour.every(Number.isFinite) ? colour : undefined;
}
