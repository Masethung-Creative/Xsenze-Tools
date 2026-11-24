/**
 * The text of a PDF, line by line and page by page, with pdf.js. Loaded
 * only when a PDF is opened; its worker is bundled, so nothing comes from a
 * CDN. A PDF made of scanned pages has no text and gives an empty string.
 */
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from '../../../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

interface Piece {
  str: string;
  x: number;
  y: number;
  height: number;
  end: boolean;
}

/** A page number on its own: 3, - 3 -, Page 3, 3 of 12, 3/12. */
const PAGE_NUMBER =
  /^\s*[-–—]?\s*(page\s+)?\d{1,4}(\s*(of|\/)\s*\d{1,4})?\s*[-–—]?\s*$/i;

function pageLines(pieces: Piece[]): string[] {
  const lines: string[] = [];
  let line = '';
  let last: Piece | undefined;
  for (const piece of pieces) {
    if (last) {
      const size = Math.max(last.height, piece.height, 1);
      const drop = last.y - piece.y;
      if (last.end || Math.abs(drop) > size * 0.5) {
        lines.push(line);
        // a gap of more than a line and a half starts a paragraph
        if (drop > size * 1.8) lines.push('');
        line = '';
      } else if (
        line &&
        !line.endsWith(' ') &&
        !piece.str.startsWith(' ') &&
        piece.x > last.x + 0.5
      ) {
        line += ' ';
      }
    }
    line += piece.str;
    last = piece;
  }
  if (line) lines.push(line);
  return lines.map((l) => l.replace(/\s+/g, ' ').trim());
}

/** Drops page numbers and the header or footer line repeated on most pages. */
function withoutFurniture(pages: string[][]): string[][] {
  const edges = (lines: string[]) => {
    const real = lines.filter(Boolean);
    return [real[0], real.at(-1)].filter((l): l is string => !!l);
  };
  const seen = new Map<string, number>();
  for (const page of pages)
    for (const line of new Set(edges(page)))
      seen.set(line, (seen.get(line) ?? 0) + 1);
  const repeated = (line: string) =>
    pages.length >= 3 && (seen.get(line) ?? 0) >= pages.length / 2;
  return pages.map((page) => {
    const [first, last] = edges(page);
    return page.filter(
      (line) =>
        !(
          (line === first || line === last) &&
          (PAGE_NUMBER.test(line) || repeated(line))
        ),
    );
  });
}

export async function readPdf(
  data: ArrayBuffer,
  onPage?: (done: number, total: number) => void,
): Promise<string> {
  const task = getDocument({ data: new Uint8Array(data) });
  const pdf = await task.promise;
  try {
    const pages: string[][] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      const pieces: Piece[] = [];
      for (const item of content.items) {
        if (!('str' in item)) continue;
        pieces.push({
          str: item.str,
          x: item.transform[4] as number,
          y: item.transform[5] as number,
          height: item.height,
          end: item.hasEOL,
        });
      }
      pages.push(pageLines(pieces));
      page.cleanup();
      onPage?.(n, pdf.numPages);
    }
    return withoutFurniture(pages)
      .map((lines) => lines.join('\n'))
      .join('\n\n');
  } finally {
    void task.destroy();
  }
}
