/** Common frame rates; NTSC is the nominal rate × 1000/1001. */
export const RATES = [
  { label: '24 NTSC', fps: 24000 / 1001 },
  { label: '24', fps: 24 },
  { label: '25', fps: 25 },
  { label: '30 NTSC', fps: 30000 / 1001 },
  { label: '30', fps: 30 },
  { label: '50', fps: 50 },
  { label: '60 NTSC', fps: 60000 / 1001 },
  { label: '60', fps: 60 },
];

/** A from-to pick; one side picked alone means the same rate both sides. */
export function ratePair(
  from: number | undefined,
  to: number | undefined,
): { from: number; to: number; factor: number } {
  const f = from ?? to ?? 0;
  const t = to ?? f;
  return { from: f, to: t, factor: RATES[f]!.fps / RATES[t]!.fps };
}

/** `?subRate=0,2`: a from,to pair of rate indexes. */
export function parseRatePair(value: string | null) {
  const pair = (value ?? '').split(',').map(Number);
  return pair.length === 2 &&
    pair.every((i) => Number.isInteger(i) && i >= 0 && i < RATES.length)
    ? ratePair(pair[0], pair[1])
    : undefined;
}

export function downloadName(fileName: string, target: string) {
  const base = fileName ? fileName.replace(/\.(srt|vtt)$/i, '') : 'subtitles';
  return `${base}.${target}`;
}
