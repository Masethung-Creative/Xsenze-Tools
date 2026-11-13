import type { Cue } from 'xsenze-tools/lib/subtitles';
import { cueAt } from 'xsenze-tools/components/tools/media/cue-timeline';
import { BASELINE, X_RANGE, Y_RANGE } from 'xsenze-tools/lib/subtitle-burn';

/** SMPTE ST 2046-1 graphics-safe inset, a fraction of each side. */
export const UNSAFE = 0.05;
/** CSS px within which a drag snaps to the centre or the baseline. */
export const SNAP_DISTANCE = 10;

const clamp = (value: number, [low, high]: readonly [number, number]) =>
  Math.min(Math.max(value, low), high);

/** The playing cue, or between cues the next one (the last after the end) as a ghost. */
export function shown(
  cues: Cue[],
  ms: number,
): { index: number; ghost: boolean } | null {
  if (cues.length === 0) return null;
  const index = cueAt(cues, ms);
  if (index >= 0) return { index, ghost: false };
  const next = cues.findIndex((cue) => cue.start > ms);
  return { index: next >= 0 ? next : cues.length - 1, ghost: true };
}

/** y for the Top, Middle and Bottom presets (0, 1, 2). */
export function placement(place: number, size: number): number {
  const baseline =
    place === 0 ? UNSAFE + size : place === 1 ? 0.5 + size * 0.35 : BASELINE;
  return clamp(baseline - BASELINE, Y_RANGE);
}

export function clampPosition(x: number, y: number) {
  return { x: clamp(x, X_RANGE), y: clamp(y, Y_RANGE) };
}

/** Within SNAP_DISTANCE of the centre line or the baseline, the axis snaps to 0. */
export function snap(x: number, y: number, width: number, height: number) {
  return {
    x: Math.abs(x) * width < SNAP_DISTANCE ? 0 : x,
    y: Math.abs(y) * height < SNAP_DISTANCE ? 0 : y,
  };
}

/**
 * The cue Previous (-1) or Next (1) goes to from `ms`; Previous skips the
 * cue that started under 250 ms ago, so a second press goes further back.
 */
export function jumpTarget(cues: Cue[], ms: number, offset: -1 | 1) {
  if (offset > 0) {
    const next = cues.findIndex((cue) => cue.start > ms + 1);
    return next >= 0 ? next : null;
  }
  const before = cues.findLastIndex((cue) => cue.start < ms - 250);
  return before >= 0 ? before : null;
}
