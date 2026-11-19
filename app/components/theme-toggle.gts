import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import Icon from 'xsenze-tools/components/icon';

/** Sets the theme on <html> the same way the script in index.html does. */
export function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
}

export default class ThemeToggle extends Component<{
  Element: HTMLButtonElement;
}> {
  @tracked dark =
    document.documentElement.getAttribute('data-theme') !== 'light';

  toggle = () => {
    this.dark = !this.dark;
    applyTheme(this.dark ? 'dark' : 'light');
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
      class="xz-btn xz-btn--ghost xz-btn--icon"
      title={{this.label}}
      aria-label={{this.label}}
      ...attributes
      {{on "click" this.toggle}}
    >
      <Icon @name={{if this.dark "sun" "moon"}} />
    </button>
  </template>
}
