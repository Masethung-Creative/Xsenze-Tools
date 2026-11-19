import type { TOC } from '@ember/component/template-only';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzRows from 'xsenze-tools/components/xz/rows';
import AtlasOpenIn from 'xsenze-tools/components/atlas-open-in';
import type { Tool } from 'xsenze-tools/lib/tools';
import './open-in.css';

/** An atlas's Open in section: the tools that take the file, or a fixed list, as a grid of kit cells. */
const OpenIn: TOC<{
  Args: {
    file?: File | null;
    self?: string;
    tools?: Pick<Tool, 'id' | 'name' | 'icon'>[];
  };
  Element: HTMLDivElement;
}> = <template>
  <XzRows class="media-open" @framed={{true}} ...attributes>
    <XzHeading @text="Open in" />
    <AtlasOpenIn @file={{@file}} @self={{@self}} @tools={{@tools}} />
  </XzRows>
</template>;

export default OpenIn;
