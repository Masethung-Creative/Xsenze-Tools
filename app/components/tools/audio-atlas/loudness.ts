import type { CanonTile } from 'delphicanon/components/canon-tiles';

/** Decibels a level bar covers, up to full scale. */
const levelFloor = -60;

export function levelShare(decibels: number): number {
  return Math.min(1, Math.max(0, 1 - decibels / levelFloor));
}

/** Root mean square over every channel, in dBFS; silence is -Infinity. */
export function rmsDb(channels: Float32Array[]): number {
  let sum = 0;
  let count = 0;
  for (const channel of channels) {
    for (const v of channel) sum += v * v;
    count += channel.length;
  }
  const rms = count ? Math.sqrt(sum / count) : 0;
  return rms === 0 ? -Infinity : 20 * Math.log10(rms);
}

const dbfs = (value: number) =>
  value === -Infinity ? '-∞ dBFS' : `${value.toFixed(1)} dBFS`;

/**
 * The Loudness tiles: Peak, RMS and
 * the integrated loudness, each over a level bar. `lufs` null is still
 * measuring, NaN is too short to gate.
 */
export function loudnessTiles(
  peak: number,
  rms: number,
  lufs: number | null,
): CanonTile[] {
  const tiles: CanonTile[] = [
    { label: 'Peak', value: dbfs(peak), level: levelShare(peak) },
    { label: 'RMS', value: dbfs(rms), level: levelShare(rms) },
  ];
  if (lufs === null) tiles.push({ label: 'Loudness', value: '…' });
  else if (Number.isNaN(lufs)) tiles.push({ label: 'Loudness', value: '—' });
  else
    tiles.push({
      label: 'Loudness',
      value: `${lufs.toFixed(1)} LUFS`,
      level: levelShare(lufs),
    });
  return tiles;
}
