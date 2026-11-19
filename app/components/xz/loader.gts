import type { TOC } from '@ember/component/template-only';
import { htmlSafe } from '@ember/template';

export type XzLoaderMode = 'snake' | 'comet' | 'dot' | 'twin' | 'thinking';

export interface XzLoaderSignature {
  Args: {
    /** Default snake. thinking pulses out from the centre. */
    mode?: XzLoaderMode;
    /** Runs anticlockwise; thinking ignores it. */
    reverse?: boolean;
    /** Cell side in px; default 8. */
    cell?: number;
    /** Gap between cells in px; default 2. */
    gap?: number;
  };
  Element: HTMLDivElement;
}

function style(cell = 8, gap = 2) {
  return htmlSafe(`--xz-loader-cell: ${cell}px; gap: ${gap}px`);
}

function modeClass(mode?: XzLoaderMode) {
  if (mode === 'thinking') return 'xz-loader--pulse';
  if (mode === 'comet' || mode === 'dot' || mode === 'twin') {
    return `xz-loader--${mode}`;
  }
  return '';
}

/** 3 x 3 cell loader in the current colour: a lit head runs round the eight outer cells. */
const XzLoader: TOC<XzLoaderSignature> = <template>
  <div
    class="xz-loader {{modeClass @mode}} {{if @reverse 'xz-loader--reverse'}}"
    role="status"
    aria-label="Loading"
    style={{style @cell @gap}}
    ...attributes
  >
    <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
  </div>
</template>;

export default XzLoader;
