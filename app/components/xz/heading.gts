import type { TOC } from '@ember/component/template-only';

export interface XzHeadingSignature {
  Args: { text: string };
  Element: HTMLHeadingElement;
}

const XzHeading: TOC<XzHeadingSignature> = <template>
  <h3 class="xz-panel__label" ...attributes>{{@text}}</h3>
</template>;

export default XzHeading;
