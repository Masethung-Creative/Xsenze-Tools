import {
  formatTimestamp,
  parseSubtitles,
  parseTimestamp,
  type Cue,
} from 'xsenze-tools/lib/subtitles/subtitles';

/** The only files the Transcript tool takes: subtitles, never audio or video. */
export const TRANSCRIPT_SUBTITLES = [
  '.srt',
  '.vtt',
  '.ass',
  '.ssa',
  '.lrc',
] as const;

export type TranscriptFormat =
  'txt' | 'docx' | 'md' | 'pdf' | 'csv' | 'json' | 'html';

export const MAIN_FORMATS: TranscriptFormat[] = ['txt', 'docx', 'md'];
export const EXTRA_FORMATS: TranscriptFormat[] = ['pdf', 'csv', 'json', 'html'];

export const FORMAT_NAMES: Record<TranscriptFormat, string> = {
  txt: 'TXT',
  docx: 'Word',
  md: 'MD',
  pdf: 'PDF',
  csv: 'CSV',
  json: 'JSON',
  html: 'HTML',
};

export const FORMAT_MIME: Record<TranscriptFormat, string> = {
  txt: 'text/plain;charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  md: 'text/markdown;charset=utf-8',
  pdf: 'application/pdf',
  csv: 'text/csv;charset=utf-8',
  json: 'application/json',
  html: 'text/html;charset=utf-8',
};

/** off: no times. paragraph: a time before each one. minute: only when a new minute starts. */
export type Stamps = 'off' | 'paragraph' | 'minute';

export interface TranscriptOptions {
  /** A silence this long starts a new paragraph. */
  gapMs: number;
  stamps: Stamps;
  /** Drops [Music], (laughs), ♪ and the like. */
  dropNotes: boolean;
}

export interface Paragraph {
  /** milliseconds */
  start: number;
  end: number;
  text: string;
  /** Shows its start time. */
  stamp: boolean;
}

const SENTENCE_END = /[.!?…।。！？]["'”’)\]]?$/;
// a paragraph this long ends at the next sentence end, and never runs past twice it
const LONG = 700;

const extOf = (name: string) =>
  name.slice(name.lastIndexOf('.') + 1).toLowerCase();

/** The cues of an SRT, VTT, ASS/SSA or LRC file. */
export function readCues(text: string, name: string): Cue[] {
  const ext = extOf(name);
  if (ext === 'ass' || ext === 'ssa' || /^\[Events\]/m.test(text))
    return parseAss(text);
  if (ext === 'lrc') return parseLrc(text);
  const cues = parseSubtitles(text);
  return cues.length || !/^\[\d+:\d/m.test(text) ? cues : parseLrc(text);
}

/** ASS and SSA: the Dialogue lines of [Events], in the order its Format line gives. */
export function parseAss(text: string): Cue[] {
  let fields = [
    'Layer',
    'Start',
    'End',
    'Style',
    'Name',
    'MarginL',
    'MarginR',
    'MarginV',
    'Effect',
    'Text',
  ];
  let events = false;
  const cues: Cue[] = [];
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (line.startsWith('[')) {
      events = /^\[Events\]$/i.test(line);
      continue;
    }
    if (!events) continue;
    if (/^Format:/i.test(line)) {
      fields = line
        .slice(line.indexOf(':') + 1)
        .split(',')
        .map((f) => f.trim());
      continue;
    }
    if (!/^Dialogue:/i.test(line)) continue;
    const parts = line.slice(line.indexOf(':') + 1).split(',');
    const textAt = fields.indexOf('Text');
    const value = (field: string) =>
      (parts[fields.indexOf(field)] ?? '').trim();
    const start = parseTimestamp(value('Start'));
    const end = parseTimestamp(value('End'));
    if (start === null || end === null || textAt < 0) continue;
    const body = parts
      .slice(textAt)
      .join(',')
      .replace(/\{[^}]*\}/g, '')
      .replace(/\\[Nn]/g, '\n')
      .replace(/\\h/g, ' ')
      .trim();
    cues.push({ start, end, text: body });
  }
  return cues.sort((a, b) => a.start - b.start);
}

const LRC_TAG = /\[(\d+):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

/** LRC: each timed line runs until the next one. */
export function parseLrc(text: string): Cue[] {
  const lines: { at: number; text: string }[] = [];
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const times: number[] = [];
    let rest = raw.trim();
    LRC_TAG.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = LRC_TAG.exec(rest)) && match.index === 0) {
      const [whole, m, s, frac] = match;
      times.push(
        Number(m) * 60_000 +
          Number(s) * 1000 +
          Number((frac ?? '0').padEnd(3, '0')),
      );
      rest = rest.slice(whole.length).trim();
      LRC_TAG.lastIndex = 0;
    }
    for (const at of times) lines.push({ at, text: rest });
  }
  lines.sort((a, b) => a.at - b.at);
  const cues: Cue[] = [];
  lines.forEach((line, i) => {
    if (!line.text) return;
    const next = lines[i + 1];
    cues.push({
      start: line.at,
      end: next ? next.at : line.at + 4000,
      text: line.text,
    });
  });
  return cues;
}

/** One line of spoken text: markup gone, and the sound notes too if asked. */
export function cleanText(text: string, dropNotes: boolean): string {
  let t = text
    .replace(/<[^>]*>/g, '')
    .replace(/\{\\[^}]*\}/g, '')
    .replace(/\s*\n\s*/g, ' ');
  if (dropNotes)
    t = t
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[♪♫♬]+/g, ' ');
  return t
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
}

/** The cues joined into paragraphs at pauses, with the times to show. */
export function paragraphs(
  cues: Cue[],
  options: TranscriptOptions,
): Paragraph[] {
  const out: Paragraph[] = [];
  let current: Paragraph | null = null;
  for (const cue of [...cues].sort((a, b) => a.start - b.start)) {
    const text = cleanText(cue.text, options.dropNotes);
    if (!text) continue;
    const long =
      current &&
      ((current.text.length > LONG && SENTENCE_END.test(current.text)) ||
        current.text.length > LONG * 2);
    if (!current || cue.start - current.end > options.gapMs || long) {
      current = { start: cue.start, end: cue.end, text, stamp: false };
      out.push(current);
    } else {
      current.text += ` ${text}`;
      current.end = Math.max(current.end, cue.end);
    }
  }
  let minute = -1;
  for (const p of out) {
    if (options.stamps === 'paragraph') p.stamp = true;
    else if (options.stamps === 'minute') {
      const at = Math.floor(p.start / 60_000);
      p.stamp = at > minute;
      if (p.stamp) minute = at;
    }
  }
  return out;
}

/** [hh:mm:ss] */
export function clock(ms: number): string {
  return formatTimestamp(ms, '.').slice(0, 8);
}

export function wordCount(paras: Paragraph[]): number {
  return paras.reduce(
    (n, p) => n + p.text.split(/\s+/).filter(Boolean).length,
    0,
  );
}

export function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '') || 'transcript';
}

/* --- the text formats --- */

const stamped = (p: Paragraph) =>
  p.stamp ? `[${clock(p.start)}] ${p.text}` : p.text;

export function writeText(paras: Paragraph[]): string {
  return paras.map(stamped).join('\n\n') + '\n';
}

export function writeMarkdown(title: string, paras: Paragraph[]): string {
  const body = paras.map((p) =>
    p.stamp ? `**[${clock(p.start)}]** ${p.text}` : p.text,
  );
  return [`# ${title}`, ...body].join('\n\n') + '\n';
}

const BOM = String.fromCharCode(0xfeff);

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

/** One row per paragraph; the byte order mark lets Excel read it as UTF-8. */
export function writeCsv(paras: Paragraph[]): string {
  const rows = paras.map((p) =>
    [
      formatTimestamp(p.start, '.'),
      formatTimestamp(p.end, '.'),
      csvCell(p.text),
    ].join(','),
  );
  return BOM + ['Start,End,Text', ...rows].join('\r\n') + '\r\n';
}

const seconds = (ms: number) => Math.round(ms) / 1000;

export function writeJson(
  title: string,
  paras: Paragraph[],
  cues: Cue[],
  dropNotes: boolean,
): string {
  return (
    JSON.stringify(
      {
        title,
        paragraphs: paras.map((p) => ({
          start: seconds(p.start),
          end: seconds(p.end),
          text: p.text,
        })),
        segments: cues.flatMap((c) => {
          const text = cleanText(c.text, dropNotes);
          return text
            ? [{ start: seconds(c.start), end: seconds(c.end), text }]
            : [];
        }),
      },
      null,
      2,
    ) + '\n'
  );
}

export const escapeXml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function writeHtml(title: string, paras: Paragraph[]): string {
  const body = paras
    .map((p) => {
      const time = p.stamp
        ? `<time datetime="PT${seconds(p.start)}S">${clock(p.start)}</time> `
        : '';
      return `<p>${time}${escapeXml(p.text)}</p>`;
    })
    .join('\n');
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeXml(title)}</title>
<style>
body { max-width: 42rem; margin: 3rem auto; padding: 0 1rem; font: 17px/1.6 system-ui, sans-serif; color: #1a1a1a; }
h1 { font-size: 1.6rem; line-height: 1.25; }
time { color: #777; font-size: 0.85em; font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
<h1>${escapeXml(title)}</h1>
${body}
</body>
</html>
`;
}
