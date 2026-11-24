import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import type Owner from '@ember/owner';
import type XzToastService from 'xsenze-tools/services/xz-toast';
import XzButton from 'xsenze-tools/components/xz/button';
import XzCanvas from 'xsenze-tools/components/xz/canvas';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzMenuCell from 'xsenze-tools/components/xz/menu-cell';
import XzRow from 'xsenze-tools/components/xz/row';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSegmented from 'xsenze-tools/components/xz/segmented';
import XzSplit from 'xsenze-tools/components/xz/split';
import XzStatus from 'xsenze-tools/components/xz/status';
import XzTiles from 'xsenze-tools/components/xz/tiles';
import { IconSvg } from 'xsenze-tools/components/icon';
import TimecodeField from 'xsenze-tools/components/tools/video/timecode-calc/field';
import Picture from 'xsenze-tools/components/tools/video/timecode-calc/picture';
import {
  blank,
  clock,
  digitsOf,
  format,
  parse,
  parts,
  rates,
  register,
  seconds,
  type ParseResult,
  type Rate,
} from 'xsenze-tools/components/tools/video/timecode-calc/smpte';
import './timecode-calc/timecode-calc.css';

const rateLabels = rates.map((rate) => rate.label);
const operations = ['+', '−'];
const dash = '—';
const defaultRate = 4;

const CopyIcon = <template><IconSvg @name="copy" /></template>;

function note(parsed: ParseResult, rate: Rate) {
  if (parsed.ok)
    return parsed.snappedFrom
      ? {
          tone: 'muted' as const,
          text: `Dropped frame · ${parsed.snappedFrom} → ${format(parsed.parts, rate)}`,
        }
      : undefined;
  const { error } = parsed;
  const text = {
    empty: undefined,
    'not-numeric': 'Numbers only',
    'too-many': 'Too many fields',
    'frame-range': `Frame too high · 00–${String(error.kind === 'frame-range' ? error.max : 0).padStart(2, '0')}`,
    'seconds-range': 'Seconds too high',
    'minutes-range': 'Minutes too high',
  }[error.kind];
  return text ? { tone: 'warn' as const, text } : undefined;
}

/** The port of TimecodeCalcViewController. */
export default class TimecodeCalc extends Component {
  @service('xz-toast') declare toast: XzToastService;

  @tracked rateIndex = defaultRate;
  @tracked subtracts = false;
  @tracked a = '';
  @tracked b = '';
  /** The fields' starting text; the fields own what is typed after. */
  startA = '';
  startB = '';

  // ?tcA=01:00:00;00 ?tcB=00:10:00;02 ?tcSubtract ?tcRate=29.97df: preset the tool from the URL
  constructor(owner: Owner, args: object) {
    super(owner, args);
    const query = new URLSearchParams(window.location.search);
    const picked = rates.findIndex((rate) => rate.id === query.get('tcRate'));
    if (picked >= 0) this.rateIndex = picked;
    const { drop } = this.rate;
    this.startA = this.a = register(digitsOf(query.get('tcA') ?? ''), drop);
    this.startB = this.b = register(digitsOf(query.get('tcB') ?? ''), drop);
    this.subtracts = query.has('tcSubtract');
  }

  get rate() {
    return rates[this.rateIndex]!;
  }

  get parsedA() {
    return parse(this.a, this.rate);
  }

  get parsedB() {
    return parse(this.b, this.rate);
  }

  /** A alone gives A, B alone gives nothing. */
  get frames(): number | undefined {
    const { parsedA: a, parsedB: b } = this;
    if (!a.ok) return undefined;
    if (!b.ok) return a.frames;
    return this.subtracts ? a.frames - b.frames : a.frames + b.frames;
  }

  get result() {
    const { frames } = this;
    return frames === undefined
      ? undefined
      : format(parts(frames, this.rate), this.rate);
  }

  line(parsed: ParseResult) {
    return parsed.ok ? format(parsed.parts, this.rate) : blank(this.rate);
  }

  get lineA() {
    return this.line(this.parsedA);
  }

  get lineB() {
    return this.line(this.parsedB);
  }

  get lineResult() {
    return this.result ?? blank(this.rate);
  }

  get noteA() {
    return note(this.parsedA, this.rate);
  }

  get noteB() {
    return note(this.parsedB, this.rate);
  }

  get copyDisabled() {
    return this.result === undefined;
  }

  get tiles() {
    const { frames } = this;
    return [
      {
        label: 'Frames',
        value: frames === undefined ? dash : frames.toLocaleString('en'),
      },
      {
        label: 'Real time',
        value: frames === undefined ? dash : clock(seconds(frames, this.rate)),
      },
    ];
  }

  // wait 400 ms after typing rather than answering every keystroke
  typeA = (text: string) => (this.a = text);
  typeB = (text: string) => (this.b = text);

  pickRate = (index: number) => (this.rateIndex = index);

  pickOperation = (index: number) => (this.subtracts = index === 1);

  copyResult = () => {
    if (this.result) void this.toast.copy(this.result);
  };

  <template>
    <XzSplit class="timecode-calc">
      <:banner>
        <XzCanvas @fitting={{true}}>
          <Picture
            @a={{this.lineA}}
            @b={{this.lineB}}
            @subtracts={{this.subtracts}}
            @result={{this.lineResult}}
          />
        </XzCanvas>
      </:banner>
      <:sidebar>
        <XzRows @framed={{true}}>
          <XzHeading @text="Timecode A" />
          <TimecodeField
            @value={{this.startA}}
            @dropFrame={{this.rate.drop}}
            @label="Timecode A"
            @onChange={{this.typeA}}
          />
          {{#if this.noteA}}
            <XzStatus
              class="tcc-note"
              @text={{this.noteA.text}}
              @tone={{this.noteA.tone}}
              @row={{true}}
            />
          {{/if}}
          <XzHeading @text="Operation" />
          <XzSegmented
            aria-label="Operation"
            @items={{operations}}
            @selected={{if this.subtracts 1 0}}
            @onChange={{this.pickOperation}}
          />
          <XzHeading @text="Timecode B" />
          <TimecodeField
            @value={{this.startB}}
            @dropFrame={{this.rate.drop}}
            @label="Timecode B"
            @onChange={{this.typeB}}
          />
          {{#if this.noteB}}
            <XzStatus
              class="tcc-note"
              @text={{this.noteB.text}}
              @tone={{this.noteB.tone}}
              @row={{true}}
            />
          {{/if}}
        </XzRows>
        <XzRows @framed={{true}}>
          <XzHeading @text="Frame rate" />
          <XzRow @title="Frame rate" @form="flush" as |titleId|>
            <XzMenuCell
              @items={{rateLabels}}
              @selected={{this.rateIndex}}
              @labelledBy={{titleId}}
              @onChange={{this.pickRate}}
            />
          </XzRow>
        </XzRows>
      </:sidebar>
      <:main>
        <XzRows @framed={{true}}>
          <XzHeading @text="Result" />
          <XzTiles @items={{this.tiles}} />
          <XzButton
            @text="Copy"
            @icon={{CopyIcon}}
            @iconStyle="oversized"
            @kind="primary"
            @disabled={{this.copyDisabled}}
            @onClick={{this.copyResult}}
          />
        </XzRows>
      </:main>
    </XzSplit>
  </template>
}
