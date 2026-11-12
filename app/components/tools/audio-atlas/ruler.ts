/** Tick spacings in seconds, finest first. */
const steps = [
  0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800,
  3600,
];
/** Least px between labels. */
const spacing = 64;
// a huge span has unreadable ticks
const mostTicks = 2000;

export function step(span: number, width: number): number {
  if (!(span > 0) || !(width > 0)) return steps[0]!;
  const least = (span / width) * spacing;
  return steps.find((s) => s >= least) ?? steps.at(-1)!;
}

/** Seconds, then m:ss, with as many decimals as the step needs. */
export function label(seconds: number, by: number): string {
  const decimals = by < 0.1 ? 2 : by < 1 ? 1 : 0;
  if (seconds < 60) return seconds.toFixed(decimals);
  const width = decimals === 0 ? 2 : decimals + 3;
  const rest = (seconds % 60).toFixed(decimals).padStart(width, '0');
  return `${Math.floor(seconds / 60)}:${rest}`;
}

export interface Tick {
  /** Share of the width from the start edge, 0 to 1. */
  at: number;
  /** Every fifth tick is long and labelled. */
  text: string | null;
}

/** The ticks of the view: a minor tick each fifth of a step, labels on the steps. */
export function ticks(start: number, end: number, width: number): Tick[] {
  const span = end - start;
  if (!(span > 0)) return [];
  const by = step(span, width);
  const minor = by / 5;
  const first = Math.ceil(start / minor - 1e-9);
  const last = Math.floor(end / minor + 1e-9);
  if (last < first || last - first >= mostTicks) return [];
  const out: Tick[] = [];
  for (let index = first; index <= last; index++) {
    const seconds = index * minor;
    out.push({
      at: (seconds - start) / span,
      text: index % 5 === 0 ? label(seconds, by) : null,
    });
  }
  return out;
}

/** The kHz labels at a quarter, half and three quarters of the plate, bottom up. */
export function frequencies(sampleRate: number): string[] {
  if (!(sampleRate > 0)) return [];
  return [1, 2, 3].map(
    (part) => `${Math.round(((sampleRate / 2) * part) / 4 / 100) / 10} kHz`,
  );
}
