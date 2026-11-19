/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted.
 */
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { toastDetail, toastHold } from 'xsenze-tools/lib/xz/toast';

/**
 * Drives the one XzToast outlet: a short "Copied" note with the copied
 * value, near the bottom of the column the last pointer went down in.
 * `copy` confirms every tapped value copy with the toast and nothing else.
 */
export default class XzToastService extends Service {
  @tracked detail?: string;
  @tracked visible = false;
  /** Counts shows, so the outlet can tell a repeat from a first show. */
  @tracked shown = 0;
  lastPointer?: { x: number; y: number; target: Element | null };
  #timer?: number;

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);
    document.addEventListener('pointerdown', this.#note, {
      capture: true,
      passive: true,
    });
  }

  #note = (event: PointerEvent) => {
    this.lastPointer = {
      x: event.clientX,
      y: event.clientY,
      target: event.target instanceof Element ? event.target : null,
    };
  };

  /** Shows the toast; the detail appears when it is one short line. */
  show(detail?: string) {
    this.detail = toastDetail(detail);
    this.visible = true;
    this.shown += 1;
    window.clearTimeout(this.#timer);
    this.#timer = window.setTimeout(() => {
      this.visible = false;
    }, toastHold * 1000);
  }

  /** Copies `text` and confirms with the toast. Nothing shows if the write fails. */
  async copy(text: string) {
    try {
      await this.write(text);
    } catch {
      return;
    }
    this.show(text);
  }

  write(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
  }

  willDestroy() {
    super.willDestroy();
    window.clearTimeout(this.#timer);
    document.removeEventListener('pointerdown', this.#note, { capture: true });
  }
}

declare module '@ember/service' {
  interface Registry {
    'xz-toast': XzToastService;
  }
}
