/** One run of the counter: dimmed leading zeros, digits, or a kerned full stop. */
export interface TimecodeRun {
  text: string;
  dim: boolean;
  stop: boolean;
}

/** MM:SS.hh, minutes capped at 99. */
export function hundredths(seconds: number): string {
  const total = Math.round(Math.max(0, seconds) * 100);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.min(99, Math.floor(total / 6000)))}:${pad(Math.floor(total / 100) % 60)}.${pad(total % 100)}`;
}

/**
 * The counter's text split into runs. A blank counter shows hyphens in the
 * shape of `shape`, all dimmed; otherwise leading zeros that carry no value are dimmed,
 * the last four characters never. The segment font has no semicolon, so a
 * drop-frame separator shows as a full stop.
 */
export function timecodeRuns(shape: string, blank: boolean): TimecodeRun[] {
  let text = shape.replaceAll(';', '.');
  // the iOS counter dims a blank one whole
  let dimmed = blank ? text.length : 0;
  if (blank) {
    text = text.replace(/\d/g, '-');
  } else {
    const lead = /^[0:.]*/.exec(text)![0].length;
    dimmed = Math.max(0, Math.min(text.length - 4, lead));
  }
  const runs: TimecodeRun[] = [];
  [...text].forEach((character, index) => {
    const stop = character === '.';
    const dim = index < dimmed;
    const last = runs.at(-1);
    if (last && !stop && !last.stop && last.dim === dim) last.text += character;
    else runs.push({ text: character, dim, stop });
  });
  return runs;
}

/** Whether a formatted timecode has any digit to show. */
export function hasDigits(text: string | null | undefined): boolean {
  return /\d/.test(text ?? '');
}
