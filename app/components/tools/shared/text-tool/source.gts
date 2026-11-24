import type { TOC } from '@ember/component/template-only';
import XzGrid from 'xsenze-tools/components/xz/grid';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzTextArea from 'xsenze-tools/components/xz/text-area';
import PasteClear from 'xsenze-tools/components/tools/shared/text-tool/paste-clear';
import './text-tool.css';

interface SourceSignature {
  Args: {
    heading: string;
    text: string;
    /** Accessible name of the field; default Input. */
    label?: string;
    onChange: (text: string) => void;
  };
  Blocks: { default: [] };
}

/**
 * XzTextInput without its 0.4 s typing pause: the web tools answered on
 * every keystroke. Goes inside a XzRows.
 */
const Source: TOC<SourceSignature> = <template>
  <XzHeading @text={{@heading}} />
  <XzTextArea
    class="tt-source"
    @value={{@text}}
    @placeholder="Type or paste"
    @onChange={{@onChange}}
    aria-label={{if @label @label "Input"}}
  />
  <XzGrid>
    <PasteClear @text={{@text}} @onChange={{@onChange}} />
    {{yield}}
  </XzGrid>
</template>;

export default Source;
