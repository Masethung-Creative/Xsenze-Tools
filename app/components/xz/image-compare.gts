import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { htmlSafe } from '@ember/template';
import { compareSpring, springEasing } from 'xsenze-tools/lib/xz/spring';
import sidewaysPan from 'xsenze-tools/modifiers/xz/sideways-pan';
import './image-compare.css';

export interface XzImageCompareSignature {
  Args: {
    /** URL of the original. */
    before?: string;
    /** URL of the result. */
    after?: string;
    /** The result could not be made: the original dims and `failure` shows. */
    failed?: boolean;
    /** Shown over the original when `failed`. */
    failure?: string;
    beforeTitle?: string;
    afterTitle?: string;
  };
  Element: HTMLElement;
}

const tapEasing = springEasing(compareSpring.damping);
const nudge = 0.1;

// the kit's grip, as its before-and-after script draws it
const Grip = <template>
  <svg
    class="xz-icon xz-icon--sm"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  ><path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path
      d="M20 17H4"
    /></svg>
</template>;

/**
 * One picture, the original on the leading side of a draggable divider and
 * the result on the other; a tap moves the divider. To assistive technology
 * it is a slider.
 */
export default class XzImageCompare extends Component<XzImageCompareSignature> {
  /** Share of the width that shows the original. */
  @tracked split = 0.5;
  @tracked springs = false;
  @tracked dragging = false;
  #dragged = false;

  get comparing() {
    return Boolean(this.args.before && this.args.after);
  }

  get beforeTitle() {
    return this.args.beforeTitle ?? 'Before';
  }

  get afterTitle() {
    return this.args.afterTitle ?? 'After';
  }

  get percent() {
    return Math.round(this.split * 100);
  }

  get valueText() {
    return `${this.percent}% ${this.beforeTitle.toLowerCase()}, ${100 - this.percent}% ${this.afterTitle.toLowerCase()}`;
  }

  get style() {
    const parts = [`--xz-pos: ${this.split * 100}%`];
    if (this.springs)
      parts.push(`--xz-compare-transition: ${compareSpring.ms}ms ${tapEasing}`);
    return htmlSafe(parts.join('; '));
  }

  move(element: HTMLElement, clientX: number, springs: boolean) {
    const box = element.getBoundingClientRect();
    if (box.width <= 0 || !this.comparing) return;
    let share = (clientX - box.left) / box.width;
    if (getComputedStyle(element).direction === 'rtl') share = 1 - share;
    this.springs =
      springs && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.split = Math.min(Math.max(share, 0), 1);
  }

  onBegin = () => {
    this.#dragged = true;
    this.dragging = true;
  };

  onMove = (event: PointerEvent) => {
    this.move(event.currentTarget as HTMLElement, event.clientX, false);
  };

  onEnd = () => {
    this.dragging = false;
  };

  onClick = (event: MouseEvent) => {
    if (this.#dragged) {
      this.#dragged = false;
      return;
    }
    this.move(event.currentTarget as HTMLElement, event.clientX, true);
  };

  onKey = (event: KeyboardEvent) => {
    if (!this.comparing) return;
    const element = event.currentTarget as HTMLElement;
    const sign =
      getComputedStyle(element.closest('figure') ?? element).direction === 'rtl'
        ? -1
        : 1;
    const steps: Record<string, number> = {
      ArrowRight: nudge * sign,
      ArrowLeft: -nudge * sign,
      ArrowUp: nudge,
      ArrowDown: -nudge,
      Home: -1,
      End: 1,
    };
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    this.springs = false;
    this.split = Math.min(Math.max(this.split + step, 0), 1);
  };

  <template>
    {{! template-lint-disable no-invalid-interactive }}
    <figure
      class="xz-beforeafter xz-compare
        {{if this.comparing 'xz-compare--comparing'}}
        {{if this.dragging 'is-dragging'}}
        {{if @failed 'xz-compare--failed'}}"
      data-xz-beforeafter-ready
      style={{this.style}}
      {{sidewaysPan onBegin=this.onBegin onMove=this.onMove onEnd=this.onEnd}}
      {{on "click" this.onClick}}
      ...attributes
    >
      {{#if @before}}
        <img
          class="xz-beforeafter__before"
          src={{@before}}
          alt=""
          draggable="false"
        />
      {{/if}}
      {{#if this.comparing}}
        <img
          class="xz-beforeafter__after"
          src={{@after}}
          alt=""
          draggable="false"
        />
        <input
          class="xz-beforeafter__range"
          type="range"
          min="0"
          max="100"
          step="1"
          value={{this.percent}}
          aria-label="{{this.beforeTitle}}, {{this.afterTitle}}"
          aria-valuetext={{this.valueText}}
          {{on "keydown" this.onKey}}
        />
        <span class="xz-beforeafter__line" aria-hidden="true"><span
            class="xz-beforeafter__knob"
          ><Grip /></span></span>
        <span
          class="xz-beforeafter__tag xz-beforeafter__tag--before"
          aria-hidden="true"
        >{{this.beforeTitle}}</span>
        <span
          class="xz-beforeafter__tag xz-beforeafter__tag--after"
          aria-hidden="true"
        >{{this.afterTitle}}</span>
      {{/if}}
      {{#if @failed}}
        <p class="xz-compare__failure" role="status">{{@failure}}</p>
      {{/if}}
    </figure>
  </template>
}
