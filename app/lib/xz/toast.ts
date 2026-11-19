/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted.
 */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Seconds a XzToast stays after the last show. */
export const toastHold = 1.4;

/** The copied value, when it is one short line. */
export function toastDetail(detail?: string): string | undefined {
  if (detail === undefined || detail.includes('\n') || detail.length > 48)
    return undefined;
  return detail;
}

/**
 * Where the toast's bottom centre goes: centred on the column, at its bottom,
 * or above a pointer that landed near that bottom.
 */
export function placeToast(
  column: Box,
  height: number,
  pointer?: { x: number; y: number },
): { x: number; bottom: number } {
  let bottom = column.bottom;
  if (
    pointer &&
    pointer.y > bottom - height - 28 &&
    pointer.y < column.bottom + 28 &&
    pointer.x >= column.left &&
    pointer.x <= column.right
  ) {
    bottom = pointer.y - 36;
  }
  return { x: (column.left + column.right) / 2, bottom };
}
