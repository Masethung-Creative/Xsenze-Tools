/**
 * Download a model file once and keep it in the browser's Cache Storage, so a
 * later visit loads it from the device. Reports bytes as they arrive.
 */

export interface FetchProgress {
  loaded: number;
  total: number;
}

const CACHE = 'xsenze-models';

async function openCache(): Promise<Cache | null> {
  try {
    return await caches.open(CACHE);
  } catch {
    // private windows and some browsers refuse Cache Storage
    return null;
  }
}

export async function fetchCached(
  url: string,
  onProgress?: (progress: FetchProgress) => void,
): Promise<Response> {
  const cache = await openCache();
  const hit = await cache?.match(url);
  if (hit) {
    const size = Number(hit.headers.get('content-length')) || 1;
    onProgress?.({ loaded: size, total: size });
    return hit;
  }

  const response = await fetch(url);
  if (!response.ok || !response.body)
    throw new Error(`download failed: ${response.status} ${url}`);
  const total = Number(response.headers.get('content-length')) || 0;
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    loaded += value.byteLength;
    onProgress?.({ loaded, total: Math.max(total, loaded) });
  }
  const body = new Blob(parts as BlobPart[]);
  const stored = new Response(body, {
    headers: {
      'content-type':
        response.headers.get('content-type') ?? 'application/octet-stream',
      'content-length': String(body.size),
    },
  });
  await cache?.put(url, stored.clone()).catch(() => undefined);
  return stored;
}
