import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';
import {
  hasDigits,
  hundredths,
  timecodeRuns,
} from 'xsenze-tools/lib/xz/timecode';
import './timecode.css';

export interface XzTimecodeSignature {
  Args: {
    /** Seconds to show; none shows hyphens. Ignored when `text` is set. */
    seconds?: number | null;
    /**
     * A timecode already formatted. One without digits, or null, shows
     * hyphens in the shape of the last one.
     */
    text?: string | null;
    /** Replaces minutes, seconds and hundredths, for SMPTE timecode. */
    format?: (seconds: number) => string;
    /** Font size in px; default 44. */
    size?: number;
    /** CSS colour of the halo that keeps the digits clear of what runs under them; default the muted colour. */
    halo?: string;
    /** What the counter measures, for assistive technology. */
    label?: string;
  };
  Element: HTMLSpanElement;
}

// the kit readout's seven segments, top first, then clockwise, middle last
const masks: Record<string, number> = {
  '0': 126,
  '1': 48,
  '2': 109,
  '3': 121,
  '4': 51,
  '5': 91,
  '6': 95,
  '7': 112,
  '8': 127,
  '9': 123,
  '-': 1,
};

const h = (y: number, x1 = 1.3, x2 = 10.7) =>
  `M${x1} ${y}L${x1 + 1} ${y - 1}H${x2 - 1}L${x2} ${y}L${x2 - 1} ${y + 1}H${x1 + 1}Z`;
const v = (x: number, y1: number, y2: number) =>
  `M${x} ${y1}L${x + 1} ${y1 + 1}V${y2 - 1}L${x} ${y2}L${x - 1} ${y2 - 1}V${y1 + 1}Z`;

const paths = [
  h(1),
  v(11, 1.3, 9.7),
  v(11, 10.3, 18.7),
  h(19),
  v(1, 10.3, 18.7),
  v(1, 1.3, 9.7),
  h(10),
];

interface Char {
  narrow: boolean;
  colon: boolean;
  dim: boolean;
  segments: { d: string; on: boolean }[];
}

/**
 * Counter in the kit's segment readout, for the corner of a waveform band.
 * Leading zeros that carry no value are dimmed.
 */
export default class XzTimecode extends Component<XzTimecodeSignature> {
  #shape = hundredths(0);

  get display() {
    const { text, seconds, format } = this.args;
    const shape =
      text === undefined ? (format ?? hundredths)(seconds ?? 0) : text;
    const blank =
      text === undefined
        ? seconds === undefined || seconds === null
        : !hasDigits(text);
    // a null text keeps the last shape, as hyphens
    // eslint-disable-next-line ember/no-side-effects
    if (shape) this.#shape = shape;
    return { shape: this.#shape, blank };
  }

  get runs() {
    const { shape, blank } = this.display;
    return timecodeRuns(shape, blank);
  }

  get chars(): Char[] {
    return this.runs.flatMap((run) =>
      [...run.text].map((mark) => {
        const mask = masks[mark] ?? 0;
        return {
          narrow: run.stop || mark === ':',
          colon: mark === ':',
          dim: run.dim,
          segments: paths.map((d, i) => ({
            d,
            on: Boolean(mask & (1 << (6 - i))),
          })),
        };
      }),
    );
  }

  get spoken() {
    const { blank } = this.display;
    return blank ? undefined : this.runs.map((run) => run.text).join('');
  }

  get style() {
    const parts = [`--xz-readout-size: ${this.args.size ?? 44}px`];
    if (this.args.halo) parts.push(`--xz-timecode-halo: ${this.args.halo}`);
    return htmlSafe(parts.join('; '));
  }

  <template>
    <span
      class="xz-readout xz-timecode"
      style={{this.style}}
      role="timer"
      aria-label={{@label}}
      ...attributes
    >
      {{#if this.spoken}}
        <span class="xz-sr-only">{{this.spoken}}</span>
      {{/if}}
      <span class="xz-readout__digits" aria-hidden="true">
        {{#each this.chars as |char|}}
          {{#if char.narrow}}
            <svg
              class="xz-readout__char xz-readout__char--narrow
                {{if char.dim 'is-dim'}}"
              viewBox="0 0 4 20"
              aria-hidden="true"
              focusable="false"
            >
              {{#if char.colon}}
                <rect
                  class="xz-readout__seg is-on"
                  x="1"
                  y="5"
                  width="2"
                  height="2"
                />
                <rect
                  class="xz-readout__seg is-on"
                  x="1"
                  y="13"
                  width="2"
                  height="2"
                />
              {{else}}
                <rect
                  class="xz-readout__seg is-on"
                  x="1"
                  y="17.6"
                  width="2"
                  height="2"
                />
              {{/if}}
            </svg>
          {{else}}
            <svg
              class="xz-readout__char {{if char.dim 'is-dim'}}"
              viewBox="0 0 12 20"
              aria-hidden="true"
              focusable="false"
            >
              {{#each char.segments as |segment|}}
                <path
                  class="xz-readout__seg {{if segment.on 'is-on'}}"
                  d={{segment.d}}
                />
              {{/each}}
            </svg>
          {{/if}}
        {{/each}}
      </span>
    </span>
  </template>
}
