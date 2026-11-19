import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { Hold } from 'xsenze-tools/lib/xz/hold';
import './menu-cell.css';

export interface XzMenuCellSignature {
  Args: {
    items: string[];
    /** Undefined shows the placeholder: a value set elsewhere that matches no choice. */
    selected?: number;
    /** Default an em dash. */
    placeholder?: string;
    labelledBy?: string;
    label?: string;
    disabled?: boolean;
    /** Every choice sends onChange, the one shown too, and the system menu marks none: for a list of places to go. */
    repicks?: boolean;
    onChange?: (index: number) => void;
  };
  Element: HTMLDivElement;
}

/** The kit's select (`xz-select`) showing one choice and opening the system menu of all of them. */
export default class XzMenuCell extends Component<XzMenuCellSignature> {
  hold = new Hold<number>();

  get selected(): number | undefined {
    return this.hold.read(this.args.selected) ?? this.args.selected;
  }

  get title(): string | undefined {
    const { selected } = this;
    return selected === undefined ? undefined : this.args.items[selected];
  }

  get placeholder() {
    return this.args.placeholder ?? '—';
  }

  get blank() {
    return this.args.repicks === true || !this.title;
  }

  get options() {
    return this.args.items.map((title, index) => ({
      title,
      value: String(index),
      selected: !this.args.repicks && index === this.selected,
    }));
  }

  pick = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    const index = Number(select.value);
    // a native select sends no change for the option it already holds
    if (this.args.repicks) select.value = '';
    else if (index === this.selected) return;
    this.hold.set(index);
    this.args.onChange?.(index);
  };

  <template>
    <div class="xz-menu-cell" ...attributes>
      {{! template-lint-disable require-input-label }}
      <select
        class="xz-select xz-select--sm"
        aria-labelledby={{@labelledBy}}
        aria-label={{@label}}
        disabled={{@disabled}}
        {{on "change" this.pick}}
      >
        {{#if this.blank}}
          <option value="" disabled selected hidden>{{if
              this.title
              this.title
              this.placeholder
            }}</option>
        {{/if}}
        {{#each this.options as |choice|}}
          <option
            value={{choice.value}}
            selected={{choice.selected}}
          >{{choice.title}}</option>
        {{/each}}
      </select>
    </div>
  </template>
}
