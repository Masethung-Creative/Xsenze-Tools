/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted.
 */
/**
 * True when a file matches an `accept` list as an `<input type=file>` reads
 * it: MIME types, `type/*` wildcards and `.extensions`. An empty list takes
 * any file.
 */
export function accepts(
  file: { name: string; type: string },
  accept = '',
): boolean {
  const patterns = accept
    .split(',')
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean);
  if (patterns.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) return name.endsWith(pattern);
    if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1));
    return type === pattern;
  });
}

/** A file name without its extension. */
export function stem(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

/**
 * A name split so the middle can be cut: the head shrinks with an ellipsis
 * and the tail, the last `keep` characters, stays whole.
 */
export function splitForMiddle(name: string, keep = 8): [string, string] {
  const chars = [...name];
  if (chars.length <= keep) return ['', name];
  return [chars.slice(0, -keep).join(''), chars.slice(-keep).join('')];
}

/**
 * The text of a file in its detected encoding: UTF-16 by its byte order
 * mark, else UTF-8, else Windows-1252.
 */
export function decodeText(bytes: Uint8Array): string {
  const [a, b] = bytes;
  if (a === 0xff && b === 0xfe)
    return new TextDecoder('utf-16le').decode(bytes);
  if (a === 0xfe && b === 0xff)
    return new TextDecoder('utf-16be').decode(bytes);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

/**
 * Opens the file picker for one text file and resolves with its text, or
 * undefined when the picker is cancelled. `accept` is an `<input type=file>`
 * accept list, the file types the tool takes.
 */
export function pickTextFile(accept: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('cancel', () => resolve(undefined));
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return resolve(undefined);
      void file
        .arrayBuffer()
        .then((buffer) => resolve(decodeText(new Uint8Array(buffer))));
    });
    input.click();
  });
}
