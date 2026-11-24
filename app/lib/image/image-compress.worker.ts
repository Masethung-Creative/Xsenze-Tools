/// <reference lib="webworker" />
// Decodes, resizes and re-encodes one image at a time, off the main thread.
// Codecs: MozJPEG, libwebp, libavif and OxiPNG, compiled to WASM by jSquash;
// palette reduction for PNG by image-q.
import type {
  ImageJob,
  ImageJobReply,
  OutFormat,
} from 'xsenze-tools/lib/image/image-compress';

// target size: quality is searched between these, in this many tries
const LOW = 5;
const HIGH = 95;
const TRIES = 7;
// AVIF at this share of the quality looks like JPEG at the full quality
const AVIF_SCALE = 0.7;

function draw(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  flatten: boolean,
) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  if (flatten) {
    // JPEG has no transparency
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

async function pixels(file: Blob, maxSide: number, flatten: boolean) {
  const bitmap = await createImageBitmap(file);
  const long = Math.max(bitmap.width, bitmap.height);
  const scale = maxSide && long > maxSide ? maxSide / long : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  try {
    const full = draw(bitmap, bitmap.width, bitmap.height, flatten);
    if (scale === 1) return full;
    // Lanczos3 in linear light keeps edges sharp where the canvas blurs
    const { default: resize } = await import('@jsquash/resize');
    return await resize(full, {
      width,
      height,
      method: 'lanczos3',
      fitMethod: 'stretch',
      premultiply: true,
      linearRGB: true,
    });
  } catch {
    // too big for the resizer's memory: the canvas does it
    return draw(bitmap, width, height, flatten);
  } finally {
    bitmap.close();
  }
}

async function reduceColours(image: ImageData): Promise<ImageData> {
  const iq = await import('image-q');
  const points = iq.utils.PointContainer.fromImageData(image);
  const palette = iq.buildPaletteSync([points], {
    colors: 256,
    paletteQuantization: 'wuquant',
    colorDistanceFormula: 'euclidean-bt709',
  });
  const out = iq.applyPaletteSync(points, palette, {
    imageQuantization: 'nearest',
    colorDistanceFormula: 'euclidean-bt709',
  });
  return new ImageData(
    new Uint8ClampedArray(out.toUint8Array()),
    image.width,
    image.height,
  );
}

async function encode(
  image: ImageData,
  format: OutFormat,
  quality: number,
  reduce: boolean,
): Promise<ArrayBuffer> {
  switch (format) {
    case 'jpeg': {
      const { default: enc } = await import('@jsquash/jpeg/encode');
      return enc(image, { quality, progressive: true });
    }
    case 'webp': {
      const { default: enc } = await import('@jsquash/webp/encode');
      return enc(image, { quality, method: 4 });
    }
    case 'avif': {
      const { default: enc } = await import('@jsquash/avif/encode');
      return enc(image, {
        quality: Math.round(quality * AVIF_SCALE),
        speed: 7,
      });
    }
    case 'png': {
      const { default: optimise } = await import('@jsquash/oxipng/optimise');
      const source = reduce ? await reduceColours(image) : image;
      return optimise(source, { level: 2, optimiseAlpha: true });
    }
  }
}

async function run(job: ImageJob): Promise<ImageJobReply> {
  const image = await pixels(job.file, job.maxSide, job.format === 'jpeg');
  const size = { width: image.width, height: image.height };
  const tell = (share: number) =>
    postMessage({ id: job.id, progress: share } satisfies ImageJobReply);

  if (!job.targetBytes || job.format === 'png') {
    const buffer = await encode(
      image,
      job.format,
      job.quality,
      job.reduceColours,
    );
    return { id: job.id, buffer, quality: job.quality, ...size };
  }

  // the highest quality that fits the target
  let low = LOW;
  let high = HIGH;
  let best: { buffer: ArrayBuffer; quality: number } | null = null;
  let smallest: { buffer: ArrayBuffer; quality: number } | null = null;
  for (let i = 0; i < TRIES && low <= high; i++) {
    const quality = Math.round((low + high) / 2);
    const buffer = await encode(image, job.format, quality, false);
    tell((i + 1) / TRIES);
    if (!smallest || buffer.byteLength < smallest.buffer.byteLength)
      smallest = { buffer, quality };
    if (buffer.byteLength <= job.targetBytes) {
      best = { buffer, quality };
      low = quality + 1;
    } else high = quality - 1;
  }
  const pick = best ?? smallest!;
  return {
    id: job.id,
    buffer: pick.buffer,
    quality: pick.quality,
    missed: !best,
    ...size,
  };
}

self.onmessage = async (event: MessageEvent<ImageJob>) => {
  const job = event.data;
  try {
    const reply = await run(job);
    postMessage(reply, [reply.buffer!]);
  } catch (error) {
    postMessage({
      id: job.id,
      error: (error as Error).message || String(error),
    } satisfies ImageJobReply);
  }
};
