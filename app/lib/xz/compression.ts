/** 1024-based, one decimal from KB up: 512 B, 1.5 KB, 3.0 MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Negative means smaller than the original. */
export function savingsPercent(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.round(((after - before) / before) * 100);
}

/** The saving without its unit: −60, +50, ±0. */
export function savingsFigure(before: number, after: number): string {
  const saving = savingsPercent(before, after);
  if (saving === 0) return '±0';
  return `${saving < 0 ? '−' : '+'}${Math.abs(saving)}`;
}

export interface CompressionScale {
  /** Both sizes are above zero. */
  known: boolean;
  grew: boolean;
  /** The result bar's share of the original's, 0 to 1. */
  share: number;
  /** The saving, or a dash before a result. */
  figure: string;
  unit?: string;
}

export function compressionScale(
  before: number,
  after: number,
): CompressionScale {
  const known = before > 0 && after > 0;
  return {
    known,
    grew: after > before,
    share: known ? Math.min(1, after / before) : 0,
    figure: known ? savingsFigure(before, after) : '—',
    unit: known ? '%' : undefined,
  };
}

/** A bar's label: the name, two spaces and the size when there is one. */
export function barLabel(label: string, bytes: number): string {
  return bytes > 0 ? `${label}  ${formatBytes(bytes)}` : label;
}

/** Spare room the fill must have beside its label for the label to sit inside it. */
export const labelSpare = 20;
