import { seekTo, resolveDuration } from 'xsenze-tools/lib/video';
import {
  audioContext,
  channelsOf,
  extractPeaks,
  type WaveformPeaks,
} from 'xsenze-tools/lib/audio';

/** Thumbnails per file; a filmstrip shows as many as fit. */
export const thumbnailCount = 24;
/** Waveform columns per file. */
export const peakBuckets = 800;
const thumbnailHeight = 90;

/**
 * Evenly spread frames of a video as object URLs, on a video element of its
 * own so the player keeps its place. Stops early once `live` turns false.
 */
export async function thumbnails(
  file: Blob,
  live: () => boolean,
  count = thumbnailCount,
): Promise<string[]> {
  const video = document.createElement('video');
  video.muted = true;
  video.preload = 'auto';
  video.playsInline = true;
  const source = URL.createObjectURL(file);
  video.src = source;
  const urls: string[] = [];
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
    if (!video.videoWidth || !Number.isFinite(duration)) return [];
    const canvas = document.createElement('canvas');
    canvas.height = thumbnailHeight;
    canvas.width = Math.round(
      (thumbnailHeight * video.videoWidth) / video.videoHeight,
    );
    const context = canvas.getContext('2d')!;
    for (let index = 0; index < count && live(); index++) {
      await seekTo(video, ((index + 0.5) / count) * duration);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.7),
      );
      if (blob) urls.push(URL.createObjectURL(blob));
    }
  } catch {
    // no frames: the strip stays plain
  } finally {
    URL.revokeObjectURL(source);
    video.removeAttribute('src');
    video.load();
  }
  if (!live()) {
    release(urls);
    return [];
  }
  return urls;
}

export function release(urls: string[]) {
  for (const url of urls) URL.revokeObjectURL(url);
}

/** The audio of a file as waveform peaks; null when it has none the browser decodes. */
export async function peaks(
  file: Blob,
  buckets = peakBuckets,
): Promise<WaveformPeaks | null> {
  try {
    const buffer = await audioContext().decodeAudioData(
      await file.arrayBuffer(),
    );
    return extractPeaks(channelsOf(buffer), buckets);
  } catch {
    return null;
  }
}

/** Indices of `total` thumbnails, evenly spread, for `count` cells. */
export function spread(count: number, total: number): number[] {
  if (count <= 0 || total <= 0) return [];
  return Array.from({ length: count }, (_, index) =>
    Math.min(total - 1, Math.floor(((index + 0.5) / count) * total)),
  );
}
