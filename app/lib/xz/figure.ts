/** The number a figure's text starts with, which sets the roll direction; 0 when none. */
export function leadingNumber(text: string): number {
  const value = Number(/^[\d.-]*/.exec(text)?.[0]);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Characters of `after` that differ from `before`, compared from the end so
 * the units digit lines up with the units digit. `old` is the character that
 * stood there, or undefined for a new place.
 */
export function changedFromEnd(
  before: string,
  after: string,
): { index: number; old: string | undefined }[] {
  const was = [...before];
  const now = [...after];
  const changed: { index: number; old: string | undefined }[] = [];
  now.forEach((char, index) => {
    const old = was[was.length - now.length + index];
    if (char !== old) changed.push({ index, old });
  });
  return changed;
}
