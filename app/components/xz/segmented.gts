import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { guidFor } from '@ember/object/internals';
import { htmlSafe } from '@ember/template';
import type { ComponentLike } from '@glint/template';
import { Hold } from 'xsenze-tools/lib/xz/hold';
import './segmented.css';

export interface XzSegmentedSignature {
  Args: {
    /** Titles; with `icons`, what assistive technology reads. A new array drops a pick. */
    items: string[];
    /** Cells that show a symbol instead of the title, one per item. */
    icons?: ComponentLike[];
    /** Default the first cell; null picks none. */
    selected?: number | null;
    columns?: number;
    boxed?: boolean;
    disabled?: boolean;
    /** Indices of choices that cannot be taken now; they stay, greyed. */
    disabledIndices?: number[];
    onChange?: (index: number) => void;
  };
  Element: HTMLDivElement;
}

/** Single selection from a flush grid of option cells (`xz-segmented--cells`). */
export default class XzSegmented extends Component<XzSegmentedSignature> {
  hold = new Hold<number>();
  name = `xz-segmented-${guidFor(this)}`;

  get selected(): number {
    const { selected, items } = this.args;
    return (
      this.hold.read(selected, items) ??
      (selected === null ? -1 : (selected ?? 0))
    );
  }

  get cells() {
    return this.args.items.map((title, index) => ({
      index,
      title,
      icon: this.args.icons?.[index],
      selected: index === this.selected,
      disabled:
        this.args.disabled === true ||
        (this.args.disabledIndices?.includes(index) ?? false),
    }));
  }

  get style() {
    const { columns } = this.args;
    return columns ? htmlSafe(`--xz-seg-cols: ${columns}`) : undefined;
  }

  pick = (index: number) => {
    if (index === this.selected) return;
    this.hold.set(index);
    this.args.onChange?.(index);
  };

  <template>
    <div
      class="xz-segmented xz-segmented--cells
        {{unless @boxed 'xz-segmented--flush'}}
        {{if @columns 'xz-segmented--wrap'}}"
      role="radiogroup"
      style={{this.style}}
      ...attributes
    >
      {{#each this.cells as |cell|}}
        <label>
          {{! aria-label only for icon cells, which have no visible text }}
          {{! template-lint-disable require-input-label }}
          <input
            type="radio"
            name={{this.name}}
            checked={{cell.selected}}
            disabled={{cell.disabled}}
            aria-label={{if cell.icon cell.title}}
            {{on "change" (fn this.pick cell.index)}}
          />
          <span>
            {{#let cell.icon as |Icon|}}
              {{#if Icon}}<Icon />{{else}}{{cell.title}}{{/if}}
            {{/let}}
          </span>
        </label>
      {{/each}}
    </div>
  </template>
}
