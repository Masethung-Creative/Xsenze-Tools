import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { htmlSafe } from '@ember/template';
import XzStepper from 'xsenze-tools/components/xz/stepper';
import {
  formatDecimal,
  parseDecimal,
  roundDecimal,
} from 'xsenze-tools/lib/xz/number';

export interface XzDecimalFieldSignature {
  Args: {
    value: number;
    /** Default 0, or no lower bound when `signed`. */
    min?: number;
    max?: number;
    /** Default "s". */
    unit?: string;
    /** Default 0.1. */
    step?: number;
    /** Places kept; default 3. */
    decimals?: number;
    /** Gives a touch keyboard a minus key; the decimal pad has none. */
    signed?: boolean;
    labelledBy?: string;
    label?: string;
    disabled?: boolean;
    onChange?: (value: number) => void;
  };
  Element: HTMLDivElement;
}

/** Typing commits after this pause, or when the field loses focus. */
export const typingPauseMs = 600;

/** A decimal number with step buttons and a unit; seconds by default. */
export default class XzDecimalField extends Component<XzDecimalFieldSignature> {
  @tracked held?: { value: number; over: number };
  @tracked draft?: string;
  #typing?: number;

  get decimals() {
    return this.args.decimals ?? 3;
  }

  get unit() {
    return this.args.unit ?? 's';
  }

  get min() {
    return this.args.min ?? (this.args.signed ? -Infinity : 0);
  }

  get max() {
    return this.args.max ?? Infinity;
  }

  get value(): number {
    const { held } = this;
    return held && held.over === this.args.value ? held.value : this.args.value;
  }

  get text() {
    return this.draft ?? formatDecimal(this.value, this.decimals);
  }

  get width() {
    return htmlSafe(
      `--xz-numfield-width: ${Math.max(3, this.text.length + 1)}ch`,
    );
  }

  apply(raw: number) {
    const next = roundDecimal(raw, this.decimals, this.min, this.max);
    if (next === this.value) return;
    this.held = { value: next, over: this.args.value };
    this.args.onChange?.(next);
  }

  step = (direction: -1 | 1) => {
    this.draft = undefined;
    this.apply(this.value + direction * (this.args.step ?? 0.1));
  };

  commit() {
    window.clearTimeout(this.#typing);
    const typed =
      this.draft === undefined ? undefined : parseDecimal(this.draft);
    if (typed !== undefined) this.apply(typed);
  }

  typed = (event: Event) => {
    this.draft = (event.target as HTMLInputElement).value;
    window.clearTimeout(this.#typing);
    this.#typing = window.setTimeout(() => this.commit(), typingPauseMs);
  };

  key = (event: KeyboardEvent) => {
    if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    this.commit();
    this.step(event.key === 'ArrowUp' ? 1 : -1);
  };

  leave = () => {
    this.commit();
    this.draft = undefined;
  };

  willDestroy() {
    super.willDestroy();
    window.clearTimeout(this.#typing);
  }

  <template>
    <XzStepper
      class="xz-decimal-field"
      @onStep={{this.step}}
      @disabled={{@disabled}}
      ...attributes
    >
      {{! template-lint-disable require-input-label no-redundant-role }}
      <input
        type="text"
        class="xz-numfield__input xz-decimal-field__input"
        style={{this.width}}
        role="spinbutton"
        aria-valuenow={{this.value}}
        aria-valuetext="{{this.text}} {{this.unit}}"
        inputmode={{if @signed "text" "decimal"}}
        enterkeyhint="done"
        aria-labelledby={{@labelledBy}}
        aria-label={{@label}}
        value={{this.text}}
        disabled={{@disabled}}
        {{on "input" this.typed}}
        {{on "keydown" this.key}}
        {{on "blur" this.leave}}
      />
      <span class="xz-numfield__unit">{{this.unit}}</span>
    </XzStepper>
  </template>
}
