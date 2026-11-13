import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { modifier } from 'ember-modifier';
import CanonTextCell from 'delphicanon/components/canon-text-cell';
import {
  digitsOf,
  fieldWidth,
  register,
} from 'xsenze-tools/components/tools/timecode-calc/smpte';

export interface TimecodeFieldSignature {
  Args: {
    /** Starting text; its digits fill the field. */
    value?: string;
    /** Drop-frame timecode separates the frames with a semicolon. */
    dropFrame: boolean;
    label: string;
    onChange: (text: string) => void;
  };
}

const wholeSelected = (input: HTMLInputElement) =>
  input.value !== '' &&
  input.selectionStart === 0 &&
  input.selectionEnd === input.value.length;

/**
 * Timecode typed as on a cash register: digits come in from the right and the
 * separators are put in. Backspace takes the last digit, wherever the caret is.
 */
export default class TimecodeField extends Component<TimecodeFieldSignature> {
  @tracked digits = digitsOf(this.args.value ?? '');

  get text() {
    return register(this.digits, this.args.dropFrame);
  }

  get placeholder() {
    return register('0', this.args.dropFrame);
  }

  #fill(input: HTMLInputElement, digits: string) {
    this.digits = digits.slice(-fieldWidth);
    // the property binding skips an unchanged text, so a refused key would stay
    input.value = this.text;
    const end = input.value.length;
    input.setSelectionRange(end, end);
    this.args.onChange(this.text);
  }

  keys = modifier((input: HTMLInputElement) => {
    const before = (event: InputEvent) => {
      if (event.isComposing) return;
      const { inputType } = event;
      const all = wholeSelected(input);
      if (inputType.startsWith('insert')) {
        event.preventDefault();
        const data = event.data ?? event.dataTransfer?.getData('text') ?? '';
        const typed = data.replace(/\D/g, '');
        if (!typed && !all) return;
        this.#fill(input, all ? typed : this.digits + typed);
      } else if (inputType.startsWith('delete')) {
        event.preventDefault();
        this.#fill(input, all ? '' : this.digits.slice(0, -1));
      }
    };
    // undo, autofill and composition, which beforeinput cannot refuse
    const after = () => this.#fill(input, digitsOf(input.value));
    input.addEventListener('beforeinput', before);
    input.addEventListener('input', after);
    return () => {
      input.removeEventListener('beforeinput', before);
      input.removeEventListener('input', after);
    };
  });

  // a click places the caret after focus, so select on the next frame
  selectAll = (event: FocusEvent) => {
    const input = event.target as HTMLInputElement;
    requestAnimationFrame(() => input.select());
  };

  <template>
    <CanonTextCell
      class="tcc-field"
      inputmode="numeric"
      autocomplete="off"
      spellcheck="false"
      aria-label={{@label}}
      @value={{this.text}}
      @placeholder={{this.placeholder}}
      {{this.keys}}
      {{on "focus" this.selectAll}}
    />
  </template>
}
