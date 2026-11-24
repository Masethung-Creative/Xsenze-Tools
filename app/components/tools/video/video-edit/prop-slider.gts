import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { guidFor } from '@ember/object/internals';
import { IconSvg } from 'xsenze-tools/components/icon';
import XzSlider from 'xsenze-tools/components/xz/slider';
import XzSwitch from 'xsenze-tools/components/xz/switch';
import './prop-slider.css';

interface PropSliderSignature {
  Args: {
    label: string;
    value: number;
    min?: number;
    max?: number;
    /** The slider's snap. */
    step?: number;
    /** How far one click on − or + moves the value. */
    nudge: number;
    readout?: (value: number) => string;
    onChange: (value: number, dragging: boolean) => void;
    /** Shows an on/off switch beside the name. */
    on?: boolean;
    onToggle?: (on: boolean) => void;
    /** What the switch turns on, for screen readers; default the label. */
    toggleLabel?: string;
  };
  Element: HTMLDivElement;
}

/**
 * One adjustable property: its name with an optional on/off switch, and
 * under them − , the slider with its value, and + for steps by click.
 */
export default class PropSlider extends Component<PropSliderSignature> {
  id = guidFor(this);

  get min() {
    return this.args.min ?? 0;
  }

  get max() {
    return this.args.max ?? 1;
  }

  get atMin() {
    return this.args.value <= this.min + 1e-9;
  }

  get atMax() {
    return this.args.value >= this.max - 1e-9;
  }

  get hasToggle() {
    return this.args.onToggle !== undefined;
  }

  #by(direction: number) {
    const next = this.args.value + direction * this.args.nudge;
    // whole steps, without float drift
    const rounded = Math.round(next / this.args.nudge) * this.args.nudge;
    this.args.onChange(
      Math.min(this.max, Math.max(this.min, Number(rounded.toFixed(6)))),
      false,
    );
  }

  less = () => this.#by(-1);
  more = () => this.#by(1);

  toggle = (on: boolean) => this.args.onToggle?.(on);

  <template>
    <div class="ve-prop" ...attributes>
      <div class="ve-prop__head">
        <span class="ve-prop__name" id="{{this.id}}-name">{{@label}}</span>
        {{#if this.hasToggle}}
          <XzSwitch
            class="ve-prop__switch"
            @on={{@on}}
            @onChange={{this.toggle}}
            aria-label={{if @toggleLabel @toggleLabel @label}}
          />
        {{/if}}
      </div>
      <div class="ve-prop__control">
        <button
          type="button"
          class="xz-btn xz-btn--icon xz-btn--sm ve-prop__step ve-prop__less"
          aria-label="Less {{@label}}"
          disabled={{this.atMin}}
          {{on "click" this.less}}
        ><IconSvg @name="minus" /></button>
        <XzSlider
          @value={{@value}}
          @min={{this.min}}
          @max={{this.max}}
          @step={{@step}}
          @readout={{@readout}}
          @labelledBy="{{this.id}}-name"
          @onChange={{@onChange}}
        />
        <button
          type="button"
          class="xz-btn xz-btn--icon xz-btn--sm ve-prop__step ve-prop__more"
          aria-label="More {{@label}}"
          disabled={{this.atMax}}
          {{on "click" this.more}}
        ><IconSvg @name="plus" /></button>
      </div>
    </div>
  </template>
}
