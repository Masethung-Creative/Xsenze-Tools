/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 */
import Component from '@glimmer/component';
import { service } from '@ember/service';
import { modifier } from 'ember-modifier';
import Icon from 'xsenze-tools/components/icon';
import type XzToastService from 'xsenze-tools/services/xz-toast';
import { springEasing } from 'xsenze-tools/lib/xz/motion';
import { placeToast, type Box } from 'xsenze-tools/lib/xz/toast';
import './toast.css';

export interface XzToastSignature {
  Element: HTMLDivElement;
}

const bump = springEasing(0.6);

/** The column a pointer at `target` belongs to, with its bottom above a footer. */
function column(target: Element | null | undefined): Box {
  const pad = 16;
  const split = target?.closest('.xz-tool-split');
  if (!split) {
    return {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight - pad,
    };
  }
  const pane = target?.closest('.xz-tool-split__pane')?.getBoundingClientRect();
  // one column: panes have no box of their own
  const box = pane && pane.width > 0 ? pane : split.getBoundingClientRect();
  let bottom = box.bottom - pad;
  const footer = split
    .querySelector('.xz-tool-split__footer')
    ?.getBoundingClientRect();
  if (footer && footer.left < box.right && footer.right > box.left) {
    bottom = footer.top - 10;
  }
  return { left: box.left, top: box.top, right: box.right, bottom };
}

/**
 * The toast outlet. Render it once, near the root of the app; the xz-toast
 * service shows it. It fades in, stays 1.4 s after the last show and fades
 * out; a show while visible bumps it.
 */
export default class XzToast extends Component<XzToastSignature> {
  @service('xz-toast') declare toast: XzToastService;

  /** Changes on every show, so a screen reader reads each one. */
  get announcement() {
    if (!this.toast.visible) return '';
    return this.toast.shown % 2 ? 'Copied' : 'Copied ';
  }

  present = modifier(
    (element: HTMLElement, [shown, visible]: [number, boolean]) => {
      const note = element.firstElementChild as HTMLElement | null;
      if (shown === 0 || !note) return;
      const still = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      const showing = element.style.opacity === '1';
      if (!visible) {
        element.style.opacity = '0';
        element.animate(
          [
            { opacity: 1, transform: 'none' },
            {
              opacity: 0,
              transform: still ? 'none' : 'translateY(6px)',
            },
          ],
          { duration: 300, easing: 'ease-in' },
        );
        return;
      }
      const pointer = this.toast.lastPointer;
      const band = column(pointer?.target);
      note.style.maxWidth = `${Math.max(0, band.right - band.left - 32)}px`;
      const place = placeToast(band, note.offsetHeight, pointer);
      element.style.left = `${place.x}px`;
      element.style.top = `${place.bottom}px`;
      element.style.opacity = '1';
      if (!showing) {
        element.animate(
          [
            {
              opacity: 0,
              transform: still ? 'none' : 'translateY(10px)',
            },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 220, easing: 'ease-out' },
        );
      } else if (!still) {
        element.animate([{ transform: 'scale(1.06)' }, { transform: 'none' }], {
          duration: 350,
          easing: bump,
        });
      }
    },
  );

  <template>
    <div class="xz-toast-live" role="status">{{this.announcement}}</div>
    <div
      class="xz-toast-anchor"
      aria-hidden="true"
      {{this.present this.toast.shown this.toast.visible}}
      ...attributes
    >
      <div class="xz-toast xz-toast--success">
        <span class="xz-toast-check"><Icon @name="check" /></span>
        <span class="xz-toast__title">Copied</span>
        {{#if this.toast.detail}}
          <span class="xz-toast__text">{{this.toast.detail}}</span>
        {{/if}}
      </div>
    </div>
  </template>
}
