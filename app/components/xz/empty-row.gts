import type { TOC } from '@ember/component/template-only';

export interface XzEmptyRowSignature {
  Args: { text: string };
  Element: HTMLDivElement;
}

const XzEmptyRow: TOC<XzEmptyRowSignature> = <template>
  <div class="xz-panel__empty" ...attributes>{{@text}}</div>
</template>;

export default XzEmptyRow;
