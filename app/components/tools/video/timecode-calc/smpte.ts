/** SMPTE timecode arithmetic, drop-frame included: the port of AVInfoTimecode. */

export interface Parts {
  h: number;
  m: number;
  s: number;
  f: number;
  negative?: boolean;
}

export interface Rate {
  id: string;
  label: string;
  nominal: number;
  exact: number;
  drop: boolean;
}

export const rates: Rate[] = [
  {
    id: '23.976',
    label: '23.976',
    nominal: 24,
    exact: 24000 / 1001,
    drop: false,
  },
  { id: '24', label: '24', nominal: 24, exact: 24, drop: false },
  { id: '25', label: '25', nominal: 25, exact: 25, drop: false },
  {
    id: '29.97ndf',
    label: '29.97 NDF',
    nominal: 30,
    exact: 30000 / 1001,
    drop: false,
  },
  {
    id: '29.97df',
    label: '29.97 DF',
    nominal: 30,
    exact: 30000 / 1001,
    drop: true,
  },
  { id: '30', label: '30', nominal: 30, exact: 30, drop: false },
  { id: '50', label: '50', nominal: 50, exact: 50, drop: false },
  {
    id: '59.94ndf',
    label: '59.94 NDF',
    nominal: 60,
    exact: 60000 / 1001,
    drop: false,
  },
  {
    id: '59.94df',
    label: '59.94 DF',
    nominal: 60,
    exact: 60000 / 1001,
    drop: true,
  },
  { id: '60', label: '60', nominal: 60, exact: 60, drop: false },
];

const dropPerMinute = (nominal: number) => (nominal >= 60 ? 4 : 2);
const pad = (n: number) => String(n).padStart(2, '0');

export function frames(parts: Parts, rate: Rate): number {
  const base = rate.nominal;
  const minutes = parts.h * 60 + parts.m;
  let count = (minutes * 60 + parts.s) * base + parts.f;
  if (rate.drop)
    count -= dropPerMinute(base) * (minutes - Math.floor(minutes / 10));
  return parts.negative ? -count : count;
}

export function parts(frameNumber: number, rate: Rate): Parts {
  let fn = Math.abs(frameNumber);
  const base = rate.nominal;
  if (rate.drop) {
    const dpm = dropPerMinute(base);
    const per10 = base * 600 - dpm * 9;
    const perMinute = base * 60 - dpm;
    const d = Math.floor(fn / per10);
    const mod = fn % per10;
    fn +=
      dpm * 9 * d +
      (mod >= dpm ? dpm * Math.floor((mod - dpm) / perMinute) : 0);
  }
  return {
    h: Math.floor(fn / (base * 3600)),
    m: Math.floor(fn / (base * 60)) % 60,
    s: Math.floor(fn / base) % 60,
    f: fn % base,
    negative: frameNumber < 0,
  };
}

export const seconds = (frameNumber: number, rate: Rate) =>
  frameNumber / rate.exact;

export function format(p: Parts, rate: Rate): string {
  return `${p.negative ? '-' : ''}${pad(p.h)}:${pad(p.m)}:${pad(p.s)}${rate.drop ? ';' : ':'}${pad(p.f)}`;
}

/** HH:MM:SS.mmm, rounded to the millisecond before splitting. */
export function clock(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) >= 1e12) return '—';
  const total = Math.round(Math.abs(value) * 1000);
  const whole = Math.floor(total / 1000);
  const ms = String(total % 1000).padStart(3, '0');
  return `${value < 0 ? '-' : ''}${pad(Math.floor(whole / 3600))}:${pad(Math.floor(whole / 60) % 60)}:${pad(whole % 60)}.${ms}`;
}

export type ParseError =
  | { kind: 'empty' }
  | { kind: 'too-many' }
  | { kind: 'not-numeric' }
  | { kind: 'frame-range'; max: number }
  | { kind: 'seconds-range' }
  | { kind: 'minutes-range' };

export type ParseResult =
  | { ok: true; parts: Parts; frames: number; snappedFrom?: string }
  | { ok: false; error: ParseError };

export function parse(input: string, rate: Rate): ParseResult {
  const raw = input.trim();
  if (raw === '') return { ok: false, error: { kind: 'empty' } };
  const negative = raw.startsWith('-');
  const tokens = (negative ? raw.slice(1) : raw)
    .split(/[:;.,]/)
    .map((token) => token.trim());
  if (tokens.length > 4) return { ok: false, error: { kind: 'too-many' } };
  if (tokens.some((token) => !/^\d+$/.test(token)))
    return { ok: false, error: { kind: 'not-numeric' } };
  // right-align parsed fields
  const padded = [0, 0, 0, 0];
  tokens.forEach((token, i) => (padded[4 - tokens.length + i] = Number(token)));
  const [h, m, s, f] = padded as [number, number, number, number];
  if (f >= rate.nominal)
    return {
      ok: false,
      error: { kind: 'frame-range', max: rate.nominal - 1 },
    };
  if (s > 59) return { ok: false, error: { kind: 'seconds-range' } };
  if (m > 59) return { ok: false, error: { kind: 'minutes-range' } };
  const result: Parts = { h, m, s, f, negative };
  let snappedFrom: string | undefined;
  // skip invalid drop-frame numbers
  const dpm = dropPerMinute(rate.nominal);
  if (rate.drop && m % 10 !== 0 && s === 0 && f < dpm) {
    snappedFrom = format({ h, m, s, f }, rate);
    result.f = dpm;
  }
  return {
    ok: true,
    parts: result,
    frames: frames(result, rate),
    snappedFrom,
  };
}

/** Digits a timecode field holds: eight at most, the newest on the right. */
export const fieldWidth = 8;

export const digitsOf = (text: string) =>
  text.replace(/\D/g, '').slice(-fieldWidth);

/** Up to eight digits, filled from the right, as HH:MM:SS:FF; none gives an empty string. */
export function register(digits: string, drop: boolean): string {
  if (digits === '') return '';
  const padded = digits.slice(-fieldWidth).padStart(fieldWidth, '0');
  const pairs = [0, 2, 4, 6].map((i) => padded.slice(i, i + 2));
  return `${pairs.slice(0, 3).join(':')}${drop ? ';' : ':'}${pairs[3]}`;
}

/** Hyphens in the rate's shape, for a line with nothing to show. */
export const blank = (rate: Rate) => `--:--:--${rate.drop ? ';' : ':'}--`;
