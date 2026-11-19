/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 */
import Component from '@glimmer/component';
import { guidFor } from '@ember/object/internals';
import { hash } from '@ember/helper';
import { modifier } from 'ember-modifier';
import type { ModifierLike } from '@glint/template';
import {
  attach,
  hide,
  panelFor,
  type XzPlacement,
} from 'xsenze-tools/lib/xz/popover';
import './popover.css';

export type XzPopoverTrigger = ModifierLike<{ Element: HTMLButtonElement }>;

export interface XzPopoverSignature {
  Args: {
    /** Default bottom-start. The panel flips to the other side when it does not fit. */
    placement?: XzPlacement;
  };
  Blocks: {
    /** Put `trigger` on the button that opens the panel. */
    trigger: [{ trigger: XzPopoverTrigger; close: () => void }];
    content: [{ close: () => void }];
  };
  Element: HTMLDivElement;
}

/**
 * A panel anchored to the consumer's button. The button toggles it; a
 * click outside or Escape closes it, and focus inside goes back to the
 * button. Give the panel a role and a label (`role="dialog"
 * aria-label="…"`) and `autofocus` on what should take focus.
 */
export default class XzPopover extends Component<XzPopoverSignature> {
  id = `${guidFor(this)}-popover`;
  #panel?: HTMLElement;

  trigger = modifier((button: HTMLButtonElement) => {
    const panel = panelFor(button, this.id);
    this.#panel = panel;
    return attach(panel, button, {
      placement: this.args.placement ?? 'bottom-start',
      invokes: true,
    });
  });

  close = () => {
    if (this.#panel) hide(this.#panel);
  };

  <template>
    {{yield (hash trigger=this.trigger close=this.close) to="trigger"}}
    <div id={{this.id}} class="xz-popover__panel" popover="auto" ...attributes>
      {{yield (hash close=this.close) to="content"}}
    </div>
  </template>
}
