import type { TOC } from '@ember/component/template-only';
import CanonHeading from 'delphicanon/components/canon-heading';
import CanonRows from 'delphicanon/components/canon-rows';
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
  <CanonRows class="media-open" @framed={{true}} ...attributes>
    <CanonHeading @text="Open in" />
    <AtlasOpenIn @file={{@file}} @self={{@self}} @tools={{@tools}} />
  </CanonRows>
</template>;

export default OpenIn;
