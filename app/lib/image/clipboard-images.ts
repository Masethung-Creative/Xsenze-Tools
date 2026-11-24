/** The images on the clipboard as files named `pasted`; a denied or failed read keeps what it read so far. */
export async function clipboardImages(): Promise<File[]> {
  const files: File[] = [];
  try {
    for (const item of await navigator.clipboard.read()) {
      const type = item.types.find((t) => t.startsWith('image/'));
      if (type)
        files.push(
          new File([await item.getType(type)], 'pasted', {
            type,
          }),
        );
    }
  } catch {
    // denied: paste nothing
  }
  return files;
}
