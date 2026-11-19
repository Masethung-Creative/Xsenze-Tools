import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { htmlSafe } from '@ember/template';
import { modifier } from 'ember-modifier';
import { Hold } from 'xsenze-tools/lib/xz/hold';
import { clamp, snap } from 'xsenze-tools/lib/xz/number';
import './slider.css';

export interface XzSliderSignature {
  Args: {
    value: number;
    /** Default 0. A new range clamps the value without calling onChange. */
    min?: number;
    /** Default 1. */
    max?: number;
    /** Snaps the value to multiples of this above `min`. */
    step?: number;
    /** Text of the readout cell; default a percentage of 0 to 1. */
    readout?: (value: number) => string;
    /** Fills from the trailing edge towards the leading one: for amounts that count back from an end. */
    fillsFromTrailing?: boolean;
    labelledBy?: string;
    label?: string;
    /** `dragging` is true for a sideways drag, false for a tap or a key. */
    onChange?: (value: number, dragging: boolean) => void;
  };
  Element: HTMLDivElement;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

/**
 * The kit's fader (`xz-slider--fader`, a native range input) with its value
 * beside it. A tap sets the value; a sideways drag moves it.
 */
export default class XzSlider extends Component<XzSliderSignature> {
  hold = new Hold<number>();
  @tracked dragging = false;

  get min() {
    return this.args.min ?? 0;
  }

  get max() {
    return this.args.max ?? 1;
  }

  get span() {
    return this.max - this.min;
  }

  get value(): number {
    const value = this.hold.read(this.args.value) ?? this.args.value;
    return clamp(value, this.min, this.max);
  }

  get readout() {
    return (this.args.readout ?? percent)(this.value);
  }

  get step() {
    return this.args.step && this.args.step > 0 ? this.args.step : 'any';
  }

  get style() {
    const fraction = this.span > 0 ? (this.value - this.min) / this.span : 0;
    return htmlSafe(`--_fill: ${fraction * 100}%`);
  }

  apply(raw: number, dragging: boolean) {
    const next = snap(raw, this.min, this.max, this.args.step);
    if (next === this.value) return;
    this.hold.set(next);
    this.args.onChange?.(next, dragging);
  }

  key = (event: KeyboardEvent) => {
    const step = this.args.step ?? this.span / 20;
    const next = {
      ArrowRight: this.value + step,
      ArrowUp: this.value + step,
      ArrowLeft: this.value - step,
      ArrowDown: this.value - step,
      Home: this.min,
      End: this.max,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    this.apply(next, false);
    (event.target as HTMLInputElement).value = String(this.value);
  };

  input = (event: Event) => {
    const field = event.target as HTMLInputElement;
    this.apply(Number(field.value), this.dragging);
    field.value = String(this.value);
  };

  // template-lint forbids binding pointerdown: a sideways drag is told from a tap here
  track = modifier((field: HTMLInputElement) => {
    let start: { x: number; y: number } | undefined;
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      start = { x: event.clientX, y: event.clientY };
      this.dragging = false;
    };
    const move = (event: PointerEvent) => {
      if (!start || this.dragging) return;
      const dx = Math.abs(event.clientX - start.x);
      const dy = Math.abs(event.clientY - start.y);
      if (dx > 4 && dx > dy) this.dragging = true;
    };
    const end = () => {
      start = undefined;
      this.dragging = false;
    };
    field.addEventListener('pointerdown', down);
    field.addEventListener('pointermove', move);
    field.addEventListener('pointerup', end);
    field.addEventListener('pointercancel', end);
    return () => {
      field.removeEventListener('pointerdown', down);
      field.removeEventListener('pointermove', move);
      field.removeEventListener('pointerup', end);
      field.removeEventListener('pointercancel', end);
    };
  });

  <template>
    <div
      class="xz-slider-cell
        {{if @fillsFromTrailing 'xz-slider-cell--trailing'}}"
      dir={{if @fillsFromTrailing "rtl"}}
      ...attributes
    >
      {{! callers pass either @labelledBy or @label, never both }}
      {{! template-lint-disable require-input-label }}
      <input
        type="range"
        class="xz-slider xz-slider--fader"
        min={{this.min}}
        max={{this.max}}
        step={{this.step}}
        value={{this.value}}
        style={{this.style}}
        aria-labelledby={{@labelledBy}}
        aria-label={{@label}}
        aria-valuetext={{this.readout}}
        {{on "input" this.input}}
        {{on "keydown" this.key}}
        {{this.track}}
      />
      <output
        class="xz-panel__value xz-slider-cell__readout"
        dir="ltr"
        aria-hidden="true"
      >{{this.readout}}</output>
    </div>
  </template>
}
