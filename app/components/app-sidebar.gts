import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { LinkTo } from '@ember/routing';
import { modifier } from 'ember-modifier';
import BrandLogo from 'xsenze-tools/components/brand-logo';
import Icon from 'xsenze-tools/components/icon';
import { toolCategories, toolMatches } from 'xsenze-tools/lib/tools';
import './app-sidebar.css';

interface Signature {
  Args: {
    /** Called after a link is followed, so the mobile drawer can close. */
    onNavigate?: () => void;
  };
  Element: HTMLElement;
}

/** Ctrl+K / Cmd+K focuses the tool search from anywhere. */
const focusOnCtrlK = modifier((input: HTMLInputElement) => {
  const onKey = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
});

export default class AppSidebar extends Component<Signature> {
  @tracked query = '';

  get categories() {
    const q = this.query;
    return toolCategories
      .map((cat) => ({
        ...cat,
        tools: cat.tools
          .filter((t) => toolMatches(t, q))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((cat) => !q.trim() || cat.tools.length > 0);
  }

  get hasResults() {
    return this.categories.length > 0;
  }

  updateQuery = (event: Event) => {
    this.query = (event.target as HTMLInputElement).value;
  };

  clearOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.query = '';
      (event.target as HTMLInputElement).blur();
    }
  };

  navigated = () => {
    this.args.onNavigate?.();
  };

  <template>
    <nav class="sidebar" aria-label="Tools" ...attributes>
      <LinkTo @route="index" class="brand" {{on "click" this.navigated}}>
        <BrandLogo class="brand__mark" @size={{38}} />
        <span class="brand__text">
          <span class="brand__name">xsenze tools</span>
          <span class="brand__tag">free creative tools</span>
        </span>
      </LinkTo>

      <label class="sidebar__search">
        <Icon @name="search" />
        <span class="sr-only">Search tools</span>
        <input
          type="search"
          placeholder="Search tools…"
          value={{this.query}}
          {{on "input" this.updateQuery}}
          {{on "keydown" this.clearOnEscape}}
          {{focusOnCtrlK}}
        />
        <kbd>Ctrl K</kbd>
      </label>

      <div class="sidebar__scroll">
        <ul class="sidebar__list">
          <li>
            <LinkTo
              @route="index"
              class="sidebar__row"
              {{on "click" this.navigated}}
            >
              <Icon @name="house" />
              Home
            </LinkTo>
          </li>
        </ul>

        {{#each this.categories as |cat|}}
          <section class="sidebar__group">
            <h2 class="sidebar__heading">{{cat.name}}</h2>
            {{#if cat.tools.length}}
              <ul class="sidebar__list">
                {{#each cat.tools as |tool|}}
                  <li>
                    <LinkTo
                      @route="tools.tool"
                      @model={{tool.id}}
                      class="sidebar__row"
                      title={{tool.description}}
                      {{on "click" this.navigated}}
                    >
                      <Icon @name={{tool.icon}} />
                      <span class="sidebar__name">{{tool.name}}</span>
                      {{#if tool.beta}}<span class="badge">beta</span>{{/if}}
                    </LinkTo>
                  </li>
                {{/each}}
              </ul>
            {{else}}
              <p class="sidebar__empty">
                <Icon @name={{cat.icon}} />
                First tool coming soon
              </p>
            {{/if}}
          </section>
        {{/each}}

        {{#unless this.hasResults}}
          <p class="sidebar__empty">No tools match “{{this.query}}”</p>
        {{/unless}}
      </div>

      <footer class="sidebar__footer">
        <LinkTo @route="privacy" {{on "click" this.navigated}}>
          <Icon @name="shield-check" />
          Runs locally · no uploads
        </LinkTo>
      </footer>
    </nav>
  </template>
}
