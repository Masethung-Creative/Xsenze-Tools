/**
 * Draws Video Edit's layers over the picture: titles, pictures and logos,
 * small videos, shapes and emoji, each with its place, size, turn, opacity
 * and in and out animations. The preview and the export both draw through
 * here, and the preview's drag box uses the same sizes.
 */
import type { Context2D } from 'xsenze-tools/lib/video/edit/draw';
import { keyed } from 'xsenze-tools/lib/video/edit/chroma';
import type {
  Anim,
  FontId,
  Layer,
  ShapeKind,
} from 'xsenze-tools/lib/video/edit/timeline';

/** The fonts a title can use: the kit's own, then ones every system has. */
export const FONTS: Record<FontId, { label: string; css: string }> = {
  display: {
    label: 'Display',
    css: '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif',
  },
  sans: {
    label: 'Sans',
    css: '"Space Grotesk Variable", "Space Grotesk", system-ui, sans-serif',
  },
  serif: { label: 'Serif', css: 'Georgia, "Times New Roman", serif' },
  mono: {
    label: 'Mono',
    css: '"JetBrains Mono Variable", ui-monospace, monospace',
  },
  impact: {
    label: 'Impact',
    css: 'Impact, "Arial Black", "Helvetica Neue", sans-serif',
  },
  hand: {
    label: 'Hand',
    css: '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
  },
};

export const ANIMS: Record<Anim, string> = {
  none: 'None',
  fade: 'Fade',
  'slide-up': 'Slide up',
  'slide-left': 'Slide in',
  pop: 'Pop',
  typewriter: 'Typewriter',
};

export const SHAPES: Record<ShapeKind, string> = {
  rect: 'Box',
  circle: 'Circle',
  arrow: 'Arrow',
  star: 'Star',
};

export const EMOJI = [
  '😀',
  '😂',
  '😍',
  '🥳',
  '😎',
  '🤔',
  '😮',
  '😢',
  '👍',
  '👏',
  '🙌',
  '👉',
  '👀',
  '🔥',
  '❤️',
  '⭐',
  '✨',
  '🎉',
  '💯',
  '✅',
  '❌',
  '⚡',
  '📍',
  '🎵',
];

const EMOJI_FONT =
  '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

/** The CSS font lists the layers use, so an export can wait for them. */
export function fontsOf(layers: readonly Layer[]): string[] {
  const css = new Set<string>();
  for (const layer of layers) {
    if (layer.kind === 'text') {
      const s = layer.style;
      css.add(
        `${s.italic ? 'italic ' : ''}${s.bold ? 700 : 500} 48px ${FONTS[s.font].css}`,
      );
    }
    if (layer.kind === 'emoji') css.add(`48px ${EMOJI_FONT}`);
  }
  return [...css];
}

// ----- motion -----

interface Motion {
  alpha: number;
  dx: number;
  dy: number;
  scale: number;
  /** Share of the letters typed so far. */
  typed: number;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (x: number) => 1 - (1 - x) ** 3;
/** Past 1 a little, then back: a pop. */
const backOut = (x: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};

/** Seconds one animation takes on a layer: at most half of it. */
export const animLength = (layer: Layer) =>
  Math.max(0, Math.min(layer.animSeconds, layer.length / 2));

/** Where a layer's animations have it at timeline second `t`. */
export function motionAt(
  layer: Layer,
  t: number,
  W: number,
  H: number,
): Motion {
  const m: Motion = { alpha: 1, dx: 0, dy: 0, scale: 1, typed: 1 };
  const d = animLength(layer);
  if (d <= 0) return m;
  const apply = (anim: Anim, k: number, coming: boolean) => {
    if (anim === 'none' || k >= 1) return;
    const e = easeOut(k);
    const away = coming ? 1 : -1;
    switch (anim) {
      case 'fade':
        m.alpha *= e;
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
  };
  apply(layer.animIn, clamp01((t - layer.start) / d), true);
  apply(layer.animOut, clamp01((layer.start + layer.length - t) / d), false);
  return m;
}

// ----- sizes -----

let measurer: OffscreenCanvasRenderingContext2D | null = null;

function measure(): OffscreenCanvasRenderingContext2D {
  measurer ??= new OffscreenCanvas(1, 1).getContext('2d')!;
  return measurer;
}

interface TextBlock {
  font: string;
  px: number;
  lines: string[];
  widths: number[];
  lineHeight: number;
  padX: number;
  padY: number;
  width: number;
  height: number;
}

/** Breaks a paragraph into lines no wider than `max`. */
function wrap(ctx: Context2D, paragraph: string, max: number): string[] {
  const words = paragraph.split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  lines.push(line);
  return lines;
}

function textBlock(layer: Layer, W: number, H: number): TextBlock {
  const s = layer.style;
  const px = Math.max(4, s.size * H);
  const font = `${s.italic ? 'italic ' : ''}${s.bold ? 700 : 500} ${px}px ${FONTS[s.font].css}`;
  const ctx = measure();
  ctx.font = font;
  const padX = s.box ? px * 0.45 : px * 0.1;
  const padY = s.box ? px * 0.25 : px * 0.1;
  const lines = (layer.text || ' ')
    .split('\n')
    .flatMap((p) => wrap(ctx, p, W * 0.92 - padX * 2));
  const widths = lines.map((line) => ctx.measureText(line).width);
  const lineHeight = px * 1.22;
  return {
    font,
    px,
    lines,
    widths,
    lineHeight,
    padX,
    padY,
    width: Math.max(1, ...widths) + padX * 2,
    height: lines.length * lineHeight + padY * 2,
  };
}

/**
 * A layer's size in a `W`×`H` frame, at rest. `aspect` is a picture's or
 * video's own width over height.
 */
export function layerSize(
  layer: Layer,
  W: number,
  H: number,
  aspect = 1,
): { w: number; h: number } {
  switch (layer.kind) {
    case 'text': {
      const block = textBlock(layer, W, H);
      return { w: block.width, h: block.height };
    }
    case 'emoji': {
      const px = layer.w * W;
      return { w: px * 1.15, h: px * 1.15 };
    }
    case 'shape':
      return { w: layer.w * W, h: layer.h * H };
    default: {
      const w = layer.w * W;
      return { w, h: w / (aspect || 1) };
    }
  }
}

/** The box a layer fills at rest, top-left first. */
export function layerBox(layer: Layer, W: number, H: number, aspect = 1) {
  const { w, h } = layerSize(layer, W, H, aspect);
  const cx = layer.x * W;
  const cy = layer.y * H;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

// ----- drawing -----

function roundRect(
  ctx: Context2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawText(
  ctx: Context2D,
  layer: Layer,
  block: TextBlock,
  typed: number,
) {
  const s = layer.style;
  const { width: w, height: h, padX, padY, lineHeight, px } = block;
  if (s.box) {
    ctx.save();
    ctx.globalAlpha *= clamp01(s.boxOpacity);
    ctx.fillStyle = s.boxColour;
    roundRect(ctx, -w / 2, -h / 2, w, h, px * 0.25);
    ctx.fill();
    ctx.restore();
  }
  ctx.font = block.font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const letters = block.lines.reduce((n, line) => n + line.length, 0);
  let left = typed >= 1 ? Infinity : Math.round(typed * letters);
  block.lines.forEach((line, i) => {
    if (left <= 0) return;
    const shown = line.slice(0, left);
    left -= line.length;
    // a line's place comes from its full width, so typing does not shift it
    const full = block.widths[i]!;
    const x =
      s.align === 'left'
        ? -w / 2 + padX
        : s.align === 'right'
          ? w / 2 - padX - full
          : -full / 2;
    const y = -h / 2 + padY + lineHeight * (i + 0.5);
    if (s.outline) {
      ctx.lineWidth = Math.max(1, px * 0.14);
      ctx.strokeStyle = 'rgb(0 0 0 / 80%)';
      ctx.strokeText(shown, x, y);
    }
    ctx.fillStyle = s.colour;
    ctx.fillText(shown, x, y);
  });
}

function shapePath(ctx: Context2D, layer: Layer, w: number, h: number) {
  ctx.beginPath();
  switch (layer.shape) {
    case 'rect':
      roundRect(ctx, -w / 2, -h / 2, w, h, layer.corner * Math.min(w, h));
      return;
    case 'circle':
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      return;
    case 'arrow': {
      const head = Math.min(w * 0.45, h);
      const shaft = h * 0.4;
      const neck = w / 2 - head;
      ctx.moveTo(-w / 2, -shaft / 2);
      ctx.lineTo(neck, -shaft / 2);
      ctx.lineTo(neck, -h / 2);
      ctx.lineTo(w / 2, 0);
      ctx.lineTo(neck, h / 2);
      ctx.lineTo(neck, shaft / 2);
      ctx.lineTo(-w / 2, shaft / 2);
      ctx.closePath();
      return;
    }
    case 'star':
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 0.45 : 1;
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const px = Math.cos(angle) * (w / 2) * r;
        const py = Math.sin(angle) * (h / 2) * r;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
      return;
  }
}

/**
 * Draws one layer at timeline second `t`. `source` is a picture's or
 * video's current image, with its width over height as `aspect`.
 */
export function drawLayer(
  ctx: Context2D,
  layer: Layer,
  source: CanvasImageSource | null,
  aspect: number,
  W: number,
  H: number,
  t: number,
) {
  const m = motionAt(layer, t, W, H);
  const alpha = clamp01(layer.opacity) * m.alpha;
  if (alpha <= 0.002) return;
  if ((layer.kind === 'picture' || layer.kind === 'video') && !source) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.filter = 'none';
  ctx.translate(layer.x * W + m.dx, layer.y * H + m.dy);
  if (layer.angle) ctx.rotate((layer.angle * Math.PI) / 180);
  if (m.scale !== 1) ctx.scale(m.scale, m.scale);
  switch (layer.kind) {
    case 'text':
      drawText(ctx, layer, textBlock(layer, W, H), m.typed);
      break;
    case 'emoji': {
      const px = layer.w * W;
      ctx.font = `${px}px ${EMOJI_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(layer.emoji, 0, px * 0.05);
      break;
    }
    case 'shape': {
      const { w, h } = layerSize(layer, W, H);
      ctx.fillStyle = layer.colour;
      shapePath(ctx, layer, w, h);
      ctx.fill();
      break;
    }
    default: {
      const { w, h } = layerSize(layer, W, H, aspect);
      if (layer.corner > 0) {
        roundRect(ctx, -w / 2, -h / 2, w, h, layer.corner * Math.min(w, h));
        ctx.clip();
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      // a green screen is keyed at the size it is drawn
      const image = layer.key?.on ? keyed(source!, w, h, layer.key) : source!;
      ctx.drawImage(image, -w / 2, -h / 2, w, h);
    }
  }
  ctx.restore();
}
