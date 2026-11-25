import {
  FORMAT_MIME,
  baseName,
  clock,
  escapeXml,
  paragraphs,
  writeCsv,
  writeHtml,
  writeJson,
  writeMarkdown,
  writeText,
  type Paragraph,
  type TranscriptFormat,
  type TranscriptOptions,
} from 'xsenze-tools/lib/subtitles/transcript';
import type { Cue } from 'xsenze-tools/lib/subtitles/subtitles';
import type { NamedBlob } from 'xsenze-tools/lib/zip-files';

/** One transcript in one format, named after its source file. */
export async function transcriptFile(
  fileName: string,
  cues: Cue[],
  format: TranscriptFormat,
  options: TranscriptOptions,
): Promise<NamedBlob> {
  const title = baseName(fileName);
  const paras = paragraphs(cues, options);
  const name = `${title}.${format}`;
  const text = (value: string) =>
    new Blob([value], { type: FORMAT_MIME[format] });
  switch (format) {
    case 'txt':
      return { name, blob: text(writeText(paras)) };
    case 'md':
      return { name, blob: text(writeMarkdown(title, paras)) };
    case 'csv':
      return { name, blob: text(writeCsv(paras)) };
    case 'json':
      return {
        name,
        blob: text(writeJson(title, paras, cues, options.dropNotes)),
      };
    case 'html':
      return { name, blob: text(writeHtml(title, paras)) };
    case 'docx':
      return { name, blob: await writeDocx(title, paras) };
    case 'pdf':
      return { name, blob: await writePdf(title, paras) };
  }
}

/* --- DOCX: the least WordprocessingML Word, Pages and Google Docs open --- */

const run = (text: string, props = '') =>
  `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;

const FONT = '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>';

export async function writeDocx(
  title: string,
  paras: Paragraph[],
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const heading = `<w:p><w:pPr><w:spacing w:after="240"/></w:pPr>${run(title, `${FONT}<w:b/><w:sz w:val="36"/>`)}</w:p>`;
  const body = paras
    .map((p) => {
      const time = p.stamp
        ? run(`[${clock(p.start)}] `, `${FONT}<w:color w:val="777777"/>`)
        : '';
      return `<w:p><w:pPr><w:spacing w:after="200" w:line="300" w:lineRule="auto"/></w:pPr>${time}${run(p.text, FONT)}</w:p>`;
    })
    .join('');
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>',
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>',
  );
  zip.file(
    'word/document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      `<w:body>${heading}${body}` +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>' +
      '</w:body></w:document>',
  );
  return zip.generateAsync({ type: 'blob', mimeType: FORMAT_MIME.docx });
}

/*
 * --- PDF: A4 pages drawn on a canvas, so every script the browser can show
 * prints; each page is one JPEG in a hand-written PDF ---
 */

const PAGE_W = 595.28;
const PAGE_H = 841.89;
// pixels per point: 2 is about 144 dpi
const SCALE = 2;
const MARGIN = 56;
const BODY = 11;
const LEADING = 16.5;
const TITLE = 18;
const SANS = 'system-ui, "Segoe UI", Helvetica, Arial, sans-serif';

interface Line {
  text: string;
  /** The time before the line, in grey. */
  time: string;
  /** Space before it, in points. */
  before: number;
  bold: boolean;
  size: number;
}

/** Breaks at spaces; a word wider than the line breaks between letters. */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  first: number,
  width: number,
): string[] {
  const lines: string[] = [];
  let line = '';
  let room = first;
  const push = () => {
    lines.push(line);
    line = '';
    room = width;
  };
  for (const word of text.split(/(\s+)/)) {
    if (!word) continue;
    const next = line + word;
    if (ctx.measureText(next).width <= room) {
      line = next;
      continue;
    }
    if (/^\s+$/.test(word)) {
      push();
      continue;
    }
    if (line.trim()) push();
    let piece = '';
    for (const char of word) {
      if (ctx.measureText(line + piece + char).width > room && piece) {
        line += piece;
        push();
        piece = '';
      }
      piece += char;
    }
    line += piece;
  }
  if (line.trim()) lines.push(line);
  return lines.map((l) => l.trim());
}

function layout(
  ctx: CanvasRenderingContext2D,
  title: string,
  paras: Paragraph[],
): Line[] {
  const width = PAGE_W - MARGIN * 2;
  ctx.font = `700 ${TITLE}px ${SANS}`;
  const lines: Line[] = wrap(ctx, title, width, width).map((text) => ({
    text,
    time: '',
    before: 0,
    bold: true,
    size: TITLE,
  }));
  ctx.font = `400 ${BODY}px ${SANS}`;
  for (const p of paras) {
    const time = p.stamp ? `[${clock(p.start)}] ` : '';
    const indent = time ? ctx.measureText(time).width : 0;
    wrap(ctx, p.text, width - indent, width).forEach((text, i) =>
      lines.push({
        text,
        time: i === 0 ? time : '',
        before: i === 0 ? LEADING * 0.75 : 0,
        bold: false,
        size: BODY,
      }),
    );
  }
  return lines;
}

function pageCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(PAGE_W * SCALE);
  canvas.height = Math.round(PAGE_H * SCALE);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  return { canvas, ctx };
}

async function jpeg(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.88),
  );
  if (!blob) throw new Error('page-render');
  return new Uint8Array(await blob.arrayBuffer());
}

export async function writePdf(
  title: string,
  paras: Paragraph[],
): Promise<Blob> {
  const { ctx: measure } = pageCanvas();
  const lines = layout(measure, title, paras);
  const pages: Uint8Array[] = [];
  let index = 0;
  do {
    const { canvas, ctx } = pageCanvas();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, PAGE_W + 1, PAGE_H + 1);
    ctx.textBaseline = 'alphabetic';
    let y = MARGIN;
    let first = true;
    while (index < lines.length) {
      const line = lines[index]!;
      const height = (first ? 0 : line.before) + line.size * 1.5;
      if (!first && y + height > PAGE_H - MARGIN) break;
      y += height;
      let x = MARGIN;
      if (line.time) {
        ctx.font = `400 ${line.size}px ${SANS}`;
        ctx.fillStyle = '#777';
        ctx.fillText(line.time, x, y);
        x += ctx.measureText(line.time).width;
      }
      ctx.font = `${line.bold ? 700 : 400} ${line.size}px ${SANS}`;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillText(line.text, x, y);
      if (line.bold) y += 6;
      first = false;
      index++;
    }
    pages.push(await jpeg(canvas));
  } while (index < lines.length);
  return pdfOfImages(
    pages,
    Math.round(PAGE_W * SCALE),
    Math.round(PAGE_H * SCALE),
  );
}

/** A PDF with one full-page JPEG per page. */
export function pdfOfImages(
  images: Uint8Array[],
  width: number,
  height: number,
): Blob {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let size = 0;
  const put = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
    parts.push(bytes);
    size += bytes.length;
  };
  const object = (id: number, body: string) => {
    offsets[id] = size;
    put(`${id} 0 obj\n${body}\nendobj\n`);
  };
  put('%PDF-1.4\n%âãÏÓ\n');
  // 1 catalog, 2 page tree, then page, content and image per page
  const pageIds = images.map((_, i) => 3 + i * 3);
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(
    2,
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${images.length} >>`,
  );
  const draw = `q ${PAGE_W} 0 0 ${PAGE_H} 0 0 cm /Im0 Do Q`;
  images.forEach((image, i) => {
    const id = pageIds[i]!;
    object(
      id,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /XObject << /Im0 ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`,
    );
    object(id + 1, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
    offsets[id + 2] = size;
    put(
      `${id + 2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`,
    );
    put(image);
    put('\nendstream\nendobj\n');
  });
  const count = 3 + images.length * 3;
  const xref = size;
  let table = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let id = 1; id < count; id++)
    table += `${String(offsets[id] ?? 0).padStart(10, '0')} 00000 n \n`;
  put(table);
  put(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts as BlobPart[], { type: FORMAT_MIME.pdf });
}
