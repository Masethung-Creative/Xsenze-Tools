import type { TOC } from '@ember/component/template-only';
import { htmlSafe } from '@ember/template';
import { modifier } from 'ember-modifier';
import { changedFromEnd, leadingNumber } from 'xsenze-tools/lib/xz/figure';
import './figure.css';

export interface XzFigureSignature {
  Args: {
    text: string;
    /** Set smaller after the figure. */
    unit?: string;
    /** Font size in px; default 40. */
    size?: number;
    /** CSS colour; default the accent colour. A change fades. */
    colour?: string;
    /** Outline and soft shadow in this CSS colour, for a figure over a picture. */
    halo?: string;
    /** False shows a new text without rolling. */
    animated?: boolean;
  };
  Element: HTMLDivElement;
}

const rollMs = 350;
const previous = new WeakMap<HTMLElement, string>();

function still() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Rebuilds the characters; changed ones roll in the direction the number moved. */
const roll = modifier(
  (element: HTMLElement, [text, animated]: [string, boolean]) => {
    const before = previous.get(element);
    previous.set(element, text);
    element.replaceChildren(
      ...[...text].map((char) => {
        const span = document.createElement('span');
        span.className = 'xz-figure__char';
        span.textContent = char;
        return span;
      }),
    );
    if (
      before === undefined ||
      before === text ||
      !animated ||
      still() ||
      document.documentElement.dataset['xzMotion'] === 'off'
    )
      return;
    // up rolls new characters in from below
    const up = leadingNumber(text) >= leadingNumber(before) ? 1 : -1;
    const spans = [...element.children] as HTMLElement[];
    for (const { index, old } of changedFromEnd(before, text)) {
      const span = spans[index]!;
      span.animate(
        [
          {
            transform: `translateY(${up * 60}%)`,
            opacity: 0,
            filter: 'blur(2px)',
          },
          { transform: 'none', opacity: 1, filter: 'none' },
        ],
        { duration: rollMs, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' },
      );
      if (old === undefined) continue;
      const ghost = document.createElement('span');
      ghost.className = 'xz-figure__ghost';
      ghost.textContent = old;
      span.append(ghost);
      ghost
        .animate(
          [
            { transform: 'none', opacity: 1, filter: 'none' },
            {
              transform: `translateY(${-up * 60}%)`,
              opacity: 0,
              filter: 'blur(2px)',
            },
          ],
          {
            duration: rollMs,
            easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
            fill: 'forwards',
          },
        )
        .finished.then(
          () => ghost.remove(),
          () => ghost.remove(),
        );
    }
  },
);

function style(size = 40, colour?: string, halo?: string) {
  const parts = [`--xz-figure-size: ${size}px`];
  if (colour) parts.push(`--xz-figure-colour: ${colour}`);
  if (halo) {
    const edge = `0 0 1px ${halo}`;
    parts.push(
      `text-shadow: ${edge}, ${edge}, ${edge}, ${edge}, 0 3px 5px ${halo}`,
    );
  }
  return htmlSafe(parts.join('; '));
}

function isAnimated(animated: boolean | undefined) {
  return animated !== false;
}

/** A calculated figure whose changed characters roll. */
const XzFigure: TOC<XzFigureSignature> = <template>
  <div class="xz-figure" style={{style @size @colour @halo}} ...attributes>
    <span class="xz-figure__said">{{@text}}{{@unit}}</span>
    <span
      class="xz-figure__text"
      aria-hidden="true"
      {{roll @text (isAnimated @animated)}}
    ></span>
    {{#if @unit}}
      <span class="xz-figure__unit" aria-hidden="true">{{@unit}}</span>
    {{/if}}
  </div>
</template>;

export default XzFigure;
