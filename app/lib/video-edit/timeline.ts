/**
 * Video Edit's edit, as plain data: the clips the user added and the pieces
 * of them that play, in order. Every change makes new arrays, so a history
 * of past piece lists is all undo needs.
 */

export interface Clip {
  id: string;
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
  };
}

/** Cuts the piece under `t` in two; a cut too near an edge changes nothing. */
export function split(pieces: readonly Piece[], t: number): Piece[] {
  const place = placeAt(pieces, t);
  if (!place) return [...pieces];
  const { index, piece, clipTime } = place;
  if (clipTime - piece.in < minimumPiece || piece.out - clipTime < minimumPiece)
    return [...pieces];
  const first = { ...piece, out: clipTime };
  const second = { ...piece, id: newId('p'), in: clipTime };
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
