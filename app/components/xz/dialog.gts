/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 */
import Component from '@glimmer/component';
import { guidFor } from '@ember/object/internals';
import { modifier } from 'ember-modifier';
import { dialogMotion, reducedMotion } from 'xsenze-tools/lib/xz/motion';
import './dialog.css';

/** Closes with the motion out; `onClose` then gets `returnValue`. */
export type XzDialogClose = (returnValue?: string) => void;

export interface XzDialogSignature {
  Args: {
    /** Opens with `showModal`. The owner sets it back to false in `onClose`; setting it false itself closes at once, without motion. */
    open: boolean;
    /** The heading, and the dialog's accessible name. */
    title?: string;
    /** Text under the heading, and the accessible description. */
    message?: string;
    /** role alertdialog; a click on the backdrop does not close it. */
    alert?: boolean;
    /** Escape and a click on the backdrop close it; default true. */
    dismissable?: boolean;
    /** Every close, with the return value: the argument to `close`, or the value of the button that submitted a `method="dialog"` form. */
    onClose?: (returnValue: string) => void;
  };
  Blocks: {
    /** Above the message, under the heading: a search field, a row. */
    header: [close: XzDialogClose];
    /** The body; scrolls when the dialog is full. */
    default: [close: XzDialogClose];
    /** Buttons. */
    footer: [close: XzDialogClose];
  };
  Element: HTMLDialogElement;
}

/**
 * A modal dialog: the platform's `<dialog>` with `showModal`, so the top
 * layer, the focus trap, Escape and `inert` on the page are the browser's.
 * Content renders while `open`; focus returns to the element that had it.
 */
export default class XzDialog<
  A extends XzDialogSignature['Args'] = XzDialogSignature['Args'],
> extends Component<Omit<XzDialogSignature, 'Args'> & { Args: A }> {
  titleId = `${guidFor(this)}-title`;
  messageId = `${guidFor(this)}-message`;
  element?: HTMLDialogElement;
  #invoker?: HTMLElement;
  #closing = false;

  get classNames(): string {
    return this.args.alert
      ? 'xz-modal xz-modal--sm xz-modal--alert xz-dialog'
      : 'xz-modal xz-dialog';
  }

  get dismissable(): boolean {
    return this.args.dismissable ?? true;
  }

  /** Keyframes of the motion in; played backwards on the way out. */
  keyframes(): Keyframe[] {
    return [
      {
        opacity: 0,
        transform: `scale(${dialogMotion.scale})`,
      },
      { opacity: 1, transform: 'none' },
    ];
  }

  #animate(dialog: HTMLDialogElement, entering: boolean): Animation[] {
    const backdrop = dialog.animate([{ opacity: 0 }, { opacity: 1 }], {
      ...(entering
        ? {
            duration: dialogMotion.inMs,
            easing: dialogMotion.inEasing,
          }
        : {
            duration: dialogMotion.outMs,
            easing: dialogMotion.outEasing,
            direction: 'reverse',
            fill: 'forwards',
          }),
      pseudoElement: '::backdrop',
    });
    // the kit's CSS plays the motion in on the box itself
    if (entering) return [backdrop];
    return [
      dialog.animate(this.keyframes(), {
        duration: dialogMotion.outMs,
        easing: dialogMotion.outEasing,
        direction: 'reverse',
        fill: 'forwards',
      }),
      backdrop,
    ];
  }

  close: XzDialogClose = (returnValue = '') => {
    const dialog = this.element;
    if (!dialog?.open || this.#closing) return;
    this.#closing = true;
    const animations = reducedMotion() ? [] : this.#animate(dialog, false);
    const done = () => {
      this.#closing = false;
      dialog.close(returnValue);
      // fill would hold next opening
      animations.forEach((animation) => animation.cancel());
    };
    Promise.all(animations.map((animation) => animation.finished)).then(
      done,
      done,
    );
  };

  present = modifier((dialog: HTMLDialogElement, [open]: [boolean]) => {
    this.element = dialog;
    if (open && !dialog.open) {
      const active = document.activeElement;
      this.#invoker = active instanceof HTMLElement ? active : undefined;
      dialog.returnValue = '';
      dialog.showModal();
      if (!reducedMotion()) this.#animate(dialog, true);
    } else if (!open && dialog.open) {
      dialog.close();
    }

    const cancel = (event: Event) => {
      event.preventDefault();
      if (this.dismissable) this.close();
    };
    // press must start outside
    let downOnBackdrop = false;
    const down = (event: PointerEvent) => {
      downOnBackdrop = event.target === dialog;
    };
    const click = (event: MouseEvent) => {
      if (!downOnBackdrop || event.target !== dialog) return;
      if (this.args.alert || !this.dismissable) return;
      const r = dialog.getBoundingClientRect();
      const inside =
        event.clientX >= r.left &&
        event.clientX <= r.right &&
        event.clientY >= r.top &&
        event.clientY <= r.bottom;
      if (!inside) this.close();
    };
    const submit = (event: SubmitEvent) => {
      if ((event.target as HTMLFormElement).method !== 'dialog') return;
      event.preventDefault();
      const submitter = event.submitter as HTMLButtonElement | null;
      this.close(submitter?.value ?? '');
    };
    const closed = () => {
      const invoker = this.#invoker;
      this.#invoker = undefined;
      if (invoker?.isConnected) invoker.focus();
      this.args.onClose?.(dialog.returnValue);
    };

    dialog.addEventListener('cancel', cancel);
    dialog.addEventListener('pointerdown', down);
    dialog.addEventListener('click', click);
    dialog.addEventListener('submit', submit);
    dialog.addEventListener('close', closed);
    return () => {
      dialog.removeEventListener('cancel', cancel);
      dialog.removeEventListener('pointerdown', down);
      dialog.removeEventListener('click', click);
      dialog.removeEventListener('submit', submit);
      dialog.removeEventListener('close', closed);
    };
  });

  <template>
    {{! template-lint-disable no-invalid-role }}
    <dialog
      class={{this.classNames}}
      role={{if @alert "alertdialog"}}
      data-xz-static={{if @alert ""}}
      aria-labelledby={{if @title this.titleId}}
      aria-describedby={{if @message this.messageId}}
      {{this.present @open}}
      ...attributes
    >
      {{#if @open}}
        {{#if @alert}}
          <div class="xz-modal__body">
            {{#if @title}}
              <h3 class="xz-modal__title" id={{this.titleId}}>{{@title}}</h3>
            {{/if}}
            {{#if @message}}
              <p
                class="xz-dialog__message"
                id={{this.messageId}}
              >{{@message}}</p>
            {{/if}}
            {{#if (has-block "header")}}{{yield this.close to="header"}}{{/if}}
            {{#if (has-block)}}{{yield this.close}}{{/if}}
          </div>
        {{else}}
          {{#if @title}}
            <div class="xz-modal__header">
              <h3 class="xz-modal__title" id={{this.titleId}}>{{@title}}</h3>
            </div>
          {{/if}}
          {{#if (has-block "header")}}
            <div class="xz-dialog__extra">{{yield this.close to="header"}}</div>
          {{/if}}
          {{#if @message}}
            <p class="xz-dialog__message" id={{this.messageId}}>{{@message}}</p>
          {{/if}}
          {{#if (has-block)}}
            <div class="xz-modal__body">{{yield this.close}}</div>
          {{/if}}
        {{/if}}
        {{#if (has-block "footer")}}
          <div class="xz-modal__footer">{{yield this.close to="footer"}}</div>
        {{/if}}
      {{/if}}
    </dialog>
  </template>
}
