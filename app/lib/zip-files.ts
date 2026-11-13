export interface NamedBlob {
  name: string;
  blob: Blob;
}

/** A zip of `files`; a repeated name gets ` (2)`, ` (3)` before its extension. */
export async function zipFiles(files: NamedBlob[]): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const taken = new Set<string>();
  for (const file of files) {
    zip.file(uniqueName(file.name, taken), file.blob);
  }
  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
}

export function uniqueName(name: string, taken: Set<string>): string {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let candidate = name;
  for (let n = 2; taken.has(candidate); n++) candidate = `${stem} (${n})${ext}`;
  taken.add(candidate);
  return candidate;
}
