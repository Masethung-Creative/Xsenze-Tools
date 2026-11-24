/** Shortest selection in seconds. */
export const minimumSpan = 0.01;

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

/** Seconds rounded to the millisecond, as the editor reports them. */
export const roundMs = (seconds: number) => Math.round(seconds * 1000) / 1000;

/**
 * In and out points kept inside the file and at least `minimumSpan` apart.
 * A start past the end stops short of it. An end before the
 * start pulls the start back, unless `moved` is 'end': then the end
 * stops short of the start.
 */
export function clampSpan(
  start: number,
  end: number,
  duration: number,
  moved?: 'start' | 'end',
): [number, number] {
  const span = Math.min(minimumSpan, Math.max(0, duration));
  if (moved === 'end') end = Math.max(end, Math.min(duration, start + span));
  const from = clamp(start, 0, Math.max(0, Math.min(end, duration) - span));
  const to = Math.max(Math.min(duration, end), Math.min(duration, from + span));
  return [roundMs(from), roundMs(to)];
}

/** Seconds one arrow key moves a handle. */
export const nudgeStep = (duration: number) => Math.max(0.1, duration / 100);

/** Where `seconds` falls along the file, 0 to 1. */
export function share(seconds: number, duration: number): number {
  return duration > 0 ? clamp(seconds / duration, 0, 1) : 0;
}

/** A handle dragged `pixels` sideways along a track `width` wide, from `origin` seconds. */
export function dragTo(
  origin: number,
  pixels: number,
  width: number,
  duration: number,
  rtl = false,
): number {
  const delta = (pixels / Math.max(1, width)) * duration;
  return roundMs(origin + (rtl ? -delta : delta));
}
