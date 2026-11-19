import type { TOC } from '@ember/component/template-only';
import { htmlSafe } from '@ember/template';
import { modifier } from 'ember-modifier';
import { compressionScale, formatBytes } from 'xsenze-tools/lib/xz/compression';
import { springEasing } from 'xsenze-tools/lib/xz/spring';
import XzLoader from './loader.gts';
import './compression-scale.css';

export interface XzCompressionScaleSignature {
  Args: {
    /** The original's size in bytes; 0 before a file. */
    before: number;
    /** The result's size in bytes; 0 before a result. */
    after: number;
    /** The result bar's label. */
    format: string;
    /** Shows the loader beside the figure. */
    working?: boolean;
  };
  Element: HTMLDivElement;
}

// the iOS bar spring: 0.6 s, damping 0.7
const springStyle = htmlSafe(`--xz-scale-easing: ${springEasing(0.7)}`);

const value = (share: number) =>
  htmlSafe(`--xz-value: ${Math.min(Math.max(share, 0), 1) * 100}%`);

const size = (bytes: number) => (bytes > 0 ? formatBytes(bytes) : '');

/** Room to spare around a label inside the fill, px. */
const labelSpare = 20;

/** The label sits inside the fill when it fits with room to spare, else after it. */
const place = modifier((bar: HTMLElement, [share]: [number, ...unknown[]]) => {
  const label = bar.querySelector<HTMLElement>('.xz-delta__label')!;
  const update = () =>
    bar.toggleAttribute(
      'data-inside',
      bar.clientWidth * Math.min(Math.max(share, 0), 1) >=
        label.offsetWidth + labelSpare,
    );
  update();
  const observer = new ResizeObserver(update);
  observer.observe(bar);
  return () => observer.disconnect();
});

const direction = (known: boolean, grew: boolean) =>
  known ? (grew ? 'xz-delta__change--up' : 'xz-delta__change--down') : '';

/** Two bars to one scale, the original's bytes over the result's, with the saving as a figure. */
const XzCompressionScale: TOC<XzCompressionScaleSignature> = <template>
  {{#let (compressionScale @before @after) as |scale|}}
    <div class="xz-delta xz-delta--scale" style={{springStyle}} ...attributes>
      <div class="xz-delta__top">
        {{#if @working}}
          <XzLoader class="xz-delta__loader" @cell={{5}} @gap={{1}} />
        {{/if}}
        <p
          class="xz-delta__change {{direction scale.known scale.grew}}"
        >{{scale.figure}}{{#if scale.unit}}<small
            >{{scale.unit}}</small>{{/if}}</p>
      </div>
      <div class="xz-delta__track" style={{value 1}} {{place 1 (size @before)}}>
        <div class="xz-delta__bar"></div>
        <span class="xz-delta__label">Original
          <strong>{{size @before}}</strong></span>
      </div>
      <div
        class="xz-delta__track xz-delta__track--after
          {{if scale.grew 'xz-delta__track--grew'}}"
        style={{value scale.share}}
        {{place scale.share (size @after) @format}}
      >
        <div class="xz-delta__bar"></div>
        <span class="xz-delta__label">{{@format}}
          <strong>{{if scale.known (size @after)}}</strong></span>
      </div>
    </div>
  {{/let}}
</template>;

export default XzCompressionScale;
