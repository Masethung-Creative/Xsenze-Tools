import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import Icon from 'xsenze-tools/components/icon';

// index.html sets html.dark / html.light before first paint; this keeps it in sync
export default class ThemeToggle extends Component<{
  Element: HTMLButtonElement;
}> {
  @tracked dark = document.documentElement.classList.contains('dark');

  toggle = () => {
    this.dark = !this.dark;
    const root = document.documentElement;
    root.classList.toggle('dark', this.dark);
    root.classList.toggle('light', !this.dark);
    try {
      localStorage.setItem('theme', this.dark ? 'dark' : 'light');
    } catch {
      // storage blocked (private mode): theme still applies for this visit
    }
  };

  get label() {
    return this.dark ? 'Switch to light theme' : 'Switch to dark theme';
  }

  <template>
    <button
      type="button"
      title={{this.label}}
      aria-label={{this.label}}
      ...attributes
      {{on "click" this.toggle}}
    >
      <Icon @name={{if this.dark "sun" "moon"}} />
    </button>
  </template>
}
