/** Frames past this decode to about 150 MB. */
export const maxFrames = 300;

/** Frames a GIF of the span holds, at least one. */
export function frameCount(start: number, end: number, fps: number) {
  return Math.max(1, Math.round(Math.abs(end - start) * fps));
}

/** The GIF's pixel size: the asked width, never above the source's, at the source's aspect. */
export function outputSize(
  width: number,
  sourceWidth: number,
  sourceHeight: number,
): [number, number] {
  if (!(sourceWidth > 0 && sourceHeight > 0)) return [0, 0];
  const w = Math.min(width, sourceWidth);
  return [w, Math.round((w * sourceHeight) / sourceWidth)];
}
