import {
  formatTimestamp,
  writeSrt,
  writeVtt,
  type Cue,
} from 'xsenze-tools/lib/subtitles';
import { writeAss } from 'xsenze-tools/components/tools/auto-subtitle/result';

export type OutFormat = 'srt' | 'vtt' | 'ass' | 'bilingual' | 'txt' | 'sbv';

export const FORMATS: OutFormat[] = [
  'srt',
  'vtt',
  'ass',
  'bilingual',
  'txt',
  'sbv',
];
export const FORMAT_LABELS = ['SRT', 'VTT', 'ASS', 'Bilingual', 'TXT', 'SBV'];

export const FORMAT_NOTES: Record<OutFormat, string> = {
  srt: 'Works almost everywhere.',
  vtt: 'For web players and HTML video.',
  ass: 'Styled: white text, black outline, bottom centre.',
  bilingual: 'SRT with the original line above the translation.',
  txt: 'Just the translated text, one line per subtitle.',
  sbv: 'YouTube’s caption format, for YouTube Studio.',
};

const EXT: Record<OutFormat, string> = {
  srt: 'srt',
  vtt: 'vtt',
  ass: 'ass',
  bilingual: 'srt',
  txt: 'txt',
  sbv: 'sbv',
};

const MIME: Record<OutFormat, string> = {
  srt: 'application/x-subrip',
  vtt: 'text/vtt',
  ass: 'text/x-ssa',
  bilingual: 'application/x-subrip',
  txt: 'text/plain',
  sbv: 'text/plain',
};

export const mimeOf = (format: OutFormat) => MIME[format];

/** movie.ta.srt; a bilingual file names both languages, movie.en-ta.srt. */
export function outputName(
  fileName: string,
  format: OutFormat,
  from: string,
  to: string,
): string {
  const base = (fileName || 'subtitles').replace(/\.[^.]+$/, '');
  const tag = format === 'bilingual' ? `${from}-${to}` : to;
  return `${base}.${tag}.${EXT[format]}`;
}

/** SBV time: h:mm:ss.mmm */
const sbvTime = (ms: number) =>
  formatTimestamp(ms, '.').replace(/^0(\d)/, '$1');

const oneLine = (text: string) => text.replace(/\s*\n\s*/g, ' ').trim();

/** The translated cues in a format; `original` feeds the bilingual one. */
export function writeOutput(
  format: OutFormat,
  cues: Cue[],
  original: Cue[],
  language: string,
): string {
  if (cues.length === 0) return '';
  switch (format) {
    case 'srt':
      return writeSrt(cues);
    case 'vtt':
      return writeVtt(cues, { kind: 'subtitles', language });
    case 'ass':
      return writeAss(cues);
    case 'bilingual':
      return writeSrt(
        cues.map((cue, i) => ({
          ...cue,
          text: `${original[i]?.text.trim() ?? ''}\n${cue.text.trim()}`,
        })),
      );
    case 'txt':
      return cues.map((cue) => oneLine(cue.text)).join('\n') + '\n';
    case 'sbv':
      return (
        cues
          .map(
            (cue) =>
              `${sbvTime(cue.start)},${sbvTime(cue.end)}\n${cue.text.trim()}`,
          )
          .join('\n\n') + '\n'
      );
  }
}
