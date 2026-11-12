/**
 * Carries one file from the home omnibox (drop / choose / paste) to the tool
 * that opens next. Files only ever live in memory on this device.
 */
let pending: File | undefined;

export function giveFile(file: File): void {
  pending = file;
}

/** Takes the pending file if it matches the tool's accept list. */
export function takeFile(
  matches: (file: File) => boolean = () => true,
): File | undefined {
  const file = pending;
  if (!file || !matches(file)) return undefined;
  pending = undefined;
  return file;
}
