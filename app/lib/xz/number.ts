export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** An integer typed into a field, or undefined for anything that is not one. */
export function parseInteger(text: string): number | undefined {
  const trimmed = text.trim();
  if (!/^[-+]?\d+$/.test(trimmed)) return undefined;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : undefined;
}

/** A decimal typed into a field; a comma counts as the decimal point. */
export function parseDecimal(text: string): number | undefined {
  const trimmed = text.trim().replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(trimmed)) return undefined;
  return Number(trimmed);
}

/** Rounded to `decimals` places, then clamped. */
export function roundDecimal(
  value: number,
  decimals: number,
  min: number,
  max: number,
): number {
  const grain = 10 ** decimals;
  return clamp(Math.round(value * grain) / grain, min, max);
}

const formats = new Map<number, Intl.NumberFormat>();

/** Up to `decimals` places, trailing zeros dropped, no grouping, a full stop. */
export function formatDecimal(value: number, decimals: number): string {
  let format = formats.get(decimals);
  if (!format) {
    format = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: decimals,
      useGrouping: false,
    });
    formats.set(decimals, format);
  }
  return format.format(value);
}

/** Snaps to multiples of `step` above `min` and clamps. No step only clamps. */
export function snap(
  raw: number,
  min: number,
  max: number,
  step?: number,
): number {
  const value = clamp(raw, min, max);
  if (!step || step <= 0) return value;
  return Math.min(max, min + Math.round((value - min) / step) * step);
}

/**
 * Drag speed by distance from the slider, in px: full, then a half, a
 * quarter and a tenth: pull away from the slider for fine control.
 */
export const fineTiers = [
  { distance: 60, speed: 0.5 },
  { distance: 120, speed: 0.25 },
  { distance: 180, speed: 0.1 },
] as const;

export function dragSpeed(distance: number): number {
  return (
    [...fineTiers].reverse().find((tier) => distance >= tier.distance)?.speed ??
    1
  );
}
