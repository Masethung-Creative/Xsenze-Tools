import {
  formatTimestamp,
  writeSrt,
  writeVtt,
  type Cue,
} from 'xsenze-tools/lib/subtitles';

/** The formats the tool exports: subtitles, a plain transcript, styled ASS, LRC lyrics. */
export type ExportFormat = 'srt' | 'vtt' | 'txt' | 'ass' | 'lrc';

export type Failure = '' | 'decode' | 'webgpu' | 'generic';

export const MIME: Record<ExportFormat, string> = {
  srt: 'application/x-subrip',
  vtt: 'text/vtt',
  txt: 'text/plain',
  ass: 'text/x-ssa',
  lrc: 'text/plain',
};

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** Plain transcript: one line per cue, no timings. */
export function writeTxt(cues: Cue[]): string {
  return cues.map((cue) => oneLine(cue.text)).join('\n') + '\n';
}

const oneLine = (text: string) => text.replace(/\s*\n\s*/g, ' ').trim();

/** ASS time: h:mm:ss.cc (centiseconds). */
const assTime = (ms: number) => {
  const cs = Math.round(Math.max(0, ms) / 10);
  const h = Math.floor(cs / 360000);
  const m = Math.floor(cs / 6000) % 60;
  const s = Math.floor(cs / 100) % 60;
  return `${h}:${pad(m)}:${pad(s)}.${pad(cs % 100)}`;
};

/** Styled subtitles: white text, black outline, bottom centre, 1080p canvas. */
export function writeAss(cues: Cue[]): string {
  const head = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'PlayResX: 1920',
    'PlayResY: 1080',
    'WrapStyle: 0',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Default,Arial,64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,3,1,2,80,80,60,1',
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];
  const lines = cues.map((cue) => {
    const text = cue.text
      .trim()
      .replace(/[{}]/g, '')
      .replace(/\r?\n/g, String.raw`\N`);
    return `Dialogue: 0,${assTime(cue.start)},${assTime(cue.end)},Default,,0,0,0,,${text}`;
  });
  return [...head, ...lines, ''].join('\n');
}

/** LRC time: [mm:ss.xx]. */
const lrcTime = (ms: number) => {
  const cs = Math.round(Math.max(0, ms) / 10);
  const m = Math.floor(cs / 6000);
  const s = Math.floor(cs / 100) % 60;
  return `[${pad(m)}:${pad(s)}.${pad(cs % 100)}]`;
};

/** Synced lyrics: each cue a timed line, a blank timed line at gaps. */
export function writeLrc(cues: Cue[]): string {
  const lines: string[] = [];
  cues.forEach((cue, i) => {
    lines.push(lrcTime(cue.start) + oneLine(cue.text));
    const next = cues[i + 1];
    if (!next || next.start - cue.end > 1000) lines.push(lrcTime(cue.end));
  });
  return lines.join('\n') + '\n';
}

/** The cue differs from what came out of the run. */
export function altered(original: Cue[], cue: Cue, index: number): boolean {
  const o = original[index];
  return (
    !o || o.start !== cue.start || o.end !== cue.end || o.text !== cue.text
  );
}

export function output(cues: Cue[], target: ExportFormat): string {
  if (cues.length === 0) return '';
  if (target === 'srt') return writeSrt(cues);
  if (target === 'txt') return writeTxt(cues);
  if (target === 'ass') return writeAss(cues);
  if (target === 'lrc') return writeLrc(cues);
  return writeVtt(cues, { kind: 'captions' });
}

export function stats(cues: Cue[]): string {
  const last = cues.at(-1);
  if (!last) return '';
  return `${cues.length} cues · ${formatTimestamp(last.end, '.')}`;
}

export function outputName(fileName: string, target: ExportFormat) {
  const base = fileName.replace(/\.[^.]+$/, '') || 'subtitles';
  return `${base}.${target}`;
}

export function failure(error: unknown): Failure {
  if ((error as Error | null)?.message === 'webgpu-required') return 'webgpu';
  if ((error as DOMException | null)?.name === 'EncodingError') return 'decode';
  return 'generic';
}
