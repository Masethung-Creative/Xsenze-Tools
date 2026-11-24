/**
 * Video Edit's edit, as plain data: the media the user added, the pieces of
 * video that play in order on the main track, the audio items placed on the
 * Music and Voice layers, and each layer's level. Every change makes new
 * arrays, so a history of past edits is all undo needs.
 */

import type { WaveformPeaks } from 'xsenze-tools/lib/audio/audio';

export type MediaKind = 'video' | 'audio';

/** A file the user added: a video or a sound. */
export interface Clip {
  id: string;
  kind: MediaKind;
  file: File;
  name: string;
  /** Seconds. */
  duration: number;
  width: number;
  height: number;
  /** Frames a second; 30 when unknown. */
  fps: number;
  hasAudio: boolean;
  /** Object URL of the file, for the preview. */
  url: string;
  /** Thumbnails spread evenly over the whole clip. */
  frames: string[];
  /** The sound as waveform peaks over the whole clip; null before or without. */
  peaks: WaveformPeaks | null;
}

/** A stretch of one clip on the timeline. */
export interface Piece {
  id: string;
  clip: string;
  /** Seconds into the clip. */
  in: number;
  out: number;
  /** 1 is as recorded; 0 to 2. */
  volume: number;
  muted: boolean;
  /** Seconds the start fades in from black and silence, and the end out. */
  fadeIn: number;
  fadeOut: number;
}

/** The shortest piece a cut or trim leaves, seconds. */
export const minimumPiece = 0.1;

let counter = 0;
export const newId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

export const lengthOf = (piece: Piece) => piece.out - piece.in;

export function total(pieces: readonly Piece[]): number {
  return pieces.reduce((sum, piece) => sum + lengthOf(piece), 0);
}

/** Timeline seconds where each piece starts. */
export function starts(pieces: readonly Piece[]): number[] {
  let at = 0;
  return pieces.map((piece) => {
    const start = at;
    at += lengthOf(piece);
    return start;
  });
}

export interface Place {
  index: number;
  piece: Piece;
  /** Timeline seconds where the piece starts. */
  start: number;
  /** Seconds into the clip. */
  clipTime: number;
}

/**
 * The piece playing at timeline second `t`. A time on a join belongs to the
 * piece after it; the very end belongs to the last piece.
 */
export function placeAt(pieces: readonly Piece[], t: number): Place | null {
  if (!pieces.length) return null;
  const begins = starts(pieces);
  let index = pieces.length - 1;
  for (let i = 0; i < pieces.length; i++) {
    if (t < begins[i]! + lengthOf(pieces[i]!)) {
      index = i;
      break;
    }
  }
  const piece = pieces[index]!;
  const start = begins[index]!;
  const clipTime = Math.min(
    piece.out,
    Math.max(piece.in, piece.in + (t - start)),
  );
  return { index, piece, start, clipTime };
}

export function pieceFor(clip: Clip): Piece {
  return {
    id: newId('p'),
    clip: clip.id,
    in: 0,
    out: clip.duration,
    volume: 1,
    muted: false,
    fadeIn: 0,
    fadeOut: 0,
  };
}

/** Cuts the piece under `t` in two; a cut too near an edge changes nothing. */
export function split(pieces: readonly Piece[], t: number): Piece[] {
  const place = placeAt(pieces, t);
  if (!place) return [...pieces];
  const { index, piece, clipTime } = place;
  if (clipTime - piece.in < minimumPiece || piece.out - clipTime < minimumPiece)
    return [...pieces];
  const first = { ...piece, out: clipTime, fadeOut: 0 };
  const second = { ...piece, id: newId('p'), in: clipTime, fadeIn: 0 };
  return [...pieces.slice(0, index), first, second, ...pieces.slice(index + 1)];
}

/** Removes timeline seconds `from` to `to`; the pieces after close up. */
export function cutRange(
  pieces: readonly Piece[],
  from: number,
  to: number,
): Piece[] {
  const [a, b] = from <= to ? [from, to] : [to, from];
  if (b - a <= 0) return [...pieces];
  const begins = starts(pieces);
  const kept: Piece[] = [];
  pieces.forEach((piece, i) => {
    const start = begins[i]!;
    const end = start + lengthOf(piece);
    if (end <= a || start >= b) {
      kept.push(piece);
      return;
    }
    // what is left before the range, and after it
    if (start < a) kept.push({ ...piece, out: piece.in + (a - start) });
    if (end > b)
      kept.push({
        ...piece,
        id: start < a ? newId('p') : piece.id,
        in: piece.in + (b - start),
      });
  });
  return kept.filter((piece) => lengthOf(piece) >= minimumPiece / 2);
}

export function remove(pieces: readonly Piece[], id: string): Piece[] {
  return pieces.filter((piece) => piece.id !== id);
}

/** Moves a piece to `index` in the new order. */
export function move(
  pieces: readonly Piece[],
  id: string,
  index: number,
): Piece[] {
  const from = pieces.findIndex((piece) => piece.id === id);
  if (from < 0) return [...pieces];
  const rest = pieces.filter((piece) => piece.id !== id);
  const to = Math.min(Math.max(index, 0), rest.length);
  rest.splice(to, 0, pieces[from]!);
  return rest;
}

/** New in and out points for a piece, kept inside its clip and apart. */
export function trim(
  pieces: readonly Piece[],
  id: string,
  inPoint: number,
  outPoint: number,
  clipDuration: number,
): Piece[] {
  return pieces.map((piece) => {
    if (piece.id !== id) return piece;
    let a = Math.min(Math.max(inPoint, 0), clipDuration);
    let b = Math.min(Math.max(outPoint, 0), clipDuration);
    if (b - a < minimumPiece) {
      // the edge that moved gives way
      if (a !== piece.in) a = Math.max(0, b - minimumPiece);
      else b = Math.min(clipDuration, a + minimumPiece);
    }
    return { ...piece, in: a, out: b };
  });
}

/** A copy of the piece right after it. */
export function duplicate(pieces: readonly Piece[], id: string): Piece[] {
  const index = pieces.findIndex((piece) => piece.id === id);
  if (index < 0) return [...pieces];
  const copy = { ...pieces[index]!, id: newId('p') };
  return [...pieces.slice(0, index + 1), copy, ...pieces.slice(index + 1)];
}

export function update(
  pieces: readonly Piece[],
  id: string,
  change: Partial<Omit<Piece, 'id' | 'clip'>>,
): Piece[] {
  return pieces.map((piece) =>
    piece.id === id ? { ...piece, ...change } : piece,
  );
}

/** Undo and redo over whole piece lists. */
export class History<T> {
  #past: T[] = [];
  #future: T[] = [];
  readonly limit: number;

  constructor(limit = 200) {
    this.limit = limit;
  }

  get canUndo() {
    return this.#past.length > 0;
  }

  get canRedo() {
    return this.#future.length > 0;
  }

  /** Keeps `current` before it is replaced. */
  record(current: T) {
    this.#past.push(current);
    if (this.#past.length > this.limit) this.#past.shift();
    this.#future = [];
  }

  undo(current: T): T | undefined {
    const previous = this.#past.pop();
    if (previous !== undefined) this.#future.push(current);
    return previous;
  }

  redo(current: T): T | undefined {
    const next = this.#future.pop();
    if (next !== undefined) this.#past.push(current);
    return next;
  }

  clear() {
    this.#past = [];
    this.#future = [];
  }
}

// ----- audio layers -----

export type Lane = 'music' | 'voice';
export const LANES: readonly Lane[] = ['music', 'voice'];

/** A stretch of a sound placed at a time on an audio layer. */
export interface AudioItem {
  id: string;
  clip: string;
  lane: Lane;
  /** Timeline seconds where it starts. */
  start: number;
  in: number;
  out: number;
  volume: number;
  muted: boolean;
  fadeIn: number;
  fadeOut: number;
}

export interface Level {
  /** 0 to 2. */
  volume: number;
  muted: boolean;
}

/** One level for each layer's sound. */
export interface Mix {
  video: Level;
  music: Level;
  voice: Level;
}

export interface Edit {
  pieces: Piece[];
  audio: AudioItem[];
  mix: Mix;
}

export const emptyEdit = (): Edit => ({
  pieces: [],
  audio: [],
  mix: {
    video: { volume: 1, muted: false },
    music: { volume: 1, muted: false },
    voice: { volume: 1, muted: false },
  },
});

export const endOf = (item: AudioItem) => item.start + (item.out - item.in);

/** The whole edit's length: the video track or the last sound, whichever ends later. */
export function editLength(edit: Edit): number {
  return Math.max(total(edit.pieces), ...edit.audio.map(endOf), 0);
}

/** The volume a stretch with fades has at local second `t` of `length`. */
export function fadeAt(
  t: number,
  length: number,
  fadeIn: number,
  fadeOut: number,
): number {
  let gain = 1;
  if (fadeIn > 0 && t < fadeIn) gain = Math.min(gain, Math.max(0, t / fadeIn));
  if (fadeOut > 0 && t > length - fadeOut)
    gain = Math.min(gain, Math.max(0, (length - t) / fadeOut));
  return gain;
}

/**
 * Puts an item at `start` on its layer without covering another: it moves
 * right past any item it would overlap.
 */
export function settle(
  items: readonly AudioItem[],
  item: AudioItem,
): AudioItem {
  const others = items
    .filter((other) => other.id !== item.id && other.lane === item.lane)
    .sort((a, b) => a.start - b.start);
  let start = Math.max(0, item.start);
  const length = item.out - item.in;
  for (const other of others) {
    if (start < endOf(other) && start + length > other.start)
      start = endOf(other);
  }
  return { ...item, start };
}

export function audioFor(
  clip: Clip,
  lane: Lane,
  start: number,
  items: readonly AudioItem[],
): AudioItem {
  return settle(items, {
    id: newId('a'),
    clip: clip.id,
    lane,
    start,
    in: 0,
    out: clip.duration,
    volume: 1,
    muted: false,
    fadeIn: 0,
    fadeOut: 0,
  });
}

/** Where a new sound goes on a layer: after the last one there. */
export function laneEnd(items: readonly AudioItem[], lane: Lane): number {
  return Math.max(0, ...items.filter((i) => i.lane === lane).map(endOf));
}

export function moveAudio(
  items: readonly AudioItem[],
  id: string,
  start: number,
  lane?: Lane,
): AudioItem[] {
  return items.map((item) =>
    item.id === id
      ? settle(items, {
          ...item,
          start: Math.max(0, start),
          lane: lane ?? item.lane,
        })
      : item,
  );
}

/** New in and out points; moving the in point moves the start with it. */
export function trimAudio(
  items: readonly AudioItem[],
  id: string,
  inPoint: number,
  outPoint: number,
  clipDuration: number,
): AudioItem[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    let a = Math.min(Math.max(inPoint, 0), clipDuration);
    let b = Math.min(Math.max(outPoint, 0), clipDuration);
    if (b - a < minimumPiece) {
      if (a !== item.in) a = Math.max(0, b - minimumPiece);
      else b = Math.min(clipDuration, a + minimumPiece);
    }
    // the in point cannot pull the start below zero
    const shift = Math.max(a - item.in, -item.start);
    a = item.in + shift;
    return { ...item, in: a, out: b, start: item.start + shift };
  });
}

/** Cuts the item in two at timeline second `t`. */
export function splitAudio(
  items: readonly AudioItem[],
  id: string,
  t: number,
): AudioItem[] {
  const index = items.findIndex((item) => item.id === id);
  const item = items[index];
  if (!item) return [...items];
  const local = t - item.start;
  if (local < minimumPiece || item.out - item.in - local < minimumPiece)
    return [...items];
  const at = item.in + local;
  return [
    ...items.slice(0, index),
    { ...item, out: at, fadeOut: 0 },
    { ...item, id: newId('a'), in: at, start: t, fadeIn: 0 },
    ...items.slice(index + 1),
  ];
}

/**
 * Removes timeline seconds `from` to `to` from the audio layers as the
 * video track loses them: what lies inside goes, what comes after moves up.
 */
export function cutRangeAudio(
  items: readonly AudioItem[],
  from: number,
  to: number,
): AudioItem[] {
  const [a, b] = from <= to ? [from, to] : [to, from];
  const gap = b - a;
  if (gap <= 0) return [...items];
  const kept: AudioItem[] = [];
  for (const item of items) {
    const end = endOf(item);
    if (end <= a) kept.push(item);
    else if (item.start >= b) kept.push({ ...item, start: item.start - gap });
    else {
      if (item.start < a)
        kept.push({ ...item, out: item.in + (a - item.start), fadeOut: 0 });
      if (end > b)
        kept.push({
          ...item,
          id: item.start < a ? newId('a') : item.id,
          in: item.in + (b - item.start),
          start: a,
          fadeIn: 0,
        });
    }
  }
  return kept.filter((item) => item.out - item.in >= minimumPiece / 2);
}

export function updateAudio(
  items: readonly AudioItem[],
  id: string,
  change: Partial<Omit<AudioItem, 'id' | 'clip'>>,
): AudioItem[] {
  return items.map((item) => (item.id === id ? { ...item, ...change } : item));
}
