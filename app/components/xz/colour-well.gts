import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { guidFor } from '@ember/object/internals';
import {
  formatColour,
  hex,
  parseHex,
  type ColourFormat,
  type Rgb,
} from 'xsenze-tools/lib/xz/colour';
import './colour-well.css';
import press from 'xsenze-tools/modifiers/xz/press';

export interface XzColourWellSignature {
  Args: {
    /** Caption over the hex, and the swatch's accessible name. */
    label?: string;
    colour: Rgb;
    /** The app's primary colour format, echoed under the hex unless it is hex. */
    format?: ColourFormat;
    onChange?: (colour: Rgb) => void;
  };
  Element: HTMLDivElement;
}

/** Swatch that opens the system picker, beside a hex field. */
export default class XzColourWell extends Component<XzColourWellSignature> {
  id = guidFor(this);

  get hex() {
    return hex(this.args.colour);
  }

  get echo() {
    const { format } = this.args;
    return format && format !== 'hex'
      ? formatColour(this.args.colour, format)
      : undefined;
  }

  picked = (event: Event) => {
    const colour = parseHex((event.target as HTMLInputElement).value);
    if (colour) this.args.onChange?.(colour);
  };

  typed = (event: Event) => {
    const field = event.target as HTMLInputElement;
    const colour = parseHex(field.value);
    if (colour && hex(colour) !== this.hex) this.args.onChange?.(colour);
    field.value = colour ? hex(colour) : this.hex;
  };

  done = (event: KeyboardEvent) => {
    if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
  };

  <template>
    <div class="xz-colourwell" ...attributes>
      {{#if @label}}
        <label class="xz-label" for="{{this.id}}-hex">{{@label}}</label>
      {{/if}}
      <div class="xz-colorfield">
        <input
          type="color"
          {{press}}
          value={{this.hex}}
          aria-label={{if @label @label "Colour"}}
          {{on "input" this.picked}}
        />
        {{! the label names this field only when @label is set; else aria-label does }}
        {{! template-lint-disable require-input-label }}
        <input
          class="xz-input"
          id="{{this.id}}-hex"
          type="text"
          value={{this.hex}}
          placeholder="#000000"
          maxlength="7"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          aria-label={{unless @label "Hex"}}
          {{on "change" this.typed}}
          {{on "keydown" this.done}}
        />
      </div>
      {{#if this.echo}}
        <span class="xz-colourwell__echo">{{this.echo}}</span>
      {{/if}}
    </div>
  </template>
}
