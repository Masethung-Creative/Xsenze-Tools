import type { TOC } from '@ember/component/template-only';
import './rows.css';

export interface XzRowsSignature {
  Args: {
    /** Draws the tool frame (a padded rule) around the rows. */
    framed?: boolean;
  };
  Blocks: { default: [] };
  Element: HTMLDivElement;
}

/** Rows separated by hairlines: a kit panel. */
const XzRows: TOC<XzRowsSignature> = <template>
  <div
    class="xz-panel {{if @framed 'xz-panel--framed'}}"
    ...attributes
  >{{yield}}</div>
</template>;

export default XzRows;
