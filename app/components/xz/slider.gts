import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { htmlSafe } from '@ember/template';
import { modifier } from 'ember-modifier';
import { Hold } from 'xsenze-tools/lib/xz/hold';
import { clamp, dragSpeed, snap } from 'xsenze-tools/lib/xz/number';
import { capture } from 'xsenze-tools/lib/xz/motion';
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

  /**
   * The pointer is handled here rather than by the range input: a tap sets
   * the value, and a sideways drag moves it relative to where it was, finer
   * the further the pointer is pulled from the bar (template-lint forbids
   * binding pointerdown in the template).
   */
  track = modifier((field: HTMLInputElement) => {
    const cell = field.parentElement ?? field;
    let pointer: number | undefined;
    let start = { x: 0, y: 0 };
    let lastX = 0;
    let dragged = 0;
    // the input's own direction says which way it fills (a trailing fill is rtl)
    const backwards = () => getComputedStyle(field).direction === 'rtl';
    const position = (x: number) => {
      const box = field.getBoundingClientRect();
      if (box.width <= 0) return undefined;
      const unit = clamp((x - box.left) / box.width, 0, 1);
      return this.min + (backwards() ? 1 - unit : unit) * this.span;
    };
    const show = () => (field.value = String(this.value));

    const down = (event: PointerEvent) => {
      if (event.button !== 0 || field.disabled) return;
      // the input would jump to the pointer and drag absolutely
      event.preventDefault();
      field.focus({ preventScroll: true });
      pointer = event.pointerId;
      start = { x: event.clientX, y: event.clientY };
      this.dragging = false;
      capture(field, pointer);
      cell.dataset['active'] = '';
    };
    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      if (!this.dragging) {
        const dx = Math.abs(event.clientX - start.x);
        const at = position(event.clientX);
        if (
          dx <= 4 ||
          dx <= Math.abs(event.clientY - start.y) ||
          at === undefined
        )
          return;
        // absolute first, then relative
        this.dragging = true;
        dragged = at;
        lastX = event.clientX;
        this.apply(dragged, true);
        show();
        return;
      }
      const box = field.getBoundingClientRect();
      const speed = dragSpeed(
        Math.abs(event.clientY - (box.top + box.height / 2)),
      );
      const delta =
        ((event.clientX - lastX) / Math.max(1, box.width)) * this.span * speed;
      lastX = event.clientX;
      dragged = clamp(
        dragged + (backwards() ? -delta : delta),
        this.min,
        this.max,
      );
      this.apply(dragged, true);
      show();
    };
    const end = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      if (event.type === 'pointerup' && !this.dragging) {
        const box = field.getBoundingClientRect();
        const inside =
          event.clientX >= box.left &&
          event.clientX <= box.right &&
          event.clientY >= box.top - 8 &&
          event.clientY <= box.bottom + 8;
        const at = position(event.clientX);
        if (inside && at !== undefined) this.apply(at, false);
        show();
      }
      pointer = undefined;
      this.dragging = false;
      delete cell.dataset['active'];
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
