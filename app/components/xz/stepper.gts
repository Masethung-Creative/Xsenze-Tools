import type { TOC } from '@ember/component/template-only';
import repeat from 'xsenze-tools/modifiers/xz/repeat';

export interface XzStepperSignature {
  Args: {
    /** Called with -1 or 1; repeats while a button is held. */
    onStep: (direction: -1 | 1) => void;
    disabled?: boolean;
  };
  /** The middle cell, usually a field and its unit. A click anywhere in it focuses the field. */
  Blocks: { default: [] };
  Element: HTMLDivElement;
}

// one function per (step handler, direction), so the modifier is not rebuilt on every render
const made = new WeakMap<
  (direction: -1 | 1) => void,
  Record<string, () => void>
>();
function stepBy(onStep: (direction: -1 | 1) => void, direction: -1 | 1) {
  let byDirection = made.get(onStep);
  if (!byDirection) {
    byDirection = {};
    made.set(onStep, byDirection);
  }
  return (byDirection[String(direction)] ??= () => onStep(direction));
}

/** Minus and plus cells either side of a field's cell: the kit's `xz-stepper xz-numfield`. */
const XzStepper: TOC<XzStepperSignature> = <template>
  <div class="xz-stepper xz-numfield" ...attributes>
    <button
      type="button"
      class="xz-stepper__btn"
      aria-label="Decrease"
      disabled={{@disabled}}
      {{repeat (stepBy @onStep -1) true}}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      ><path d="M5 12h14" /></svg>
    </button>
    {{! template-lint-disable require-input-label }}
    <label class="xz-numfield__box">{{yield}}</label>
    <button
      type="button"
      class="xz-stepper__btn"
      aria-label="Increase"
      disabled={{@disabled}}
      {{repeat (stepBy @onStep 1) true}}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      ><path d="M5 12h14M12 5v14" /></svg>
    </button>
  </div>
</template>;

export default XzStepper;
