/**
 * Video Edit's edit, as plain data: the media the user added, the pieces of
 * video that play in order on the main track, the audio items placed on the
 * Music and Voice layers, and each layer's level. Every change makes new
 * arrays, so a history of past edits is all undo needs.
 */

import type { WaveformPeaks } from 'xsenze-tools/lib/audio/audio';

export type MediaKind = 'video' | 'audio' | 'image';

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
  /** A cleaned copy: the clip it was made from, and how hard. */
  cleanOf?: string;
  cleanLevel?: number;
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
  /** Plays this many times faster: 0.25 to 4. */
  speed: number;
  look: Look;
  /** How it comes in from the piece before; it overlaps that piece's end. */
  transition: Transition;
}

export type TransitionKind =
  'none' | 'dissolve' | 'black' | 'white' | 'wipe' | 'slide' | 'circle';

export interface Transition {
  kind: TransitionKind;
  /** Seconds; kept under half of either piece. */
  seconds: number;
}

export const noTransition = (): Transition => ({ kind: 'none', seconds: 1 });

export type Filter =
  | 'none'
  | 'bw'
  | 'sepia'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'vivid'
  | 'fade'
  | 'dramatic';

/** How a piece's picture is drawn. */
export interface Look {
  /** 1 is as recorded; 0 to 2. */
  brightness: number;
  contrast: number;
  saturation: number;
  filter: Filter;
  /** Clockwise quarter turns. */
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  /** Shares of the picture cut from each edge, 0 to 0.45. */
  crop: { left: number; right: number; top: number; bottom: number };
}

export const plainLook = (): Look => ({
  brightness: 1,
  contrast: 1,
  saturation: 1,
  filter: 'none',
  rotate: 0,
  flipH: false,
  flipV: false,
  crop: { left: 0, right: 0, top: 0, bottom: 0 },
});

/** Seconds a new photo shows for. */
export const photoSeconds = 5;
/** A photo's clip length: its piece can be trimmed out to this. */
export const photoLimit = 3600;

/** What fills the frame around a picture of another shape. */
export interface Background {
  kind: 'black' | 'colour' | 'blur';
  /** #rrggbb, for 'colour'. */
  colour: string;
}

/** The shortest piece a cut or trim leaves, seconds. */
export const minimumPiece = 0.1;

let counter = 0;
export const newId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Timeline seconds a piece lasts: its stretch of clip at its speed. */
export const lengthOf = (piece: Piece) =>
  (piece.out - piece.in) / (piece.speed || 1);

/**
 * Seconds piece `index` overlaps the one before it: its transition, kept
 * under half of either piece so two transitions never meet.
 */
export function overlapOf(pieces: readonly Piece[], index: number): number {
  const piece = pieces[index];
  const before = pieces[index - 1];
  if (!piece || !before) return 0;
  const transition = piece.transition;
  if (!transition || transition.kind === 'none') return 0;
  return Math.max(
    0,
    Math.min(transition.seconds, lengthOf(before) / 2, lengthOf(piece) / 2),
  );
}

/** Timeline seconds where each piece starts; a transition starts it early. */
export function starts(pieces: readonly Piece[]): number[] {
  let at = 0;
  return pieces.map((piece, index) => {
    at -= overlapOf(pieces, index);
    const start = at;
    at += lengthOf(piece);
    return start;
  });
}

export function total(pieces: readonly Piece[]): number {
  const begins = starts(pieces);
  const last = pieces.length - 1;
  return last < 0 ? 0 : begins[last]! + lengthOf(pieces[last]!);
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
    Math.max(piece.in, piece.in + (t - start) * (piece.speed || 1)),
  );
  return { index, piece, start, clipTime };
}

/** What the video track shows at a second: one piece, or two in a transition. */
export interface Showing {
  a: Place;
  /** The piece coming in, during a transition. */
  b: Place | null;
  /** 0 to 1 through the transition. */
  p: number;
  kind: TransitionKind;
}

function placeOf(
  pieces: readonly Piece[],
  begins: readonly number[],
  index: number,
  t: number,
): Place {
  const piece = pieces[index]!;
  const start = begins[index]!;
  const clipTime = Math.min(
    piece.out,
    Math.max(piece.in, piece.in + (t - start) * (piece.speed || 1)),
  );
  return { index, piece, start, clipTime };
}

export function showingAt(pieces: readonly Piece[], t: number): Showing | null {
  if (!pieces.length || t >= total(pieces)) return null;
  const begins = starts(pieces);
  for (let i = 1; i < pieces.length; i++) {
    const overlap = overlapOf(pieces, i);
    const start = begins[i]!;
    if (overlap > 0 && t >= start && t < start + overlap)
      return {
        a: placeOf(pieces, begins, i - 1, t),
        b: placeOf(pieces, begins, i, t),
        p: (t - start) / overlap,
        kind: pieces[i]!.transition.kind,
      };
  }
  const a = placeAt(pieces, t);
  return a ? { a, b: null, p: 0, kind: 'none' } : null;
}

export function pieceFor(clip: Clip): Piece {
  return {
    id: newId('p'),
    clip: clip.id,
    in: 0,
    out: clip.kind === 'image' ? photoSeconds : clip.duration,
    volume: 1,
    muted: false,
    fadeIn: 0,
    fadeOut: 0,
    speed: 1,
    look: plainLook(),
    transition: noTransition(),
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
  const second = {
    ...piece,
    id: newId('p'),
    in: clipTime,
    fadeIn: 0,
    transition: noTransition(),
  };
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
    // what is left before the range, and after it, in clip seconds
    const speed = piece.speed || 1;
    if (start < a)
      kept.push({ ...piece, out: piece.in + (a - start) * speed, fadeOut: 0 });
    if (end > b)
      kept.push({
        ...piece,
        id: start < a ? newId('p') : piece.id,
        in: piece.in + (b - start) * speed,
        fadeIn: 0,
        transition: noTransition(),
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
  /** The music drops under the Voice layer. */
  duck: Duck;
}

export interface Duck {
  on: boolean;
  /** The music's level under a voice, 0 to 1. */
  level: number;
}

export const plainDuck = (): Duck => ({ on: true, level: 0.3 });

/** Seconds the music takes to drop before a voice, and to come back after. */
export const duckRamp = 0.4;

/**
 * How much of its level the music keeps at timeline second `t`: all of it,
 * or `duck.level` while a voice plays, easing down just before and back up
 * just after.
 */
export function duckAt(edit: Edit, t: number): number {
  const duck = edit.mix.duck;
  if (!duck?.on || edit.mix.voice.muted || edit.mix.voice.volume <= 0) return 1;
  let cover = 0;
  for (const item of edit.audio) {
    if (item.lane !== 'voice' || item.muted || item.volume <= 0) continue;
    const a = item.start;
    const b = endOf(item);
    let c = 0;
    if (t >= a && t <= b) c = 1;
    else if (t < a && a - t < duckRamp) c = 1 - (a - t) / duckRamp;
    else if (t > b && t - b < duckRamp) c = 1 - (t - b) / duckRamp;
    if (c > cover) cover = c;
    if (cover >= 1) break;
  }
  return 1 - (1 - Math.max(0, Math.min(1, duck.level))) * cover;
}

/** Whether `length` seconds at `start` are free on an audio layer. */
export function laneFree(
  items: readonly AudioItem[],
  lane: Lane,
  start: number,
  length: number,
): boolean {
  return !items.some(
    (other) =>
      other.lane === lane &&
      start < endOf(other) - 1e-6 &&
      start + length > other.start + 1e-6,
  );
}

export interface Edit {
  pieces: Piece[];
  audio: AudioItem[];
  /** Text and overlays over the picture; later ones are drawn on top. */
  layers: Layer[];
  mix: Mix;
  background: Background;
}

export const emptyEdit = (): Edit => ({
  pieces: [],
  audio: [],
  layers: [],
  mix: {
    video: { volume: 1, muted: false },
    music: { volume: 1, muted: false },
    voice: { volume: 1, muted: false },
    duck: plainDuck(),
  },
  background: { kind: 'black', colour: '#000000' },
});

export const endOf = (item: AudioItem) => item.start + (item.out - item.in);

/** The whole edit's length: the video track, or the last sound or layer if it ends later. */
export function editLength(edit: Edit): number {
  return Math.max(
    total(edit.pieces),
    ...edit.audio.map(endOf),
    ...(edit.layers ?? []).map(layerEnd),
    0,
  );
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

// ----- text and overlay layers -----

export type LayerLane = 'text' | 'overlay';
export const LAYER_LANES: readonly LayerLane[] = ['text', 'overlay'];

export type LayerKind = 'text' | 'picture' | 'video' | 'shape' | 'emoji';
export type Anim =
  'none' | 'fade' | 'slide-up' | 'slide-left' | 'pop' | 'typewriter';
export type FontId = 'sans' | 'display' | 'serif' | 'mono' | 'impact' | 'hand';
export type ShapeKind = 'rect' | 'circle' | 'arrow' | 'star';
export type Align = 'left' | 'center' | 'right';

export interface TextStyle {
  font: FontId;
  /** Letter size as a share of the frame's height. */
  size: number;
  /** #rrggbb */
  colour: string;
  bold: boolean;
  italic: boolean;
  align: Align;
  /** A box behind the text. */
  box: boolean;
  boxColour: string;
  /** 0 to 1. */
  boxOpacity: number;
  /** A dark edge round the letters, so they read on any picture. */
  outline: boolean;
}

/**
 * One item over the picture, placed in time on the Text or Overlay layer:
 * a title, a picture or logo, a small video, a shape or an emoji.
 */
export interface Layer {
  id: string;
  lane: LayerLane;
  kind: LayerKind;
  /** The file, for a picture or a video. */
  clip: string | null;
  /** Timeline seconds. */
  start: number;
  length: number;
  /** Seconds into a video's clip where it starts. */
  in: number;
  /** The middle of the item, as shares of the frame's width and height. */
  x: number;
  y: number;
  /** Width as a share of the frame's width; text sizes by its letters. */
  w: number;
  /** Height as a share of the frame's height, for shapes; others keep their own shape. */
  h: number;
  /** 0 to 1. */
  opacity: number;
  /** Corner rounding as a share of the shorter side, 0 to 0.5. */
  corner: number;
  /** Clockwise turn in degrees, -180 to 180. */
  angle: number;
  animIn: Anim;
  animOut: Anim;
  /** Seconds each animation takes. */
  animSeconds: number;
  text: string;
  style: TextStyle;
  shape: ShapeKind;
  /** A shape's fill, #rrggbb. */
  colour: string;
  emoji: string;
  /** A video's sound: 0 to 2. */
  volume: number;
  muted: boolean;
}

/** Seconds a new text or overlay lasts. */
export const layerSeconds = 4;

export const layerEnd = (layer: Layer) => layer.start + layer.length;

export const plainTextStyle = (): TextStyle => ({
  font: 'display',
  size: 0.08,
  colour: '#ffffff',
  bold: true,
  italic: false,
  align: 'center',
  box: false,
  boxColour: '#000000',
  boxOpacity: 0.6,
  outline: true,
});

function baseLayer(lane: LayerLane, kind: LayerKind, start: number): Layer {
  return {
    id: newId('l'),
    lane,
    kind,
    clip: null,
    start: Math.max(0, start),
    length: layerSeconds,
    in: 0,
    x: 0.5,
    y: 0.5,
    w: 0.3,
    h: 0.2,
    opacity: 1,
    corner: 0,
    angle: 0,
    animIn: 'fade',
    animOut: 'fade',
    animSeconds: 0.5,
    text: '',
    style: plainTextStyle(),
    shape: 'rect',
    colour: '#ff8a00',
    emoji: '',
    volume: 1,
    muted: false,
  };
}

export type TextPreset = 'title' | 'subtitle' | 'caption' | 'lower';

/** A new title, styled for what it is for. */
export function textLayer(preset: TextPreset, start: number): Layer {
  const layer = baseLayer('text', 'text', start);
  const style = plainTextStyle();
  switch (preset) {
    case 'title':
      return { ...layer, text: 'Your title', style: { ...style, size: 0.11 } };
    case 'subtitle':
      return {
        ...layer,
        text: 'A line under the title',
        y: 0.62,
        style: { ...style, size: 0.055, bold: false, font: 'sans' },
      };
    case 'caption':
      return {
        ...layer,
        text: 'Caption',
        y: 0.86,
        animIn: 'none',
        animOut: 'none',
        style: {
          ...style,
          size: 0.05,
          font: 'sans',
          bold: false,
          box: true,
          outline: false,
        },
      };
    case 'lower':
      return {
        ...layer,
        text: 'Name Surname\nWhat they do',
        x: 0.28,
        y: 0.8,
        animIn: 'slide-left',
        style: {
          ...style,
          size: 0.045,
          font: 'sans',
          align: 'left',
          box: true,
          boxColour: '#111111',
          boxOpacity: 0.8,
          outline: false,
        },
      };
  }
}

/** A picture, logo or small video over the picture: a logo top right, a video bottom right. */
export function mediaLayer(clip: Clip, start: number): Layer {
  const video = clip.kind === 'video';
  const layer = baseLayer('overlay', video ? 'video' : 'picture', start);
  return {
    ...layer,
    clip: clip.id,
    length: video ? Math.max(minimumPiece, clip.duration) : layerSeconds,
    w: video ? 0.32 : 0.18,
    x: video ? 0.79 : 0.86,
    y: video ? 0.76 : 0.14,
    animIn: video ? 'pop' : 'fade',
    corner: video ? 0.08 : 0,
  };
}

export function shapeLayer(shape: ShapeKind, start: number): Layer {
  const layer = baseLayer('overlay', 'shape', start);
  return {
    ...layer,
    shape,
    w: shape === 'arrow' ? 0.2 : 0.18,
    h: shape === 'arrow' ? 0.14 : 0.3,
    opacity: shape === 'rect' ? 0.85 : 1,
    corner: shape === 'rect' ? 0.15 : 0,
    animIn: 'pop',
  };
}

export function emojiLayer(emoji: string, start: number): Layer {
  return {
    ...baseLayer('overlay', 'emoji', start),
    emoji,
    w: 0.12,
    animIn: 'pop',
  };
}

/** The layers showing at timeline second `t`, in drawing order: overlays, then text. */
export function layersAt(layers: readonly Layer[], t: number): Layer[] {
  const on = layers.filter((l) => t >= l.start && t < layerEnd(l));
  return [
    ...on.filter((l) => l.lane === 'overlay'),
    ...on.filter((l) => l.lane === 'text'),
  ];
}

export function updateLayer(
  layers: readonly Layer[],
  id: string,
  change: Partial<Omit<Layer, 'id'>>,
): Layer[] {
  return layers.map((layer) =>
    layer.id === id ? { ...layer, ...change } : layer,
  );
}

export function moveLayer(
  layers: readonly Layer[],
  id: string,
  start: number,
): Layer[] {
  return updateLayer(layers, id, { start: Math.max(0, start) });
}

/**
 * New timeline start and end for a layer. A video's first frame moves with
 * its start, and it cannot run past its clip.
 */
export function trimLayer(
  layers: readonly Layer[],
  id: string,
  start: number,
  end: number,
  clipDuration: number | null,
): Layer[] {
  return layers.map((layer) => {
    if (layer.id !== id) return layer;
    const startMoved = Math.abs(start - layer.start) > 1e-9;
    let a = Math.max(0, start);
    let b = Math.max(0, end);
    let inPoint = layer.in;
    if (layer.kind === 'video' && clipDuration !== null) {
      inPoint = layer.in + (a - layer.start);
      if (inPoint < 0) {
        a -= inPoint;
        inPoint = 0;
      }
      b = Math.min(b, a + (clipDuration - inPoint));
    }
    if (b - a < minimumPiece) {
      // the edge that moved gives way
      if (startMoved) {
        const shift = b - minimumPiece - a;
        a += shift;
        inPoint += shift;
      } else b = a + minimumPiece;
    }
    return { ...layer, start: a, length: b - a, in: Math.max(0, inPoint) };
  });
}

/** Cuts a layer in two at timeline second `t`. */
export function splitLayer(
  layers: readonly Layer[],
  id: string,
  t: number,
): Layer[] {
  const index = layers.findIndex((layer) => layer.id === id);
  const layer = layers[index];
  if (!layer) return [...layers];
  const local = t - layer.start;
  if (local < minimumPiece || layer.length - local < minimumPiece)
    return [...layers];
  return [
    ...layers.slice(0, index),
    { ...layer, length: local, animOut: 'none' },
    {
      ...layer,
      id: newId('l'),
      start: t,
      length: layer.length - local,
      in: layer.in + local,
      animIn: 'none',
    },
    ...layers.slice(index + 1),
  ];
}

/** Removes timeline seconds `from` to `to` from the layers, as cutRangeAudio does. */
export function cutRangeLayers(
  layers: readonly Layer[],
  from: number,
  to: number,
): Layer[] {
  const [a, b] = from <= to ? [from, to] : [to, from];
  const gap = b - a;
  if (gap <= 0) return [...layers];
  const kept: Layer[] = [];
  for (const layer of layers) {
    const end = layerEnd(layer);
    if (end <= a) kept.push(layer);
    else if (layer.start >= b)
      kept.push({ ...layer, start: layer.start - gap });
    else {
      // what is left before and after the range joins up as one
      const before = Math.max(0, a - layer.start);
      const after = Math.max(0, end - b);
      if (before + after >= minimumPiece / 2)
        kept.push({
          ...layer,
          start: Math.min(layer.start, a),
          length: before + after,
          // a video loses its middle: it starts where what is left starts
          in: before > 0 ? layer.in : layer.in + (b - layer.start),
        });
    }
  }
  return kept;
}

/** A copy of a layer right after it, on top. */
export function duplicateLayer(layers: readonly Layer[], id: string): Layer[] {
  const layer = layers.find((l) => l.id === id);
  if (!layer) return [...layers];
  return [...layers, { ...layer, id: newId('l'), start: layerEnd(layer) }];
}

/** Moves a layer up (drawn over others) or down the drawing order. */
export function restack(
  layers: readonly Layer[],
  id: string,
  by: number,
): Layer[] {
  const from = layers.findIndex((l) => l.id === id);
  if (from < 0) return [...layers];
  const to = Math.min(layers.length - 1, Math.max(0, from + by));
  const rest = layers.filter((l) => l.id !== id);
  rest.splice(to, 0, layers[from]!);
  return rest;
}

/**
 * Rows for one lane's layers, so overlapping ones sit one above another:
 * each goes in the first row that is free at its start.
 */
export function layerRows(
  layers: readonly Layer[],
  lane: LayerLane,
): { rows: Map<string, number>; count: number } {
  const ends: number[] = [];
  const rows = new Map<string, number>();
  const sorted = layers
    .filter((l) => l.lane === lane)
    .sort((x, y) => x.start - y.start);
  for (const layer of sorted) {
    let row = ends.findIndex((end) => end <= layer.start + 1e-9);
    if (row < 0) row = ends.length;
    ends[row] = layerEnd(layer);
    rows.set(layer.id, row);
  }
  return { rows, count: Math.max(1, ends.length) };
}
