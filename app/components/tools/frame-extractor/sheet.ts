import { resolveDuration, seekTo } from 'xsenze-tools/lib/video';
import { formatTimestamp } from 'xsenze-tools/lib/subtitles';

// 4 columns of 320 px thumbs, 22 px label bars
export const sheetColumns = 4;
const thumbWidth = 320;
const labelHeight = 22;

/** The middle of `count` equal spans, which keeps clear of the first and last frame. */
export function sheetTimes(duration: number, count: number): number[] {
  return Array.from(
    { length: Math.max(0, count) },
    (_, index) => (duration * (index + 0.5)) / count,
  );
}

/** Columns and rows of a sheet of `count` thumbs. */
export function sheetGrid(count: number): [number, number] {
  const columns = Math.max(1, Math.min(sheetColumns, count));
  return [columns, Math.ceil(count / columns)];
}

/** A file's name stamp for a time: 00:00:01.500 as 00-00-01-500. */
export const stamp = (label: string) => label.replace(/[:.]/g, '-');

/**
 * A PNG of `count` frames spread over the file, each with its time, read on
 * a video element of its own so the player keeps its place. Null once `live`
 * turns false or the file does not decode.
 */
export async function contactSheet(
  file: Blob,
  count: number,
  live: () => boolean,
  onProgress: (share: number) => void,
): Promise<Blob | null> {
  const video = document.createElement('video');
  video.muted = true;
  video.preload = 'auto';
  video.playsInline = true;
  const source = URL.createObjectURL(file);
  video.src = source;
  try {
    await new Promise<void>((resolve, reject) => {
      video.addEventListener('loadeddata', () => resolve(), {
        once: true,
      });
      video.addEventListener('error', () => reject(new Error('unreadable')), {
        once: true,
      });
    });
    const duration = await resolveDuration(video);
    if (!video.videoWidth || !Number.isFinite(duration)) return null;
    const [columns, rows] = sheetGrid(count);
    const thumbHeight = Math.round(
      (thumbWidth * video.videoHeight) / video.videoWidth,
    );
    const canvas = document.createElement('canvas');
    canvas.width = columns * thumbWidth;
    canvas.height = rows * thumbHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const times = sheetTimes(duration, count);
    for (const [index, time] of times.entries()) {
      await seekTo(video, time);
      if (!live()) return null;
      const x = (index % columns) * thumbWidth;
      const y = Math.floor(index / columns) * thumbHeight;
      context.drawImage(video, x, y, thumbWidth, thumbHeight);
      context.fillStyle = 'rgb(0 0 0 / 60%)';
      context.fillRect(
        x,
        y + thumbHeight - labelHeight,
        thumbWidth,
        labelHeight,
      );
      context.fillStyle = '#fff';
      context.font = '13px ui-monospace, monospace';
      context.textBaseline = 'middle';
      context.fillText(
        formatTimestamp(time * 1000, '.'),
        x + 8,
        y + thumbHeight - labelHeight / 2,
      );
      onProgress((index + 1) / count);
    }
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(source);
    video.removeAttribute('src');
    video.load();
  }
}
