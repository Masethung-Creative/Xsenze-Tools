/**
 * The in and out animations of Video Edit's titles, overlays and clips: how
 * far through one is, and what it does to the item at that moment (its
 * opacity, place, size, blur, and how much of it a wipe has revealed). The
 * preview and the export both draw through here.
 */
import type { Context2D } from 'xsenze-tools/lib/video/edit/draw';
import type { Anim } from 'xsenze-tools/lib/video/edit/timeline';

/** The animations, in the order the picker shows them. */
export const ANIMS: Record<Anim, string> = {
  none: 'None',
  fade: 'Fade',
  blur: 'Blur',
  'zoom-in': 'Zoom in',
  'zoom-out': 'Zoom out',
  'slide-fade': 'Slide fade',
  'soft-reveal': 'Soft reveal',
  circle: 'Circle',
  'slide-up': 'Slide up',
  'slide-left': 'Slide in',
  pop: 'Pop',
  typewriter: 'Typewriter',
};

export const ANIM_IDS = Object.keys(ANIMS) as Anim[];

/** What the animations do to an item at one moment. */
export interface Motion {
  alpha: number;
  /** Pixels it is moved by. */
  dx: number;
  dy: number;
  scale: number;
  /** Blur in pixels. */
  blur: number;
  /** Share of the letters typed so far. */
  typed: number;
  /** A wipe part-way: how much of the item shows, 0 to 1. */
  reveal: { kind: 'soft' | 'circle'; p: number } | null;
}

export const stillMotion = (): Motion => ({
  alpha: 1,
  dx: 0,
  dy: 0,
  scale: 1,
  blur: 0,
  typed: 1,
  reveal: null,
});

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (x: number) => 1 - (1 - x) ** 3;
/** Past 1 a little, then back: a pop. */
const backOut = (x: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};

/**
 * One animation, `k` of the way to fully shown (1). Coming in it arrives;
 * going out it leaves the way it is heading: a slide carries on, a zoom in
 * keeps growing.
 */
function apply(
  m: Motion,
  anim: Anim,
  k: number,
  coming: boolean,
  W: number,
  H: number,
) {
  if (anim === 'none' || k >= 1) return;
  const e = easeOut(k);
  const away = coming ? 1 : -1;
  switch (anim) {
    case 'fade':
      m.alpha *= e;
      break;
    case 'blur':
      m.blur += (1 - e) * 0.03 * Math.min(W, H);
      m.alpha *= Math.min(1, e * 1.5);
      break;
    case 'zoom-in':
      // small to full; leaving, on to large
      m.scale *= coming ? 0.5 + 0.5 * e : 1 + 0.5 * (1 - e);
      m.alpha *= e;
      break;
    case 'zoom-out':
      // large to full; leaving, on to small
      m.scale *= coming ? 1 + 0.5 * (1 - e) : 0.5 + 0.5 * e;
      m.alpha *= e;
      break;
    case 'slide-fade':
      // a short way from the left, onwards to the right
      m.dx -= away * (1 - e) * 0.04 * W;
      m.alpha *= e;
      break;
    case 'soft-reveal':
      m.reveal = { kind: 'soft', p: e };
      break;
    case 'circle':
      m.reveal = { kind: 'circle', p: e };
      break;
    case 'slide-up':
      // comes up from below, goes on up
      m.dy += away * (1 - e) * 0.06 * H;
      m.alpha *= e;
      break;
    case 'slide-left':
      // comes in from the right, goes on to the left
      m.dx += away * (1 - e) * 0.08 * W;
      m.alpha *= e;
      break;
    case 'pop':
      m.scale *= coming ? 0.4 + 0.6 * backOut(k) : 0.5 + 0.5 * e;
      m.alpha *= coming ? Math.min(1, k * 3) : e;
      break;
    case 'typewriter':
      if (coming) m.typed = k;
      else m.alpha *= e;
      break;
  }
}

/** An item's in and out animations at `local` seconds into its `length`. */
export function motionOf(
  animIn: Anim,
  animOut: Anim,
  seconds: number,
  local: number,
  length: number,
  W: number,
  H: number,
): Motion {
  const m = stillMotion();
  const d = Math.max(0, Math.min(seconds, length / 2));
  if (d <= 0) return m;
  apply(m, animIn, clamp01(local / d), true, W, H);
  apply(m, animOut, clamp01((length - local) / d), false, W, H);
  return m;
}

export const isStill = (m: Motion) =>
  m.alpha >= 1 && !m.dx && !m.dy && m.scale === 1 && m.blur < 0.2 && !m.reveal;

let maskCanvas: OffscreenCanvas | null = null;

/**
 * Draws `source` (a whole frame-sized drawing of the item) onto `ctx`, only
 * as much of it as a wipe has revealed over the box the item fills.
 */
export function drawRevealed(
  ctx: Context2D,
  source: OffscreenCanvas,
  reveal: NonNullable<Motion['reveal']>,
  box: { x: number; y: number; w: number; h: number },
) {
  const { width: W, height: H } = source;
  maskCanvas ??= new OffscreenCanvas(W, H);
  if (maskCanvas.width !== W) maskCanvas.width = W;
  if (maskCanvas.height !== H) maskCanvas.height = H;
  const mask = maskCanvas.getContext('2d')!;
  mask.save();
  mask.globalCompositeOperation = 'copy';
  mask.globalAlpha = 1;
  mask.filter = 'none';
  mask.drawImage(source, 0, 0);
  mask.globalCompositeOperation = 'destination-in';
  const p = clamp01(reveal.p);
  if (reveal.kind === 'circle') {
    // from the middle, out past the corners
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const r = (Math.hypot(box.w, box.h) / 2) * p * 1.02;
    const soft = Math.max(1, r * 0.04);
    const g = mask.createRadialGradient(
      cx,
      cy,
      Math.max(0, r - soft),
      cx,
      cy,
      r,
    );
    g.addColorStop(0, '#000');
    g.addColorStop(1, 'rgb(0 0 0 / 0)');
    mask.fillStyle = g;
  } else {
    // a soft diagonal edge from the top left to the bottom right
    const band = 0.35;
    const g = mask.createLinearGradient(
      box.x,
      box.y,
      box.x + box.w,
      box.y + box.h,
    );
    const edge = -band + (1 + band) * p;
    g.addColorStop(0, '#000');
    g.addColorStop(clamp01(edge), '#000');
    g.addColorStop(clamp01(edge + band), 'rgb(0 0 0 / 0)');
    g.addColorStop(1, 'rgb(0 0 0 / 0)');
    mask.fillStyle = p >= 1 ? '#000' : g;
  }
  mask.fillRect(0, 0, W, H);
  mask.restore();
  ctx.drawImage(maskCanvas, 0, 0);
}
