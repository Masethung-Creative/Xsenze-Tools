import type { WaveformPeaks } from 'xsenze-tools/lib/audio';

export interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Columns for an image `width` px wide at `detail` px per column, at least 10. */
export const columnsFor = (width: number, detail: number) =>
  Math.max(10, Math.round(width / detail));

const unit = (sample: number) =>
  Number.isFinite(sample) ? Math.min(1, Math.max(-1, sample)) : 0;

/**
 * Bar rectangles inside a `width` × `height` box. Float audio carries samples past ±1; they
 * clamp so no bar leaves the image.
 */
export function bars(
  peaks: WaveformPeaks,
  width: number,
  height: number,
): Bar[] {
  const columns = Math.min(peaks.min.length, peaks.max.length);
  if (!columns || width <= 0 || height <= 0) return [];
  const mid = height / 2;
  const barWidth = width / columns;
  return Array.from({ length: columns }, (_, column) => {
    const top = mid - unit(peaks.max[column]!) * mid;
    const bottom = mid - unit(peaks.min[column]!) * mid;
    return {
      x: column * barWidth,
      y: top,
      width: Math.max(barWidth, 0.5),
      height: Math.max(1, bottom - top),
    };
  });
}

export function waveformSvg(
  peaks: WaveformPeaks,
  width: number,
  height: number,
  wave: string,
  background: string,
): string {
  const rects = bars(peaks, width, height)
    .map(
      (bar) =>
        `<rect x="${bar.x.toFixed(2)}" y="${bar.y.toFixed(2)}" width="${bar.width.toFixed(2)}" height="${bar.height.toFixed(2)}"/>`,
    )
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="${background}"/>` +
    `<g fill="${wave}">${rects}</g></svg>`
  );
}
