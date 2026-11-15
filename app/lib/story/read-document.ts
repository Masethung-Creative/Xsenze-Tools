/**
 * A story or script from a file of almost any kind, as plain text for the
 * story box: Word, LibreOffice, PDF, RTF, web pages, e-books, Final Draft,
 * Fountain, subtitles and plain text in any common encoding. Audio and
 * video are heard by Whisper instead (`transcribeStory`). Everything runs in
 * the browser; nothing is uploaded.
 */
import { decodeText } from 'delphicanon/lib/files';
import type JSZip from 'jszip';
import { parseSubtitles } from 'xsenze-tools/lib/subtitles';

export type DocumentResult =
  | { text: string }
  | { error: string }
  /** Audio or video: ask, then `transcribeStory`. */
  | { media: true };

type Kind =
  | 'text'
  | 'docx'
  | 'odt'
  | 'epub'
  | 'zip'
  | 'pdf'
  | 'rtf'
  | 'html'
  | 'fdx'
  | 'subtitles'
  | 'ass'
  | 'media'
  | 'image'
  | 'old-office'
  | 'pages';

const BY_EXTENSION: Record<string, Kind> = {
  txt: 'text',
  text: 'text',
  md: 'text',
  markdown: 'text',
  fountain: 'text',
  spmd: 'text',
  csv: 'text',
  tsv: 'text',
  json: 'text',
  log: 'text',
  docx: 'docx',
  docm: 'docx',
  dotx: 'docx',
  odt: 'odt',
  ott: 'odt',
  epub: 'epub',
  pdf: 'pdf',
  rtf: 'rtf',
  html: 'html',
  htm: 'html',
  xhtml: 'html',
  mht: 'html',
  fdx: 'fdx',
  srt: 'subtitles',
  vtt: 'subtitles',
  ass: 'ass',
  ssa: 'ass',
  doc: 'old-office',
  wps: 'old-office',
  pages: 'pages',
};

const SAVE_AS = 'Save it as .docx, PDF or .txt and open it again.';

const extensionOf = (name: string) =>
  name.includes('.') ? (name.split('.').pop() ?? '').toLowerCase() : '';

const startsWith = (bytes: Uint8Array, ...sig: number[]) =>
  sig.every((b, i) => bytes[i] === b);

function kindOf(file: File, bytes: Uint8Array): Kind | undefined {
  const known = BY_EXTENSION[extensionOf(file.name)];
  if (known) return known;
  const type = file.type.toLowerCase();
  if (type.startsWith('audio/') || type.startsWith('video/')) return 'media';
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'pdf';
  if (type.includes('html')) return 'html';
  if (type.includes('rtf')) return 'rtf';
  if (startsWith(bytes, 0x25, 0x50, 0x44, 0x46)) return 'pdf'; // %PDF
  if (startsWith(bytes, 0x7b, 0x5c, 0x72, 0x74, 0x66)) return 'rtf'; // {\rtf
  if (startsWith(bytes, 0x50, 0x4b, 0x03, 0x04)) return 'zip';
  if (startsWith(bytes, 0xd0, 0xcf, 0x11, 0xe0)) return 'old-office';
  if (type.startsWith('text/')) return 'text';
  return undefined;
}

/** True when the start of a file reads as text: no NUL bytes outside UTF-16. */
function looksLikeText(bytes: Uint8Array): boolean {
  const head = bytes.subarray(0, 4096);
  if (startsWith(head, 0xff, 0xfe) || startsWith(head, 0xfe, 0xff)) return true;
  return !head.includes(0);
}

// ---------- clean-up ----------

/**
 * Plain, tidy text: one kind of line break, no stray invisible characters,
 * no spaces at line ends and at most one blank line in a row. `joinWraps`
 * mends a PDF's lines that were broken mid-sentence.
 */
export function cleanText(raw: string, joinWraps = false): string {
  let text = raw
    .replace(/\r\n?/g, '\n')
    .replace(/[\u2028\u2029\f\v]/g, '\n')
    .replace(/[\u00a0\u2007\u202f]/g, ' ')
    // zero-width joiners (u200c, u200d) shape Indic and emoji text, so they stay
    .replace(/[\u200b\u2060\ufeff\u00ad]/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n');
  if (joinWraps)
    text = text
      // a hyphen at the line end: the word goes on, hyphen kept (long-forgotten)
      .replace(/(\p{Ll})-\n(\p{Ll})/gu, '$1-$2')
      // a line that stops mid-sentence and goes on in lower case
      .replace(/([\p{Ll},;:])\n(?=\p{Ll})/gu, '$1 ');
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

// ---------- XML and HTML ----------

const parseXml = (text: string) =>
  new DOMParser().parseFromString(text, 'application/xml');

const childElements = (node: Node): Element[] =>
  [...node.childNodes].filter(
    (n): n is Element => n.nodeType === Node.ELEMENT_NODE,
  );

/** Elements named `name` (prefix:local) anywhere under `root`, in order. */
const all = (root: Document | Element, name: string): Element[] => [
  ...root.getElementsByTagName(name),
];

const BLOCKS = new Set(
  'address article aside blockquote dd details dialog div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr li main nav ol p pre section summary table tbody thead tfoot tr ul'.split(
    ' ',
  ),
);

const SKIPPED = new Set(
  'script style noscript template head svg canvas iframe object button select'.split(
    ' ',
  ),
);

function htmlNodeText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE)
    return (node.textContent ?? '').replace(/\s+/g, ' ');
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as Element;
  const tag = el.localName.toLowerCase();
  if (SKIPPED.has(tag) || el.getAttribute('hidden') !== null) return '';
  if (tag === 'br') return '\n';
  if (tag === 'pre') return `\n\n${el.textContent ?? ''}\n\n`;
  const inner = [...el.childNodes].map(htmlNodeText).join('');
  if (tag === 'li') return `\n• ${inner.trim()}\n`;
  if (tag === 'td' || tag === 'th') return `${inner.trim()}\t`;
  if (tag === 'img') return el.getAttribute('alt') ?? '';
  if (BLOCKS.has(tag)) return `\n\n${inner.trim()}\n\n`;
  return inner;
}

/** The readable text of a web page, one block per paragraph. */
export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const text = htmlNodeText(doc.body ?? doc.documentElement);
  return text
    .split('\n')
    .map((line) => line.replace(/^ +| +$/g, ''))
    .join('\n');
}

// ---------- Word ----------

/** The w:p a node sits in, or undefined at body level. */
function ownParagraph(node: Element): Element | undefined {
  for (let p = node.parentElement; p; p = p.parentElement)
    if (p.tagName === 'w:p') return p;
  return undefined;
}

const insideFallback = (node: Element) => {
  for (let p = node.parentElement; p; p = p.parentElement)
    if (p.tagName === 'mc:Fallback') return true;
  return false;
};

function docxParagraph(p: Element): string {
  let text = '';
  for (const el of all(p, '*')) {
    if (ownParagraph(el) !== p) continue;
    if (el.tagName === 'w:t') text += el.textContent ?? '';
    else if (el.tagName === 'w:tab') text += '\t';
    else if (el.tagName === 'w:br' || el.tagName === 'w:cr') text += '\n';
    else if (el.tagName === 'w:noBreakHyphen') text += '-';
  }
  const numbered = all(p, 'w:numPr').some((n) => ownParagraph(n) === p);
  return numbered && text.trim() ? `• ${text}` : text;
}

function docxText(xml: string): string {
  const doc = parseXml(xml);
  const paragraphs = all(doc, 'w:p').filter((p) => !insideFallback(p));
  return paragraphs.map(docxParagraph).join('\n\n');
}

// ---------- OpenDocument ----------

function odtNodeText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as Element;
  switch (el.tagName) {
    case 'text:s':
      return ' '.repeat(Number(el.getAttribute('text:c') ?? 1) || 1);
    case 'text:tab':
      return '\t';
    case 'text:line-break':
      return '\n';
    case 'text:note':
    case 'office:annotation':
    case 'text:tracked-changes':
      return '';
    case 'text:p':
    case 'text:h':
      return `${[...el.childNodes].map(odtNodeText).join('')}\n\n`;
    case 'text:list-item':
      return `• ${[...el.childNodes].map(odtNodeText).join('').trim()}\n\n`;
    default:
      return [...el.childNodes].map(odtNodeText).join('');
  }
}

function odtText(xml: string): string {
  const doc = parseXml(xml);
  const body = all(doc, 'office:text')[0];
  return body ? odtNodeText(body) : '';
}

// ---------- e-books ----------

async function epubText(zip: JSZip): Promise<string> {
  const container = await zip.file('META-INF/container.xml')?.async('string');
  const opfPath = container
    ? all(parseXml(container), 'rootfile')[0]?.getAttribute('full-path')
    : undefined;
  const opf = opfPath ? await zip.file(opfPath)?.async('string') : undefined;
  if (!opfPath || !opf) return '';
  const base = opfPath.includes('/')
    ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1)
    : '';
  const doc = parseXml(opf);
  const hrefs = new Map(
    all(doc, 'item').map((i) => [
      i.getAttribute('id') ?? '',
      i.getAttribute('href') ?? '',
    ]),
  );
  const chapters: string[] = [];
  for (const ref of all(doc, 'itemref')) {
    const href = hrefs.get(ref.getAttribute('idref') ?? '');
    if (!href) continue;
    const path = decodeURIComponent(base + href.split('#')[0]);
    const html = await zip.file(path)?.async('string');
    if (html) chapters.push(htmlToText(html));
  }
  return chapters.join('\n\n');
}

// ---------- Final Draft ----------

function fdxText(xml: string): string {
  const doc = parseXml(xml);
  const content = all(doc, 'Content')[0];
  if (!content) return '';
  const out: string[] = [];
  for (const para of childElements(content)) {
    if (para.tagName !== 'Paragraph') continue;
    const type = para.getAttribute('Type') ?? 'Action';
    const text = all(para, 'Text')
      .map((t) => t.textContent ?? '')
      .join('')
      .trim();
    if (!text) continue;
    switch (type) {
      case 'Scene Heading':
      case 'Shot':
      case 'Transition':
        out.push('', text.toUpperCase(), '');
        break;
      case 'Character':
        out.push('', text.toUpperCase());
        break;
      case 'Parenthetical':
        out.push(text.startsWith('(') ? text : `(${text})`);
        break;
      case 'Dialogue':
        out.push(text);
        break;
      default:
        out.push('', text, '');
    }
  }
  return out.join('\n');
}

// ---------- RTF ----------

/** Groups whose text is not the document's: fonts, pictures, notes… */
const RTF_SKIP = new Set(
  'fonttbl colortbl stylesheet info pict header headerl headerr headerf footer footerl footerr footerf object themedata colorschememapping latentstyles datastore xmlnstbl listtable listoverridetable rsidtbl generator mmathPr fldinst footnote annotation atnid atnauthor pntext pntxta pntxtb filetbl revtbl bkmkstart bkmkend nonshppict shp'.split(
    ' ',
  ),
);

const RTF_WORDS: Record<string, string> = {
  par: '\n',
  line: '\n',
  sect: '\n\n',
  page: '\n\n',
  tab: '\t',
  cell: '\t',
  row: '\n',
  emdash: '—',
  endash: '–',
  bullet: '•',
  lquote: '‘',
  rquote: '’',
  ldblquote: '“',
  rdblquote: '”',
  emspace: ' ',
  enspace: ' ',
  qmspace: ' ',
};

const cp1252 = new TextDecoder('windows-1252');

export function rtfToText(rtf: string): string {
  let out = '';
  let skip = false;
  let uc = 1;
  /** Fallback characters still to drop after a \u. */
  let pendingSkip = 0;
  const stack: { skip: boolean; uc: number }[] = [];
  let i = 0;
  const emit = (s: string) => {
    if (pendingSkip > 0) {
      pendingSkip -= 1;
      return;
    }
    if (!skip) out += s;
  };
  while (i < rtf.length) {
    const c = rtf[i]!;
    if (c === '{') {
      stack.push({ skip, uc });
      pendingSkip = 0;
      i += 1;
    } else if (c === '}') {
      const top = stack.pop();
      if (top) ({ skip, uc } = top);
      pendingSkip = 0;
      i += 1;
    } else if (c === '\\') {
      const next = rtf[i + 1] ?? '';
      if (next === '\\' || next === '{' || next === '}') {
        emit(next);
        i += 2;
      } else if (next === "'") {
        const byte = parseInt(rtf.slice(i + 2, i + 4), 16);
        if (!Number.isNaN(byte)) emit(cp1252.decode(new Uint8Array([byte])));
        i += 4;
      } else if (next === '*') {
        skip = true;
        i += 2;
      } else if (next === '~') {
        emit(' ');
        i += 2;
      } else if (next === '-' || next === '_') {
        if (next === '_') emit('-');
        i += 2;
      } else if (next === '\n' || next === '\r') {
        emit('\n');
        i += 2;
      } else {
        const match = /^([a-zA-Z]{1,32})(-?\d{1,10})? ?/.exec(rtf.slice(i + 1));
        if (!match) {
          i += 2;
          continue;
        }
        i += 1 + match[0].length;
        const word = match[1]!;
        const param = match[2] === undefined ? undefined : Number(match[2]);
        if (RTF_SKIP.has(word)) skip = true;
        else if (word === 'uc') uc = param ?? 1;
        else if (word === 'u' && param !== undefined) {
          emit(String.fromCharCode(param < 0 ? param + 65536 : param));
          pendingSkip = uc;
        } else if (word in RTF_WORDS) emit(RTF_WORDS[word]!);
      }
    } else {
      if (c !== '\n' && c !== '\r') emit(c);
      i += 1;
    }
  }
  return out;
}

// ---------- subtitles ----------

const stripTags = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/\\[Nn]/g, ' ');

/** Spoken lines, one per cue, with a blank line where speech pauses. */
function subtitleText(raw: string): string {
  const cues = parseSubtitles(raw);
  let out = '';
  let lastEnd = 0;
  for (const cue of cues) {
    const line = stripTags(cue.text).replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (out) out += cue.start - lastEnd > 2000 ? '\n\n' : '\n';
    out += line;
    lastEnd = cue.end;
  }
  return out;
}

function assText(raw: string): string {
  return raw
    .split(/\r?\n/)
    .filter((l) => l.startsWith('Dialogue:'))
    .map((l) =>
      stripTags(l.split(',').slice(9).join(',')).replace(/\s+/g, ' ').trim(),
    )
    .filter(Boolean)
    .join('\n');
}

// ---------- the reader ----------

async function zipText(
  bytes: Uint8Array,
  kind: Kind,
): Promise<string | { error: string }> {
  const { default: Zip } = await import('jszip');
  const zip = await Zip.loadAsync(bytes);
  const document = zip.file('word/document.xml');
  if (document && kind !== 'odt' && kind !== 'epub')
    return docxText(await document.async('string'));
  const content = zip.file('content.xml');
  if (content && kind !== 'epub') return odtText(await content.async('string'));
  if (zip.file('META-INF/container.xml')) return epubText(zip);
  if (zip.file('index.xml') || zip.file(/^Index\//).length)
    return { error: `Pages files can't be read in a browser. ${SAVE_AS}` };
  return {
    error: `This zip has no document in it that Story Studio knows. ${SAVE_AS}`,
  };
}

/** The story in `file` as plain text, or why it can't be read. */
export async function readDocument(
  file: File,
  onProgress?: (note: string) => void,
): Promise<DocumentResult> {
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return { error: 'This file could not be opened. Try choosing it again.' };
  }
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) return { error: 'This file is empty.' };
  let kind = kindOf(file, bytes);
  if (!kind) kind = looksLikeText(bytes) ? 'text' : undefined;
  try {
    switch (kind) {
      case 'media':
        return { media: true };
      case 'image':
        return {
          error:
            'This is a picture. Reading text from pictures comes with Phase 3; for now, type or paste the text.',
        };
      case 'old-office':
        return {
          error: `Old Word (.doc) files can't be read in a browser. ${SAVE_AS}`,
        };
      case 'pages':
        return { error: `Pages files can't be read in a browser. ${SAVE_AS}` };
      case 'docx':
      case 'odt':
      case 'epub':
      case 'zip': {
        const text = await zipText(bytes, kind);
        return typeof text === 'string' ? done(text) : text;
      }
      case 'pdf': {
        const { readPdf } = await import('./read-pdf');
        const text = await readPdf(buffer, (n, total) =>
          onProgress?.(`Reading page ${n} of ${total}…`),
        );
        if (!text.trim())
          return {
            error:
              'This PDF has pictures of pages and no text. Reading text from pictures comes with Phase 3; for now, copy the text from the PDF if you can.',
          };
        return done(text, true);
      }
      case 'rtf':
        return done(rtfToText(cp1252.decode(bytes)));
      case 'html':
        return done(htmlToText(decodeText(bytes)));
      case 'fdx':
        return done(fdxText(decodeText(bytes)));
      case 'subtitles':
        return done(subtitleText(decodeText(bytes)));
      case 'ass':
        return done(assText(decodeText(bytes)));
      case 'text':
        return done(decodeText(bytes));
      default:
        return {
          error: `Story Studio can't read this kind of file. ${SAVE_AS}`,
        };
    }
  } catch {
    return {
      error: `This file looks damaged, so it could not be read. ${SAVE_AS}`,
    };
  }
}

function done(raw: string, joinWraps = false): DocumentResult {
  const text = cleanText(raw, joinWraps);
  return text
    ? { text }
    : { error: 'There is no text in this file to use as a story.' };
}

// ---------- audio and video ----------

/** Heard speech as paragraphs: a new one after a pause of 1.5 s or more. */
export async function transcribeStory(
  file: File,
  language: string | undefined,
  onProgress: (percent: number) => void,
): Promise<string> {
  const { LANGUAGES, toMono16k, transcribeWords } =
    await import('xsenze-tools/lib/transcribe');
  const pcm = await toMono16k(file);
  const words = await transcribeWords(pcm, {
    mode: 'fast',
    language: LANGUAGES.some((l) => l.code === language) ? language : undefined,
    onProgress,
  });
  let out = '';
  let lastEnd: number | undefined;
  for (const word of words) {
    const text = word.text.trim();
    if (!text) continue;
    if (lastEnd !== undefined)
      out += word.start - lastEnd >= 1.5 ? '\n\n' : ' ';
    out += text;
    lastEnd = word.end;
  }
  return cleanText(out);
}
