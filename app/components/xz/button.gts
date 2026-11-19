import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import type { ComponentLike } from '@glint/template';
import { IconSvg } from 'xsenze-tools/components/icon';
import repeat from 'xsenze-tools/modifiers/xz/repeat';
import './button.css';
import press from 'xsenze-tools/modifiers/xz/press';

export type XzButtonKind = 'primary' | 'secondary' | 'cell' | 'segment';

export interface XzButtonSignature {
  Args: {
    /** The title. Empty shows the icon alone. */
    text?: string;
    /** Rendered as the symbol; the consumer supplies it. */
    icon?: ComponentLike;
    /**
     * inline: small, beside the title. oversized: large and faint behind the
     * title, turned, cut off by the trailing and bottom edges. Keep it rare.
     */
    iconStyle?: 'inline' | 'oversized';
    /**
     * primary: the tool's main verb, fills its container. secondary: fills
     * its container. cell: content width, the enclosing grid or flush row
     * draws the lines. segment: a cell that shows `selected`.
     */
    kind?: XzButtonKind;
    selected?: boolean;
    disabled?: boolean;
    /** Accessible name when the title is empty or dropped. */
    label?: string;
    onClick?: () => void;
    /** Holding the button runs onClick again and again; a tap runs it once. */
    repeats?: boolean;
    /** Shows Copied with a check for 1.5 s after each click. */
    flashesCopied?: boolean;
  };
  Element: HTMLButtonElement;
}

export const flashSeconds = 1.5;

const Check = <template><IconSvg @name="check" /></template>;

/** The kit's panel cell button: `xz-panel__action`, primary filled with the accent. */
export default class XzButton extends Component<XzButtonSignature> {
  @tracked flashing = false;
  #flashTimer?: number;

  get kind(): XzButtonKind {
    return this.args.kind ?? 'secondary';
  }

  get text(): string {
    return this.flashing ? 'Copied' : (this.args.text ?? '');
  }

  get icon(): ComponentLike | undefined {
    return this.flashing ? Check : this.args.icon;
  }

  get oversized() {
    return this.args.iconStyle === 'oversized' && this.icon !== undefined;
  }

  get filled() {
    return (
      this.kind === 'primary' ||
      (this.args.selected === true &&
        (this.kind === 'segment' || this.kind === 'secondary'))
    );
  }

  /** A grid drops the title of a filling button with a symbol when it does not fit. */
  get fits() {
    return (
      (this.kind === 'primary' || this.kind === 'secondary') &&
      this.text !== '' &&
      this.icon !== undefined &&
      !this.oversized
    );
  }

  get label() {
    if (this.icon === undefined) return undefined;
    return this.args.label ?? (this.text || undefined);
  }

  get classes() {
    return [
      'xz-button',
      'xz-panel__action',
      `xz-button--${this.kind}`,
      this.kind === 'primary' ? 'xz-panel__action--primary' : '',
      this.filled ? 'xz-button--filled' : '',
      this.icon ? 'xz-button--has-icon' : '',
      this.oversized ? 'xz-button--oversized' : '',
      this.text ? '' : 'xz-button--symbol',
    ]
      .filter(Boolean)
      .join(' ');
  }

  fire = () => {
    this.args.onClick?.();
    if (this.args.flashesCopied) this.flash();
  };

  flash() {
    this.flashing = true;
    window.clearTimeout(this.#flashTimer);
    this.#flashTimer = window.setTimeout(() => {
      this.flashing = false;
    }, flashSeconds * 1000);
  }

  willDestroy() {
    super.willDestroy();
    window.clearTimeout(this.#flashTimer);
  }

  <template>
    <button
      type="button"
      class={{this.classes}}
      data-xz-fit={{if this.fits ""}}
      data-selected={{if @selected ""}}
      disabled={{@disabled}}
      aria-label={{this.label}}
      ...attributes
      {{repeat this.fire @repeats}}
      {{press}}
    >
      {{#let this.icon as |Icon|}}
        {{#if Icon}}
          <span
            class={{if this.oversized "xz-button__watermark" "xz-button__icon"}}
            aria-hidden="true"
          ><Icon /></span>
        {{/if}}
      {{/let}}
      {{#if this.text}}
        <span class="xz-button__title">{{this.text}}</span>
      {{/if}}
    </button>
  </template>
}
