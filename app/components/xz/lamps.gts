import type { TOC } from '@ember/component/template-only';
import { modifier } from 'ember-modifier';
import { IconSvg } from 'xsenze-tools/components/icon';
import './lamps.css';

export type XzLamp = 'play' | 'pause' | 'loop' | 'record';

export interface XzLampsSignature {
  Args: {
    /** Which lamps; every one is always present. Default play, pause, loop. */
    lamps?: readonly XzLamp[];
    lit?: readonly XzLamp[];
    /** A count per lamp; each change turns that lamp off for a split second. */
    flashes?: Partial<Record<XzLamp, number>>;
  };
  Element: HTMLSpanElement;
}

export const transportLamps: XzLamp[] = ['play', 'pause', 'loop'];

/** Milliseconds a lamp stays unlit when it blinks. */
export const lampBlinkMs = 120;

const blink = modifier(
  (element: HTMLElement, [count]: [number | undefined]) => {
    const last = element.dataset['flashes'];
    element.dataset['flashes'] = String(count ?? 0);
    if (last === undefined || last === String(count ?? 0)) return;
    element.classList.add('xz-lamp--blink');
    const timer = window.setTimeout(
      () => element.classList.remove('xz-lamp--blink'),
      lampBlinkMs,
    );
    return () => window.clearTimeout(timer);
  },
);

const iconNames: Record<XzLamp, string> = {
  play: 'play',
  pause: 'pause',
  loop: 'repeat',
  record: 'circle-dot',
};

// the kit's tones: record lights red, the rest in the orange highlight
const tones: Record<XzLamp, string> = {
  play: 'xz-lamp--accent',
  pause: 'xz-lamp--accent',
  loop: 'xz-lamp--accent',
  record: 'xz-lamp--danger',
};

function has(list: readonly XzLamp[] | undefined, lamp: XzLamp) {
  return list?.includes(lamp) ?? false;
}

function icon(lamp: XzLamp) {
  return iconNames[lamp];
}

function tone(lamp: XzLamp) {
  return tones[lamp];
}

function count(flashes: XzLampsSignature['Args']['flashes'], lamp: XzLamp) {
  return flashes?.[lamp];
}

/** Transport lamps: every icon is always present, lit while its state holds. Record lights red. */
const XzLamps: TOC<XzLampsSignature> = <template>
  <span class="xz-lamps xz-lamps--bare" aria-hidden="true" ...attributes>
    {{#each (if @lamps @lamps transportLamps) as |lamp|}}
      <span
        class="xz-lamp
          {{tone lamp}}
          xz-lamps__lamp--{{lamp}}
          {{if (has @lit lamp) 'is-on'}}"
        {{blink (count @flashes lamp)}}
      ><IconSvg @name={{icon lamp}} /></span>
    {{/each}}
  </span>
</template>;

export default XzLamps;
