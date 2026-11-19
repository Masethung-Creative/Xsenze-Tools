/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 */
import Component from '@glimmer/component';
import { guidFor } from '@ember/object/internals';
import { fn, hash } from '@ember/helper';
import { on } from '@ember/modifier';
import { modifier } from 'ember-modifier';
import type { ComponentLike, ModifierLike } from '@glint/template';
import IconBase from 'xsenze-tools/components/icon';
import {
  isSeparator,
  menuRole,
  typeAhead,
  typeAheadMs,
  wrap,
  type XzMenuEntry as Entry,
  type XzMenuItem as Item,
  type XzMenuRole,
} from 'xsenze-tools/lib/xz/menu';
import {
  attach,
  hide,
  isOpen,
  focusLeaves,
  panelFor,
  type XzPlacement,
} from 'xsenze-tools/lib/xz/popover';
import './popover.css';
import './menu.css';

export type XzMenuEntry = Entry<ComponentLike>;
export type XzMenuItem = Item<ComponentLike>;

const Check = <template><IconBase @name="check" /></template>;
const ChevronRight = <template><IconBase @name="chevron-right" /></template>;

// opened by our own code, which places focus itself
const claimed = new WeakSet<HTMLElement>();

function ownItems(panel: HTMLElement): HTMLElement[] {
  return [...panel.children].filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.classList.contains('xz-menu__item'),
  );
}

/** Opens a XzMenuList panel if it is closed and focuses its first or last item, or leaves focus where it is. */
export function showMenu(panel: HTMLElement, focus: 'first' | 'last' | 'none') {
  if (!isOpen(panel)) {
    claimed.add(panel);
    panel.showPopover();
  }
  if (focus === 'none') return;
  const items = ownItems(panel);
  (focus === 'first' ? items[0] : items.at(-1))?.focus({
    preventScroll: true,
  });
}

interface Row {
  index: number;
  item?: XzMenuItem;
  role?: XzMenuRole;
  checked?: string;
  sub?: XzMenuEntry[];
  subId?: string;
}

export interface XzMenuListSignature {
  Args: {
    items: XzMenuEntry[];
    onSelect: (item: XzMenuItem) => void;
    /** Arrow keys past the inline edge: 1 towards the end, -1 towards the start. A menu bar moves to its neighbour. */
    onEdge?: (step: 1 | -1) => void;
    /** A submenu: the inline start arrow closes it, and its items open no further menus. */
    sub?: boolean;
  };
  Element: HTMLDivElement;
}

/**
 * The popover panel of a menu (role menu) that XzMenu, XzContextMenu
 * and XzMenuBar open. The owner anchors it with `attach` and opens it
 * with its trigger or `showMenu`.
 */
export class XzMenuList extends Component<XzMenuListSignature> {
  id = `${guidFor(this)}-list`;
  #panel?: HTMLElement;
  #typed = '';
  #typedAt = -Infinity;

  get rows(): Row[] {
    return this.args.items.map((entry, index) => {
      if (isSeparator(entry)) return { index };
      const sub =
        !this.args.sub && entry.items?.length ? entry.items : undefined;
      const checkable = entry.kind === 'checkbox' || entry.kind === 'radio';
      return {
        index,
        item: entry,
        role: menuRole(entry),
        checked: checkable ? String(entry.checked === true) : undefined,
        sub,
        subId: sub ? `${this.id}-${index}` : undefined,
      };
    });
  }

  /** A column for checks or icons when any item has one, so titles line up. */
  get checks() {
    return this.args.items.some(
      (entry) => entry.kind === 'checkbox' || entry.kind === 'radio',
    );
  }

  get icons() {
    return this.args.items.some(
      (entry) => !isSeparator(entry) && entry.icon !== undefined,
    );
  }

  setup = modifier((panel: HTMLElement) => {
    this.#panel = panel;
    const toggle = (event: ToggleEvent) => {
      if (event.newState !== 'open' || claimed.delete(panel)) return;
      if (!panel.contains(document.activeElement))
        ownItems(panel)[0]?.focus({
          preventScroll: true,
        });
    };
    panel.addEventListener('toggle', toggle);
    panel.addEventListener('keydown', this.keydown);
    panel.addEventListener('focusout', this.focusout);
    return () => {
      panel.removeEventListener('toggle', toggle);
      panel.removeEventListener('keydown', this.keydown);
      panel.removeEventListener('focusout', this.focusout);
    };
  });

  submenu = modifier((sub: HTMLElement, [index]: [number]) => {
    const item = sub.parentElement?.querySelector<HTMLElement>(
      `:scope > [data-index="${index}"]`,
    );
    if (!item) return;
    return attach(sub, item, {
      placement: 'right-start',
      invokes: true,
      gap: '0px',
    });
  });

  subPanel(row: Row): HTMLElement | undefined {
    return row.subId
      ? (this.#panel?.querySelector<HTMLElement>(`#${row.subId}`) ?? undefined)
      : undefined;
  }

  select = (item: XzMenuItem) => {
    if (!this.args.sub && this.#panel) hide(this.#panel);
    this.args.onSelect(item);
  };

  activate = (row: Row, event: MouseEvent) => {
    if (row.sub) {
      // the item is the submenu's popovertarget; a second click must not close it
      event.preventDefault();
      const sub = this.subPanel(row);
      if (sub && !row.item?.disabled) showMenu(sub, 'first');
      return;
    }
    if (row.item && !row.item.disabled) this.select(row.item);
  };

  hover = (row: Row, event: PointerEvent) => {
    if (event.pointerType === 'touch' || !this.#panel) return;
    (event.currentTarget as HTMLElement).focus({
      preventScroll: true,
    });
    for (const open of this.#panel.querySelectorAll<HTMLElement>(
      ':scope > .xz-menu-panel:popover-open',
    ))
      if (open.id !== row.subId) open.hidePopover();
    const sub = this.subPanel(row);
    if (sub && !row.item?.disabled) showMenu(sub, 'none');
  };

  keydown = (event: KeyboardEvent) => {
    const panel = event.currentTarget as HTMLElement;
    const target = event.target as HTMLElement;
    if (target.parentElement !== panel) return;
    const items = ownItems(panel);
    const at = items.indexOf(target);
    const row = this.rows[Number(target.dataset['index'])];
    const go = (index: number) => items[index]?.focus({ preventScroll: true });
    const rtl = panel.matches(':dir(rtl)');
    const toEnd = rtl ? 'ArrowLeft' : 'ArrowRight';
    const toStart = rtl ? 'ArrowRight' : 'ArrowLeft';
    switch (event.key) {
      case 'ArrowDown':
        go(wrap(at, 1, items.length));
        break;
      case 'ArrowUp':
        go(wrap(at, -1, items.length));
        break;
      case 'Home':
        go(0);
        break;
      case 'End':
        go(items.length - 1);
        break;
      case toEnd: {
        const sub = row && this.subPanel(row);
        if (sub && !row?.item?.disabled) showMenu(sub, 'first');
        else this.args.onEdge?.(1);
        break;
      }
      case toStart:
        if (this.args.sub) hide(panel);
        else this.args.onEdge?.(-1);
        break;
      default:
        if (!this.typeAhead(event, items, at)) return;
    }
    event.preventDefault();
  };

  typeAhead(event: KeyboardEvent, items: HTMLElement[], at: number): boolean {
    const { key } = event;
    if (key.length !== 1 || key === ' ') return false;
    if (event.ctrlKey || event.metaKey || event.altKey) return false;
    this.#typed =
      event.timeStamp - this.#typedAt < typeAheadMs ? this.#typed + key : key;
    this.#typedAt = event.timeStamp;
    const titles = items.map(
      (element) =>
        this.rows[Number(element.dataset['index'])]?.item?.title ?? '',
    );
    const found = typeAhead(titles, this.#typed, at);
    if (found >= 0) items[found]!.focus({ preventScroll: true });
    return true;
  }

  focusout = (event: FocusEvent) => {
    if (this.args.sub) return;
    const panel = event.currentTarget as HTMLElement;
    if (focusLeaves(panel, event)) hide(panel);
  };

  <template>
    <div
      id={{this.id}}
      class="xz-popover__panel xz-menu__list xz-menu-panel
        {{if this.checks 'xz-menu-panel--checks'}}
        {{if this.icons 'xz-menu-panel--icons'}}"
      popover="auto"
      role="menu"
      {{this.setup}}
      ...attributes
    >
      {{#each this.rows key="index" as |row|}}
        {{#if row.item}}
          <button
            type="button"
            class="xz-menu__item
              {{if row.item.destructive 'xz-menu__item--danger'}}"
            role={{row.role}}
            tabindex="-1"
            data-index={{row.index}}
            aria-checked={{row.checked}}
            aria-disabled={{if row.item.disabled "true"}}
            aria-haspopup={{if row.sub "menu"}}
            {{on "click" (fn this.activate row)}}
            {{on "pointerenter" (fn this.hover row)}}
          >
            <span class="xz-menu-item-check" aria-hidden="true">
              {{#if row.item.checked}}<Check />{{/if}}
            </span>
            <span class="xz-menu-item-icon" aria-hidden="true">
              {{#let row.item.icon as |Icon|}}{{#if Icon}}<Icon
                  />{{/if}}{{/let}}
            </span>
            <span class="xz-menu-item-title">{{row.item.title}}</span>
            {{#if row.item.shortcut}}
              <kbd class="xz-menu-item-shortcut">{{row.item.shortcut}}</kbd>
            {{/if}}
            {{#if row.sub}}
              <span class="xz-menu-item-more" aria-hidden="true">
                <ChevronRight />
              </span>
            {{/if}}
          </button>
          {{#if row.sub}}
            <XzMenuList
              id={{row.subId}}
              @items={{row.sub}}
              @sub={{true}}
              @onSelect={{this.select}}
              @onEdge={{@onEdge}}
              {{this.submenu row.index}}
            />
          {{/if}}
        {{else}}
          <div class="xz-menu__separator" role="separator"></div>
        {{/if}}
      {{/each}}
    </div>
  </template>
}

export interface XzMenuSignature {
  Args: {
    items: XzMenuEntry[];
    /** Default bottom-start. */
    placement?: XzPlacement;
    onSelect?: (item: XzMenuItem) => void;
  };
  /** Put `trigger` on the button that opens the menu. */
  Blocks: {
    default: [
      {
        trigger: ModifierLike<{
          Element: HTMLButtonElement;
        }>;
      },
    ];
  };
  Element: HTMLDivElement;
}

/**
 * A dropdown menu opened by the consumer's button: a click, Enter or Space
 * opens it at the first item, the down and up arrows at the first and last.
 * Choosing an item closes it and reports the item.
 */
export default class XzMenu extends Component<XzMenuSignature> {
  id = `${guidFor(this)}-menu`;

  trigger = modifier((button: HTMLButtonElement) => {
    const panel = panelFor(button, this.id);
    const detach = attach(panel, button, {
      placement: this.args.placement ?? 'bottom-start',
      invokes: true,
      haspopup: 'menu',
    });
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      showMenu(panel, event.key === 'ArrowDown' ? 'first' : 'last');
    };
    button.addEventListener('keydown', keydown);
    return () => {
      button.removeEventListener('keydown', keydown);
      detach();
    };
  });

  select = (item: XzMenuItem) => this.args.onSelect?.(item);

  <template>
    {{yield (hash trigger=this.trigger)}}
    <XzMenuList
      id={{this.id}}
      @items={{@items}}
      @onSelect={{this.select}}
      ...attributes
    />
  </template>
}
