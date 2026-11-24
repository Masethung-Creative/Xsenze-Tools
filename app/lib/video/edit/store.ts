/**
 * Video Edit keeps the edit in this browser, so a refresh or a closed tab
 * loses nothing: the edit and settings as one record, and every file the
 * user added as its own, in IndexedDB. Nothing leaves the device.
 */
import {
  noTransition,
  plainDuck,
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
  const ids = new Set(files.keys());
  const edit = saved.edit;
  return {
    saved: {
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
          })),
        audio: edit.audio.filter((item) => ids.has(item.clip)),
        layers: (edit.layers ?? []).filter(
          (layer) => !layer.clip || ids.has(layer.clip),
        ),
      },
    },
    files,
  };
}

/** Forgets the kept edit and every kept file. */
export async function clearProject(): Promise<void> {
  await Promise.all([
    run(STATE, 'readwrite', (s) => s.clear()),
    run(FILES, 'readwrite', (s) => s.clear()),
  ]).catch(() => undefined);
}
