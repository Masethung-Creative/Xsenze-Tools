import type { BurnCodec } from 'xsenze-tools/lib/media-convert';
import type { Cue } from 'xsenze-tools/lib/subtitles';

export type FontChoice = 'sans' | 'serif' | 'mono' | 'quattro';
export type TextStyle = 'outline' | 'box' | 'shadow' | 'plain';

export interface BurnStyle {
  font: FontChoice;
  bold: boolean;
  /** Fraction of the frame height. */
  size: number;
  /** Wrap column, fraction of the frame width. */
  width: number;
  colour: string;
  text: TextStyle;
  /** Outline, box and shadow colour. */
  backing: string;
  /** Fraction of the frame width, from the centre. */
  x: number;
  /** Fraction of the frame height, from the default baseline. */
  y: number;
}

export const DEFAULT_STYLE: BurnStyle = {
  font: 'sans',
  bold: false,
  size: 0.05,
  width: 0.9,
  colour: '#ffffff',
  text: 'outline',
  backing: '#000000',
  x: 0,
  y: 0,
};

// burn style ranges
export const X_RANGE = [-0.45, 0.45] as const;
export const Y_RANGE = [-0.9, 0.05] as const;
export const SIZE_RANGE = [0.02, 0.14] as const;
export const WIDTH_RANGE = [0.3, 0.9] as const;

/** Default baseline, a fraction from the frame top. */
export const BASELINE = 0.94;

/** In the top half the lines stack downward from the baseline. */
export const growsDown = (y: number) => BASELINE + y < 0.5;

export interface TextBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// quattro loads from app.scss
export const FONT_STACKS: Record<FontChoice, string> = {
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  quattro: '"iA Writer Quattro", sans-serif',
};

const LINE_HEIGHT = 1.25;

export function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, '');
}

export function activeCue(cues: Cue[], ms: number): Cue | undefined {
  return cues.find((cue) => ms >= cue.start && ms < cue.end);
}

interface Measurer {
  measureText(text: string): { width: number };
}

export function wrapLines(
  ctx: Measurer,
  text: string,
  maxWidth: number,
): string[] {
  const out: string[] = [];
  for (const raw of text.split('\n')) {
    let line = '';
    for (const word of raw.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        out.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

/** Draws the text as burnt; returns the union of its line boxes in canvas pixels. */
export function drawSubtitle(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  style: BurnStyle,
): TextBox | null {
  const px = Math.max(8, Math.round(style.size * height));
  ctx.font = `${style.bold ? 'bold ' : ''}${px}px ${FONT_STACKS[style.font]}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';

  const lines = wrapLines(ctx, stripTags(text), width * style.width);
  if (lines.length === 0) return null;
  const lineH = px * LINE_HEIGHT;
  const cx = width / 2 + style.x * width;
  const bottom = height * BASELINE + style.y * height;
  const down = growsDown(style.y);
  const padX = px * 0.3;
  const padY = px * 0.15;
  const shadow = px * 0.08;
  let top = Infinity;
  let left = Infinity;
  let right = -Infinity;
  let end = -Infinity;

  lines.forEach((line, i) => {
    const y = down
      ? bottom + i * lineH
      : bottom - (lines.length - 1 - i) * lineH;
    const w = ctx.measureText(line).width;
    const box = {
      x: cx - w / 2 - padX,
      y: y - px * 0.85 - padY,
      width: w + padX * 2,
      height: px * 1.1 + padY * 2,
    };
    left = Math.min(left, box.x);
    top = Math.min(top, box.y);
    right = Math.max(right, box.x + box.width);
    end = Math.max(end, box.y + box.height);
    if (style.text === 'box') {
      // 65 % alpha
      ctx.fillStyle = `${style.backing}a6`;
      ctx.fillRect(box.x, box.y, box.width, box.height);
    } else if (style.text === 'outline') {
      ctx.lineWidth = Math.max(2, px / 8);
      ctx.strokeStyle = style.backing;
      ctx.strokeText(line, cx, y);
    } else if (style.text === 'shadow') {
      // 85 % alpha
      ctx.shadowColor = `${style.backing}d9`;
      ctx.shadowOffsetY = shadow;
      ctx.shadowBlur = shadow * 2;
    }
    ctx.fillStyle = style.colour;
    ctx.fillText(line, cx, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
  });
  return { x: left, y: top, width: right - left, height: end - top };
}

export interface ExportFormat {
  id: string;
  label: string;
  mime: string;
  codec: BurnCodec;
  ext: 'mp4' | 'webm';
}

// first supported format wins
export const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'h264',
    label: 'MP4 · H.264',
    mime: 'video/mp4;codecs=avc1,mp4a.40.2',
    codec: 'avc',
    ext: 'mp4',
  },
  {
    id: 'hevc',
    label: 'MP4 · HEVC',
    mime: 'video/mp4;codecs=hvc1.1.6.L93.B0,mp4a.40.2',
    codec: 'hevc',
    ext: 'mp4',
  },
  {
    id: 'av1-mp4',
    label: 'MP4 · AV1',
    mime: 'video/mp4;codecs=av01.0.08M.08,mp4a.40.2',
    codec: 'av1',
    ext: 'mp4',
  },
  {
    id: 'vp9',
    label: 'WebM · VP9',
    mime: 'video/webm;codecs=vp9,opus',
    codec: 'vp9',
    ext: 'webm',
  },
  {
    id: 'vp8',
    label: 'WebM · VP8',
    mime: 'video/webm;codecs=vp8,opus',
    codec: 'vp8',
    ext: 'webm',
  },
  {
    id: 'av1',
    label: 'WebM · AV1',
    mime: 'video/webm;codecs=av1,opus',
    codec: 'av1',
    ext: 'webm',
  },
];

export function supportedFormats(
  encoders?: Set<BurnCodec> | null,
): (ExportFormat & { supported: boolean })[] {
  const can = encoders
    ? (format: ExportFormat) => encoders.has(format.codec)
    : typeof MediaRecorder !== 'undefined'
      ? (format: ExportFormat) => MediaRecorder.isTypeSupported(format.mime)
      : () => false;
  return EXPORT_FORMATS.map((format) => ({
    ...format,
    supported: can(format),
  }));
}

// bitrate target: 0.12 bpppf
const BITS_PER_PIXEL_FRAME = 0.12;

export function bitrateFor(width: number, height: number, fps = 30): number {
  const bps = Math.round(width * height * fps * BITS_PER_PIXEL_FRAME);
  return Math.min(40e6, Math.max(1e6, bps));
}
