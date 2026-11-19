/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 */
import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { guidFor } from '@ember/object/internals';
import type { ComponentLike } from '@glint/template';
import Icon from 'xsenze-tools/components/icon';
import { rank, step, type CommandEntry } from 'xsenze-tools/lib/xz/command';
import './command.css';

export interface XzCommandItem extends CommandEntry {
  /** Rendered before the title; the consumer supplies it. */
  icon?: ComponentLike;
  /** Keys drawn as key caps at the end of the row, `['⌘', 'K']`. */
  shortcut?: string[];
  /** A second line: where it lives, or the query an answer answers. */
  detail?: string;
}

export interface XzCommandSignature {
  Args: {
    items: XzCommandItem[];
    placeholder?: string;
    /** Accessible name of the field and the list; default Search. */
    label?: string;
    /** Shown when nothing matches; default No results. */
    empty?: string;
    /** Draws a border round the palette; leave off inside an XzDialog. */
    framed?: boolean;
    /** A click, or Enter on the active row. */
    onSelect?: (item: XzCommandItem) => void;
    /** Every edit of the query, so the owner can add answer items for it. */
    onQuery?: (query: string) => void;
  };
  Element: HTMLDivElement;
}

interface Row {
  item: XzCommandItem;
  index: number;
  id: string;
}

/**
 * The search and command palette: a combobox field over a listbox of
 * grouped rows. Focus stays in the field; the arrow keys move the active
 * row, wrapping, Enter selects it, Escape clears the query.
 */
export default class XzCommand extends Component<XzCommandSignature> {
  @tracked query = '';
  /** Row index the keys or the pointer moved to; -1 is the first enabled row. */
  @tracked chosen = -1;
  listId = `${guidFor(this)}-list`;

  get label() {
    return this.args.label ?? 'Search';
  }

  @cached
  get groups() {
    let index = 0;
    return rank(this.args.items, this.query).map((group, number) => ({
      name: group.name,
      headingId: `${this.listId}-group-${number}`,
      rows: group.items.map((item): Row => ({
        item,
        index,
        id: `${this.listId}-${index++}`,
      })),
    }));
  }

  get rows(): Row[] {
    return this.groups.flatMap((group) => group.rows);
  }

  get activeIndex(): number {
    const rows = this.rows;
    if (rows[this.chosen] && !rows[this.chosen]!.item.disabled)
      return this.chosen;
    return rows.findIndex((row) => !row.item.disabled);
  }

  get activeId(): string | undefined {
    return this.rows[this.activeIndex]?.id;
  }

  isActive = (row: Row) => row.index === this.activeIndex;

  input = (event: Event) => {
    this.setQuery((event.target as HTMLInputElement).value);
  };

  setQuery(query: string) {
    this.query = query;
    this.chosen = -1;
    this.args.onQuery?.(query);
  }

  pick = (item: XzCommandItem) => {
    if (!item.disabled) this.args.onSelect?.(item);
  };

  hover = (index: number) => {
    if (index !== this.chosen && !this.rows[index]?.item.disabled)
      this.chosen = index;
  };

  keydown = (event: KeyboardEvent) => {
    if (event.isComposing) return;
    const delta =
      event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (delta) {
      event.preventDefault();
      const enabled = this.rows.filter((row) => !row.item.disabled);
      const at = enabled.findIndex((row) => row.index === this.activeIndex);
      const next = enabled[step(at, delta, enabled.length)];
      if (!next) return;
      this.chosen = next.index;
      document.getElementById(next.id)?.scrollIntoView({
        block: 'nearest',
      });
    } else if (event.key === 'Enter') {
      const row = this.rows[this.activeIndex];
      if (!row) return;
      event.preventDefault();
      this.pick(row.item);
    } else if (event.key === 'Escape' && this.query) {
      // precedes dialog close request
      event.preventDefault();
      this.setQuery('');
    }
  };

  <template>
    <div
      class="xz-command-palette xz-command-palette--inline
        {{if @framed 'xz-command-palette--framed'}}"
      ...attributes
    >
      <div class="xz-command-palette__search">
        <span class="xz-command-palette__search-icon" aria-hidden="true"><Icon
            @name="search"
          /></span>
        <input
          class="xz-command-palette__input"
          type="text"
          role="combobox"
          aria-label={{this.label}}
          aria-expanded="true"
          aria-controls={{this.listId}}
          aria-autocomplete="list"
          aria-activedescendant={{this.activeId}}
          autocomplete="off"
          spellcheck="false"
          placeholder={{@placeholder}}
          value={{this.query}}
          {{on "input" this.input}}
          {{on "keydown" this.keydown}}
        />
      </div>
      <div
        class="xz-command-palette__list"
        role="listbox"
        id={{this.listId}}
        aria-label={{this.label}}
        hidden={{unless this.rows.length true}}
      >
        {{#each this.groups as |group|}}
          <div role="group" aria-labelledby={{if group.name group.headingId}}>
            {{#if group.name}}
              <div
                class="xz-command-palette__group"
                id={{group.headingId}}
                role="presentation"
              >{{group.name}}</div>
            {{/if}}
            {{#each group.rows as |row|}}
              {{! template-lint-disable no-invalid-interactive require-context-role require-presentational-children }}
              <div
                class="xz-command-palette__option
                  {{if (this.isActive row) 'is-active'}}
                  {{if row.item.answer 'xz-command-palette__option--answer'}}"
                role="option"
                id={{row.id}}
                aria-selected={{if (this.isActive row) "true" "false"}}
                aria-disabled={{if row.item.disabled "true"}}
                {{on "click" (fn this.pick row.item)}}
                {{on "pointermove" (fn this.hover row.index)}}
              >
                {{#let row.item.icon as |ItemIcon|}}
                  {{#if ItemIcon}}
                    <span
                      class="xz-command-palette__icon"
                      aria-hidden="true"
                    ><ItemIcon /></span>
                  {{/if}}
                {{/let}}
                <span class="xz-command-palette__text">
                  <span
                    class="xz-command-palette__label"
                  >{{row.item.title}}</span>
                  {{#if row.item.detail}}
                    <span
                      class="xz-command-palette__detail"
                    >{{row.item.detail}}</span>
                  {{/if}}
                </span>
                {{#if row.item.shortcut}}
                  <span class="xz-command-palette__keys">
                    {{#each row.item.shortcut as |key|}}
                      <kbd class="xz-kbd">{{key}}</kbd>
                    {{/each}}
                  </span>
                {{else if (this.isActive row)}}
                  <kbd class="xz-kbd" aria-hidden="true">↵</kbd>
                {{/if}}
              </div>
            {{/each}}
          </div>
        {{/each}}
      </div>
      {{#unless this.rows.length}}
        <p class="xz-command-palette__note" role="status">{{if
            @empty
            @empty
            "No results"
          }}</p>
      {{/unless}}
    </div>
  </template>
}
