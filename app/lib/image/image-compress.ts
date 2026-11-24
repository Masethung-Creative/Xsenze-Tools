/**
 * Image compression on the device: a worker decodes, resizes and re-encodes
 * with MozJPEG, libwebp, libavif and OxiPNG, compiled to WASM by jSquash.
 */

export type OutFormat = 'jpeg' | 'webp' | 'avif' | 'png';

export const IMAGE_FORMATS: { id: OutFormat; label: string; ext: string }[] = [
  { id: 'jpeg', label: 'JPEG', ext: 'jpg' },
  { id: 'webp', label: 'WebP', ext: 'webp' },
  { id: 'avif', label: 'AVIF', ext: 'avif' },
  { id: 'png', label: 'PNG', ext: 'png' },
];

export const IMAGE_MIME: Record<OutFormat, string> = {
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  png: 'image/png',
};

/** The format a file is in, when we can write it back. */
export function formatOf(file: File): OutFormat | null {
  const type = file.type.toLowerCase();
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (type === 'image/jpeg' || ext === 'jpg' || ext === 'jpeg') return 'jpeg';
  if (type === 'image/png' || ext === 'png') return 'png';
  if (type === 'image/webp' || ext === 'webp') return 'webp';
  if (type === 'image/avif' || ext === 'avif') return 'avif';
  return null;
}

export interface ImageJob {
  id: number;
  file: Blob;
  format: OutFormat;
  /** 0 to 100. */
  quality: number;
  /** The longest side; 0 keeps the size. */
  maxSide: number;
  /** PNG: down to a 256-colour palette. */
  reduceColours: boolean;
  /** Searches quality for the largest file under this; PNG ignores it. */
  targetBytes: number | null;
}

export interface ImageJobReply {
  id: number;
  /** A share of the job, while it runs. */
  progress?: number;
  buffer?: ArrayBuffer;
  width?: number;
  height?: number;
  quality?: number;
  /** Target size: even the lowest quality did not fit. */
  missed?: boolean;
  error?: string;
}

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  missed: boolean;
}

let worker: Worker | null = null;
let nextId = 0;
const pending = new Set<(error: Error) => void>();

function getWorker() {
  worker ??= new Worker(
    new URL('./image-compress.worker.ts', import.meta.url),
    { type: 'module' },
  );
  return worker;
}

/** Stops whatever the worker is doing; the next job starts a fresh one. */
export function stopImageWork() {
  worker?.terminate();
  worker = null;
  const stopped = new DOMException('Stopped', 'AbortError');
  for (const reject of [...pending]) reject(stopped);
}

export function compressImage(
  file: Blob,
  options: Omit<ImageJob, 'id' | 'file'>,
  onProgress?: (share: number) => void,
): Promise<CompressedImage> {
  const id = ++nextId;
  const w = getWorker();
  return new Promise((resolve, reject) => {
    const fail = (error: Error) => {
      done();
      reject(error);
    };
    const done = () => {
      pending.delete(fail);
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
    };
    const onMessage = (event: MessageEvent<ImageJobReply>) => {
      const reply = event.data;
      if (reply.id !== id) return;
      if (reply.progress !== undefined && !reply.buffer && !reply.error) {
        onProgress?.(reply.progress);
        return;
      }
      done();
      if (reply.error || !reply.buffer) {
        reject(new Error(reply.error ?? 'No image'));
        return;
      }
      resolve({
        blob: new Blob([reply.buffer], { type: IMAGE_MIME[options.format] }),
        width: reply.width ?? 0,
        height: reply.height ?? 0,
        quality: reply.quality ?? options.quality,
        missed: reply.missed ?? false,
      });
    };
    const onError = (event: ErrorEvent) => {
      done();
      stopImageWork();
      reject(new Error(event.message || 'Worker failed'));
    };
    pending.add(fail);
    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    w.postMessage({ id, file, ...options } satisfies ImageJob);
  });
}

/** Width and height, or null for a file the browser cannot decode. */
export async function imageSize(
  file: Blob,
): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}
