/**
 * Video Edit keeps the edit in this browser, so a refresh or a closed tab
 * loses nothing: the edit and settings as one record, and every file the
 * user added as its own, in IndexedDB. Nothing leaves the device.
 */
import {
  fullLook,
  noTransition,
  plainDuck,
  plainKey,
  type Clip,
  type Edit,
} from 'xsenze-tools/lib/video/edit/timeline';

const NAME = 'xsenze-video-edit';
const FILES = 'files';
const STATE = 'state';
const KEY = 'project';

/** A clip as kept: its facts, not its object URL or thumbnails. */
export type SavedClip = Pick<
  Clip,
  | 'id'
  | 'kind'
  | 'name'
  | 'duration'
  | 'width'
  | 'height'
  | 'fps'
  | 'hasAudio'
  | 'cleanOf'
  | 'cleanLevel'
  | 'reverseOf'
>;

export interface Saved {
  version: 1;
  clips: SavedClip[];
  edit: Edit;
  settings: Record<string, number | boolean | null>;
  savedAt: number;
}

let opening: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined')
    return Promise.reject(new Error('no-indexeddb'));
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(FILES);
      request.result.createObjectStore(STATE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      opening = null;
      reject(request.error ?? new Error('indexeddb'));
    };
  });
  return opening;
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  work: (s: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const request = work(tx.objectStore(store));
        tx.oncomplete = () => resolve(request ? request.result : undefined);
        tx.onerror = () => reject(tx.error ?? new Error('indexeddb'));
        tx.onabort = () => reject(tx.error ?? new Error('indexeddb'));
      }),
  );
}

export const keepClip = (clip: SavedClip) => ({
  id: clip.id,
  kind: clip.kind,
  name: clip.name,
  duration: clip.duration,
  width: clip.width,
  height: clip.height,
  fps: clip.fps,
  hasAudio: clip.hasAudio,
  cleanOf: clip.cleanOf,
  cleanLevel: clip.cleanLevel,
  reverseOf: clip.reverseOf,
});

/** Keeps a file; it rejects when the browser has no room for it. */
export async function saveFile(id: string, file: File): Promise<void> {
  // asks the browser not to clear the files when space runs low
  void navigator.storage?.persist?.().catch(() => false);
  await run(FILES, 'readwrite', (s) => s.put(file, id));
}

export async function dropFile(id: string): Promise<void> {
  await run(FILES, 'readwrite', (s) => s.delete(id)).catch(() => undefined);
}

export async function saveState(saved: Saved): Promise<void> {
  await run(STATE, 'readwrite', (s) => s.put(saved, KEY));
}

/** The kept edit with its files; clips whose file is gone are left out. */
export async function loadProject(): Promise<{
  saved: Saved;
  files: Map<string, File>;
} | null> {
  const saved = await run<Saved>(STATE, 'readonly', (s) => s.get(KEY)).catch(
    () => undefined,
  );
  if (!saved?.clips?.length) return null;
  const files = new Map<string, File>();
  for (const clip of saved.clips) {
    const file = await run<File>(FILES, 'readonly', (s) =>
      s.get(clip.id),
    ).catch(() => undefined);
    if (file) files.set(clip.id, file);
  }
  return { saved: filled(saved, new Set(files.keys())), files };
}

/** A record with the clips whose file is gone left out, and newer fields filled in. */
function filled(saved: Saved, ids: ReadonlySet<string>): Saved {
  const edit = saved.edit;
  return {
    ...saved,
    clips: saved.clips.filter((clip) => ids.has(clip.id)),
    edit: {
      ...edit,
      mix: { ...edit.mix, duck: edit.mix.duck ?? plainDuck() },
      // older records lack the newer fields
      pieces: edit.pieces
        .filter((piece) => ids.has(piece.clip))
        .map((piece) => ({
          ...piece,
          transition: piece.transition ?? noTransition(),
          look: fullLook(piece.look),
          animIn: piece.animIn ?? 'none',
          animOut: piece.animOut ?? 'none',
          animSeconds: piece.animSeconds ?? 0.6,
        })),
      audio: edit.audio.filter((item) => ids.has(item.clip)),
      layers: (edit.layers ?? [])
        .filter((layer) => !layer.clip || ids.has(layer.clip))
        .map((layer) => ({ ...layer, key: layer.key ?? plainKey() })),
    },
  };
}

/** The name a project file's media sit under inside it. */
const mediaPath = (clip: SavedClip) =>
  `media/${clip.id}-${clip.name.replace(/[\\/:*?"<>|]+/g, '_')}`;

/**
 * One file holding the edit, its settings and every file it uses, to move
 * an edit to another device or keep a copy: a zip with project.json and a
 * media folder.
 */
export async function packProject(
  saved: Saved,
  files: ReadonlyMap<string, File>,
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  zip.file(
    'project.json',
    JSON.stringify({ app: 'xsenze-video-edit', ...saved }, null, 1),
  );
  for (const clip of saved.clips) {
    const file = files.get(clip.id);
    // media are already packed: storing them as they are is quicker
    if (file) zip.file(mediaPath(clip), file, { compression: 'STORE' });
  }
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/zip',
    compression: 'DEFLATE',
  });
}

/** Reads a project file back; it rejects when the file is not one. */
export async function unpackProject(file: Blob): Promise<{
  saved: Saved;
  files: Map<string, File>;
}> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(file);
  const text = await zip.file('project.json')?.async('string');
  if (!text) throw new Error('not-a-project');
  const saved = JSON.parse(text) as Saved & { app?: string };
  if (saved.app !== 'xsenze-video-edit' || !Array.isArray(saved.clips))
    throw new Error('not-a-project');
  const files = new Map<string, File>();
  for (const clip of saved.clips) {
    const entry = zip.file(mediaPath(clip));
    if (!entry) continue;
    const blob = await entry.async('blob');
    files.set(clip.id, new File([blob], clip.name, { type: typeOf(clip) }));
  }
  return { saved: filled(saved, new Set(files.keys())), files };
}

/** A media type from a name, so the preview's elements can play the file. */
function typeOf(clip: SavedClip): string {
  const ext = /\.([a-z0-9]+)$/i.exec(clip.name)?.[1]?.toLowerCase() ?? '';
  const known: Record<string, string> = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    opus: 'audio/ogg',
    flac: 'audio/flac',
    aac: 'audio/aac',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    avif: 'image/avif',
  };
  return known[ext] ?? '';
}

/** Forgets the kept edit and every kept file. */
export async function clearProject(): Promise<void> {
  await Promise.all([
    run(STATE, 'readwrite', (s) => s.clear()),
    run(FILES, 'readwrite', (s) => s.clear()),
  ]).catch(() => undefined);
}
