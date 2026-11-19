import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

export interface XzSwitchSignature {
  Args: {
    on?: boolean;
    disabled?: boolean;
    onChange?: (on: boolean) => void;
  };
  Element: HTMLInputElement;
}

/** An on/off switch: a native checkbox with the switch role, in the kit's `xz-toggle`. */
export default class XzSwitch extends Component<XzSwitchSignature> {
  // a flip holds until the on arg changes
  @tracked flipped?: { on: boolean; over: boolean | undefined };

  get on(): boolean {
    const { flipped } = this;
    return flipped && flipped.over === this.args.on
      ? flipped.on
      : (this.args.on ?? false);
  }

  change = (event: Event) => {
    const on = (event.target as HTMLInputElement).checked;
    this.flipped = { on, over: this.args.on };
    this.args.onChange?.(on);
  };

  <template>
    <span class="xz-toggle xz-switch">
      <input
        type="checkbox"
        role="switch"
        checked={{this.on}}
        aria-checked={{if this.on "true" "false"}}
        disabled={{@disabled}}
        ...attributes
        {{on "change" this.change}}
      />
    </span>
  </template>
}
