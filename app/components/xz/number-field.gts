import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { htmlSafe } from '@ember/template';
import XzStepper from 'xsenze-tools/components/xz/stepper';
import { Hold } from 'xsenze-tools/lib/xz/hold';
import { clamp, parseInteger } from 'xsenze-tools/lib/xz/number';

export interface XzNumberFieldSignature {
  Args: {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    /** Muted, after the number. */
    unit?: string;
    /** Id of the element that names the field, such as a row title. */
    labelledBy?: string;
    label?: string;
    disabled?: boolean;
    /** The field then shows `value`: a change the consumer does not take reverts when typing ends. Without it the field keeps its own. */
    onChange?: (value: number) => void;
  };
  Element: HTMLDivElement;
}

/** Integer with step buttons either side. Arrow keys step too. */
export default class XzNumberField extends Component<XzNumberFieldSignature> {
  hold = new Hold<number>();
  @tracked draft?: string;

  get min() {
    return this.args.min ?? 0;
  }

  get max() {
    return this.args.max ?? Number.MAX_SAFE_INTEGER;
  }

  get value(): number {
    const held = this.args.onChange
      ? undefined
      : this.hold.read(this.args.value);
    return clamp(held ?? this.args.value, this.min, this.max);
  }

  get text() {
    return this.draft ?? String(this.value);
  }

  get width() {
    return htmlSafe(
      `--xz-numfield-width: ${Math.max(3, this.text.length + 1)}ch`,
    );
  }

  get negative() {
    return this.min < 0;
  }

  commit(value: number) {
    if (value === this.value) return;
    this.hold.set(value);
    this.args.onChange?.(value);
  }

  nudge = (direction: -1 | 1) => {
    this.draft = undefined;
    this.commit(
      clamp(this.value + direction * (this.args.step ?? 1), this.min, this.max),
    );
  };

  typed = (event: Event) => {
    this.draft = (event.target as HTMLInputElement).value;
    const value = parseInteger(this.draft);
    if (value !== undefined && value >= this.min && value <= this.max)
      this.commit(value);
  };

  key = (event: KeyboardEvent) => {
    if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    this.nudge(event.key === 'ArrowUp' ? 1 : -1);
  };

  leave = () => {
    this.draft = undefined;
  };

  <template>
    <XzStepper
      class="xz-number-field"
      @onStep={{this.nudge}}
      @disabled={{@disabled}}
      ...attributes
    >
      {{! template-lint-disable require-input-label no-redundant-role }}
      <input
        type="text"
        class="xz-numfield__input"
        style={{this.width}}
        role="spinbutton"
        aria-valuenow={{this.value}}
        aria-valuemin={{this.min}}
        aria-valuemax={{this.max}}
        inputmode={{if this.negative "text" "numeric"}}
        enterkeyhint="done"
        aria-labelledby={{@labelledBy}}
        aria-label={{@label}}
        value={{this.text}}
        disabled={{@disabled}}
        {{on "input" this.typed}}
        {{on "keydown" this.key}}
        {{on "blur" this.leave}}
      />
      {{#if @unit}}<span class="xz-numfield__unit">{{@unit}}</span>{{/if}}
    </XzStepper>
  </template>
}
