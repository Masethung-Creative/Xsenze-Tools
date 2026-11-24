/**
 * Draws one picture of an edit into a frame: crop, rotation, flips, colour
 * adjustments and filter, fit or fill, the background around it, and a fade.
 * The preview and the export both draw through here, so they look the same.
 */
import type {
  Background,
  Filter,
  Look,
  Motion,
  TransitionKind,
} from 'xsenze-tools/lib/video/edit/timeline';

export type Fit = 'contain' | 'cover';
export type Context2D =
  CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** A picture to draw, in its stored orientation. */
export interface Picture {
  source: CanvasImageSource;
  width: number;
  height: number;
  /** Clockwise turn the file asks for (video rotation metadata). */
  rotation?: number;
}

/** Where a picture of `w`×`h` is drawn in a `W`×`H` frame. */
export function fitBox(
  w: number,
  h: number,
  W: number,
  H: number,
  fit: Fit = 'contain',
) {
  const scale =
    fit === 'contain' ? Math.min(W / w, H / h) : Math.max(W / w, H / h);
  const dw = w * scale;
  const dh = h * scale;
  return { x: (W - dw) / 2, y: (H - dh) / 2, w: dw, h: dh };
}

/** The filter presets, as CSS filter functions. */
export const FILTERS: Record<Filter, { label: string; css: string }> = {
  none: { label: 'None', css: '' },
  bw: { label: 'B&W', css: 'grayscale(1)' },
  sepia: { label: 'Sepia', css: 'sepia(0.8)' },
  warm: { label: 'Warm', css: 'sepia(0.25) saturate(1.25) hue-rotate(-8deg)' },
  cool: {
    label: 'Cool',
    css: 'saturate(0.9) hue-rotate(12deg) brightness(1.03)',
  },
  vintage: {
    label: 'Vintage',
    css: 'sepia(0.45) contrast(0.9) brightness(1.05) saturate(0.8)',
  },
  vivid: { label: 'Vivid', css: 'saturate(1.55) contrast(1.1)' },
  fade: { label: 'Fade', css: 'contrast(0.8) brightness(1.1) saturate(0.7)' },
  dramatic: {
    label: 'Dramatic',
    css: 'contrast(1.4) saturate(0.85) brightness(0.92)',
  },
};

/** The canvas filter for a look; 'none' when it changes nothing. */
export function lookFilter(look: Look, blurPx = 0): string {
  const parts: string[] = [];
  if (blurPx > 0.2) parts.push(`blur(${blurPx.toFixed(1)}px)`);
  if (look.brightness !== 1) parts.push(`brightness(${look.brightness})`);
  if (look.contrast !== 1) parts.push(`contrast(${look.contrast})`);
  if (look.saturation !== 1) parts.push(`saturate(${look.saturation})`);
  const preset = FILTERS[look.filter]?.css;
  if (preset) parts.push(preset);
  return parts.length ? parts.join(' ') : 'none';
}

const turn = (degrees: number) =>
  (((Math.round(degrees / 90) * 90) % 360) + 360) % 360;

/**
 * The part of the stored picture to keep. The crop is given as the viewer
 * sees it (after the turn and flips), so it is turned back first.
 */
function sourceCrop(look: Look, rotation: number) {
  let { left, right, top, bottom } = look.crop;
  if (look.flipH) [left, right] = [right, left];
  if (look.flipV) [top, bottom] = [bottom, top];
  switch (rotation) {
    case 90:
      return { left: top, top: right, right: bottom, bottom: left };
    case 180:
      return { left: right, top: bottom, right: left, bottom: top };
    case 270:
      return { left: bottom, top: left, right: top, bottom: right };
    default:
      return { left, top, right, bottom };
  }
}

/** The picture's size as shown, after its crop and turn. */
export function shownSize(picture: Picture, look: Look) {
  const rotation = turn((picture.rotation ?? 0) + look.rotate);
  const crop = sourceCrop(look, rotation);
  const w = picture.width * Math.max(0.05, 1 - crop.left - crop.right);
  const h = picture.height * Math.max(0.05, 1 - crop.top - crop.bottom);
  return rotation % 180 ? { width: h, height: w } : { width: w, height: h };
}

let blurCanvas: OffscreenCanvas | null = null;

/** The zoom and pan names, as the editor lists them. */
export const MOTIONS: Record<Motion['kind'], string> = {
  none: 'None',
  in: 'Zoom in',
  out: 'Zoom out',
  left: 'Left',
  right: 'Right',
  up: 'Up',
  down: 'Down',
};

/**
 * A box grown and moved for a zoom or pan, `p` of the way through the
 * piece. A pan works on a picture grown by the amount, so no edge shows.
 */
export function movedBox(
  box: { x: number; y: number; w: number; h: number },
  motion: Motion | undefined,
  p: number,
) {
  if (!motion || motion.kind === 'none') return box;
  const a = Math.max(0, Math.min(0.5, motion.amount));
  const t = Math.max(0, Math.min(1, p));
  let scale = 1 + a;
  let dx = 0;
  let dy = 0;
  switch (motion.kind) {
    case 'in':
      scale = 1 + a * t;
      break;
    case 'out':
      scale = 1 + a * (1 - t);
      break;
    case 'left':
      dx = (a / 2) * (1 - 2 * t);
      break;
    case 'right':
      dx = (a / 2) * (2 * t - 1);
      break;
    case 'up':
      dy = (a / 2) * (1 - 2 * t);
      break;
    case 'down':
      dy = (a / 2) * (2 * t - 1);
      break;
  }
  const w = box.w * scale;
  const h = box.h * scale;
  return {
    x: box.x + (box.w - w) / 2 + dx * box.w,
    y: box.y + (box.h - h) / 2 + dy * box.h,
    w,
    h,
  };
}

/** Darker corners over a box. */
function vignette(
  ctx: Context2D,
  box: { x: number; y: number; w: number; h: number },
  strength: number,
) {
  if (strength <= 0.01) return;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const outer = Math.hypot(box.w, box.h) / 2;
  const gradient = ctx.createRadialGradient(
    cx,
    cy,
    outer * (0.75 - 0.45 * strength),
    cx,
    cy,
    outer,
  );
  gradient.addColorStop(0, 'rgb(0 0 0 / 0)');
  gradient.addColorStop(1, `rgb(0 0 0 / ${Math.min(0.95, strength * 0.9)})`);
  ctx.save();
  ctx.filter = 'none';
  ctx.fillStyle = gradient;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();
}

/** Draws the picture's look into a box, turned and flipped about its middle. */
function place(
  ctx: Context2D,
  picture: Picture,
  look: Look,
  box: { x: number; y: number; w: number; h: number },
  filter: string,
) {
  const rotation = turn((picture.rotation ?? 0) + look.rotate);
  const crop = sourceCrop(look, rotation);
  const sx = picture.width * crop.left;
  const sy = picture.height * crop.top;
  const sw = picture.width * Math.max(0.05, 1 - crop.left - crop.right);
  const sh = picture.height * Math.max(0.05, 1 - crop.top - crop.bottom);
  const [bw, bh] = rotation % 180 ? [box.h, box.w] : [box.w, box.h];
  ctx.save();
  ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
  ctx.scale(look.flipH ? -1 : 1, look.flipV ? -1 : 1);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.filter = filter;
  ctx.drawImage(picture.source, sx, sy, sw, sh, -bw / 2, -bh / 2, bw, bh);
  ctx.restore();
}

/**
 * Fills the frame: the background, then the picture with its look, at
 * `alpha` (a fade towards black).
 */
export function drawPicture(
  ctx: Context2D,
  picture: Picture | null,
  look: Look,
  W: number,
  H: number,
  fit: Fit,
  background: Background,
  alpha = 1,
  progress = 0,
) {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  if (!picture || !picture.width || !picture.height) {
    ctx.restore();
    return;
  }
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const shown = shownSize(picture, look);
  const box = fitBox(shown.width, shown.height, W, H, fit);
  const blurPx = (look.blur ?? 0) * Math.min(W, H) * 0.025;
  const filter = lookFilter(look);
  const covers = box.x <= 0.5 && box.y <= 0.5;
  if (!covers && background.kind === 'colour') {
    ctx.fillStyle = background.colour;
    ctx.fillRect(0, 0, W, H);
  } else if (!covers && background.kind === 'blur') {
    // a tiny copy scaled up is a soft blur on every browser, and cheap
    const small = 48;
    blurCanvas ??= new OffscreenCanvas(small, small);
    blurCanvas.width = small;
    blurCanvas.height = Math.max(1, Math.round((small * H) / W));
    const bctx = blurCanvas.getContext('2d')!;
    bctx.globalAlpha = 1;
    place(
      bctx,
      picture,
      look,
      fitBox(
        shown.width,
        shown.height,
        blurCanvas.width,
        blurCanvas.height,
        'cover',
      ),
      filter,
    );
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(blurCanvas, 0, 0, W, H);
    // darker, so the picture stands out
    ctx.fillStyle = 'rgb(0 0 0 / 35%)';
    ctx.fillRect(0, 0, W, H);
  }
  const moving = look.motion && look.motion.kind !== 'none';
  if (moving || blurPx > 0.2) {
    // a zoom stays inside the picture's own box, so bars stay bars
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    // a blur fades at the edges: drawn a little larger, the edge stays filled
    const grow = blurPx * 2;
    const moved = movedBox(box, look.motion, progress);
    place(
      ctx,
      picture,
      look,
      {
        x: moved.x - grow,
        y: moved.y - grow,
        w: moved.w + grow * 2,
        h: moved.h + grow * 2,
      },
      lookFilter(look, blurPx),
    );
    ctx.restore();
  } else {
    place(ctx, picture, look, box, filter);
  }
  vignette(ctx, box, look.vignette ?? 0);
  ctx.restore();
}

// ----- transitions -----

/** One piece's picture as it should look now. */
export interface Shot {
  picture: Picture | null;
  look: Look;
  /** Its fade towards black, 1 for none. */
  fade: number;
  /** 0 to 1 through its piece, for a zoom or pan. */
  progress?: number;
}

/** The transitions, as the editor lists them. */
export const TRANSITIONS: Record<TransitionKind, string> = {
  none: 'None',
  dissolve: 'Dissolve',
  black: 'Through black',
  white: 'Through white',
  wipe: 'Wipe',
  slide: 'Slide',
  circle: 'Circle',
};

const scratch: (OffscreenCanvas | null)[] = [null, null];

function scratchCanvas(slot: 0 | 1, W: number, H: number) {
  let canvas = scratch[slot];
  if (!canvas) canvas = scratch[slot] = new OffscreenCanvas(W, H);
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  return canvas;
}

/** Slow at both ends. */
const smooth = (p: number) => {
  const x = Math.max(0, Math.min(1, p));
  return x * x * (3 - 2 * x);
};

/**
 * Fills the frame with one shot, or with two mid-transition: `a` going out,
 * `b` coming in, `p` of the way through.
 */
export function drawShots(
  ctx: Context2D,
  a: Shot,
  b: Shot | null,
  kind: TransitionKind,
  p: number,
  W: number,
  H: number,
  fit: Fit,
  background: Background,
) {
  if (!b || kind === 'none') {
    const shot = b && p >= 0.5 ? b : a;
    drawPicture(
      ctx,
      shot.picture,
      shot.look,
      W,
      H,
      fit,
      background,
      shot.fade,
      shot.progress,
    );
    return;
  }
  const e = smooth(p);
  const A = scratchCanvas(0, W, H);
  const B = scratchCanvas(1, W, H);
  drawPicture(
    A.getContext('2d')!,
    a.picture,
    a.look,
    W,
    H,
    fit,
    background,
    a.fade,
    a.progress,
  );
  drawPicture(
    B.getContext('2d')!,
    b.picture,
    b.look,
    W,
    H,
    fit,
    background,
    b.fade,
    b.progress,
  );
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  switch (kind) {
    case 'dissolve':
      ctx.drawImage(A, 0, 0);
      ctx.globalAlpha = e;
      ctx.drawImage(B, 0, 0);
      break;
    case 'black':
    case 'white':
      // the first half fades out to the colour, the second fades in from it
      ctx.drawImage(e < 0.5 ? A : B, 0, 0);
      ctx.globalAlpha = e < 0.5 ? e * 2 : (1 - e) * 2;
      ctx.fillStyle = kind === 'black' ? '#000' : '#fff';
      ctx.fillRect(0, 0, W, H);
      break;
    case 'wipe':
      ctx.drawImage(A, 0, 0);
      ctx.beginPath();
      ctx.rect(0, 0, W * e, H);
      ctx.clip();
      ctx.drawImage(B, 0, 0);
      break;
    case 'slide':
      ctx.drawImage(A, -W * e, 0);
      ctx.drawImage(B, W * (1 - e), 0);
      break;
    case 'circle':
      ctx.drawImage(A, 0, 0);
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, (Math.hypot(W, H) / 2) * e, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(B, 0, 0);
      break;
  }
  ctx.restore();
}
