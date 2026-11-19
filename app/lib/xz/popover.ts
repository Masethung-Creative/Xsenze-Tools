/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted.
 */
import { popIn } from './motion.ts';

/** The side of the anchor a popover opens on, then the edge both share; no edge centres it. */
export type XzPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

const sides = {
  top: { area: 'block-start', along: 'inline', gap: 'margin-block-end' },
  bottom: {
    area: 'block-end',
    along: 'inline',
    gap: 'margin-block-start',
  },
  left: {
    area: 'inline-start',
    along: 'block',
    gap: 'margin-inline-end',
  },
  right: {
    area: 'inline-end',
    along: 'block',
    gap: 'margin-inline-start',
  },
} as const;

/** CSS anchor positioning for a placement: the area, its fallbacks, and the margin that makes the gap. */
export function placementStyle(placement: XzPlacement) {
  const [side, edge] = placement.split('-') as [
    keyof typeof sides,
    'start' | 'end' | undefined,
  ];
  const { area, along, gap } = sides[side];
  // start: shares the anchor's start edge, so it grows towards the end
  const span = edge === 'start' ? 'end' : edge === 'end' ? 'start' : undefined;
  const flips =
    along === 'inline'
      ? 'flip-block, flip-inline, flip-block flip-inline'
      : 'flip-inline, flip-block, flip-inline flip-block';
  return {
    area: span ? `${area} span-${along}-${span}` : area,
    fallbacks: flips,
    gap,
  };
}

export interface AttachOptions {
  placement: XzPlacement;
  /** The anchor is a button that toggles the panel natively (popovertarget) and shows aria-expanded. */
  invokes?: boolean;
  /** aria-haspopup on the invoking button. */
  haspopup?: 'menu' | 'dialog';
  /** Space between anchor and panel; default --xz-popover-gap. */
  gap?: string;
  /** Takes focus back when the panel closes with focus inside it; default the anchor. */
  returnFocus?: () => Element | null | undefined;
}

let anchors = 0;

function names(element: HTMLElement): string[] {
  const value = element.style.getPropertyValue('anchor-name');
  return value ? value.split(',').map((name) => name.trim()) : [];
}

/**
 * Anchors `panel` (a `[popover]`) to `anchor` and returns the undo. The
 * panel pops in on open and hands focus back when it closes.
 */
export function attach(
  panel: HTMLElement,
  anchor: HTMLElement,
  options: AttachOptions,
): () => void {
  const name = `--xz-anchor-${++anchors}`;
  // one element can anchor a tooltip and a menu
  const claim = () => {
    if (names(anchor).includes(name)) return;
    anchor.style.setProperty(
      'anchor-name',
      [...names(anchor), name].join(', '),
    );
  };
  claim();
  // a consumer's bound style attribute replaces the whole inline style
  const restyled = new MutationObserver(claim);
  restyled.observe(anchor, {
    attributes: true,
    attributeFilter: ['style'],
  });
  const { area, fallbacks, gap } = placementStyle(options.placement);
  panel.style.setProperty('position-anchor', name);
  panel.style.setProperty('position-area', area);
  panel.style.setProperty('position-try-fallbacks', fallbacks);
  panel.style.setProperty(gap, options.gap ?? 'var(--xz-popover-gap, 6px)');

  const button =
    options.invokes && anchor instanceof HTMLButtonElement ? anchor : undefined;
  if (button) {
    button.popoverTargetElement = panel;
    button.setAttribute('aria-controls', panel.id);
    button.setAttribute('aria-expanded', 'false');
    if (options.haspopup)
      button.setAttribute('aria-haspopup', options.haspopup);
  }

  let hadFocus = false;
  // synchronous: Firefox returns focus to the invoker before toggle fires
  const before = (event: ToggleEvent) => {
    const open = event.newState === 'open';
    button?.setAttribute('aria-expanded', String(open));
    if (open) return popIn(panel);
    hadFocus = panel.contains(document.activeElement);
  };
  const toggle = (event: ToggleEvent) => {
    if (event.newState === 'open' || !hadFocus) return;
    const focused = document.activeElement;
    if (focused && focused !== document.body && !panel.contains(focused))
      return;
    const target = options.returnFocus ? options.returnFocus() : anchor;
    if (target instanceof HTMLElement) target.focus({ preventScroll: true });
  };
  panel.addEventListener('beforetoggle', before);
  panel.addEventListener('toggle', toggle);

  return () => {
    restyled.disconnect();
    panel.removeEventListener('beforetoggle', before);
    panel.removeEventListener('toggle', toggle);
    const rest = names(anchor).filter((other) => other !== name);
    if (rest.length) anchor.style.setProperty('anchor-name', rest.join(', '));
    else anchor.style.removeProperty('anchor-name');
    for (const property of [
      'position-anchor',
      'position-area',
      'position-try-fallbacks',
      gap,
    ])
      panel.style.removeProperty(property);
    // a re-render can attach the new panel before the old one detaches
    if (button?.popoverTargetElement === panel) {
      button.popoverTargetElement = null;
      button.removeAttribute('aria-controls');
      button.removeAttribute('aria-expanded');
      button.removeAttribute('aria-haspopup');
    }
  };
}

/** The panel a trigger modifier opens: rendered beside the trigger, found by id. */
export function panelFor(trigger: Element, id: string): HTMLElement {
  const root = trigger.getRootNode() as Document | ShadowRoot;
  const panel = root.getElementById(id);
  if (!panel) throw new Error(`no popover #${id} beside its trigger`);
  return panel;
}

/**
 * Focus left `panel` for somewhere outside it. A press on the panel's own
 * trigger does not count: its click toggles the panel closed.
 */
export function focusLeaves(panel: HTMLElement, event: FocusEvent): boolean {
  const next = event.relatedTarget;
  if (!(next instanceof Element) || panel.contains(next)) return false;
  return !(
    next.matches(':active') &&
    next instanceof HTMLButtonElement &&
    next.popoverTargetElement === panel
  );
}

/**
 * Runs `open` now, or once a press still `held` ends. WebKit and Firefox
 * light-dismiss an auto popover shown during a press when its pointerup
 * lands outside it, and macOS fires `contextmenu` while the button is down.
 */
export function afterPress(held: boolean, open: () => void): void {
  if (!held) return open();
  const done = new AbortController();
  const release = () => {
    done.abort();
    // the pointerup's own light dismiss has run by then
    setTimeout(open);
  };
  for (const type of ['pointerup', 'pointercancel'])
    window.addEventListener(type, release, {
      capture: true,
      signal: done.signal,
    });
}

export function isOpen(panel: Element): boolean {
  return panel.matches(':popover-open');
}

export function hide(panel: HTMLElement) {
  if (isOpen(panel)) panel.hidePopover();
}
