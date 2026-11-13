import {
  formatTimestamp,
  writeSrt,
  writeVtt,
  type Cue,
  type SubtitleFormat,
} from 'xsenze-tools/lib/subtitles';

export type Failure = '' | 'decode' | 'webgpu' | 'generic';

export const MIME: Record<SubtitleFormat, string> = {
  srt: 'application/x-subrip',
  vtt: 'text/vtt',
};

/** The cue differs from what came out of the run. */
export function altered(original: Cue[], cue: Cue, index: number): boolean {
  const o = original[index];
  return (
    !o || o.start !== cue.start || o.end !== cue.end || o.text !== cue.text
  );
}

export function output(cues: Cue[], target: SubtitleFormat): string {
  if (cues.length === 0) return '';
  if (target === 'srt') return writeSrt(cues);
  return writeVtt(cues, { kind: 'captions' });
}

export function stats(cues: Cue[]): string {
  const last = cues.at(-1);
  if (!last) return '';
  return `${cues.length} cues · ${formatTimestamp(last.end, '.')}`;
}

export function outputName(fileName: string, target: SubtitleFormat) {
  const base = fileName.replace(/\.[^.]+$/, '') || 'subtitles';
  return `${base}.${target}`;
}

export function failure(error: unknown): Failure {
  if ((error as Error | null)?.message === 'webgpu-required') return 'webgpu';
  if ((error as DOMException | null)?.name === 'EncodingError') return 'decode';
  return 'generic';
}
