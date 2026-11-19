import type { TOC } from '@ember/component/template-only';
import { on } from '@ember/modifier';
import './text-cell.css';

export interface XzTextCellSignature {
  Args: {
    value?: string;
    placeholder?: string;
    /** Called on every edit. */
    onChange?: (value: string) => void;
  };
  Element: HTMLInputElement;
}

function edited(onChange: ((value: string) => void) | undefined) {
  return (event: Event) => onChange?.((event.target as HTMLInputElement).value);
}

function blurOnEnter(event: KeyboardEvent) {
  if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
}

/** The kit's input, small, at the end of its row. */
const XzTextCell: TOC<XzTextCellSignature> = <template>
  <input
    type="text"
    class="xz-input xz-input--sm xz-text-cell"
    value={{@value}}
    placeholder={{@placeholder}}
    enterkeyhint="done"
    ...attributes
    {{on "input" (edited @onChange)}}
    {{on "keydown" blurOnEnter}}
  />
</template>;

export default XzTextCell;
