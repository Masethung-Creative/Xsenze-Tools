import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { concat } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { LinkTo } from '@ember/routing';
import type RouterService from '@ember/routing/router-service';
import { modifier } from 'ember-modifier';
import BrandLogo from 'xsenze-tools/components/brand-logo';
import Icon from 'xsenze-tools/components/icon';
import { toolCategories, toolMatches } from 'xsenze-tools/lib/tools';
import './app-sidebar.css';

interface Signature {
  Args: {
    /** Called after a link is followed, so the mobile drawer can close. */
    onNavigate?: () => void;
    /** Shown in the drawer: adds a close button to the header. */
    onClose?: () => void;
    /** Folded to a strip of icons. */
    rail?: boolean;
    /** Folds or opens the sidebar; adds the button for it to the header. */
    onToggleRail?: () => void;
  };
  Element: HTMLElement;
}

/** Ctrl+K / Cmd+K focuses the tool search from anywhere. */
const focusOnCtrlK = modifier((input: HTMLInputElement) => {
  const onKey = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      // the desktop sidebar is hidden while the drawer is in use
      if (!input.checkVisibility()) return;
      e.preventDefault();
      input.focus();
      input.select();
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
});

/** The kit's sidebar: logo, tool search, one section per category. */
export default class AppSidebar extends Component<Signature> {
  @service declare router: RouterService;
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

  /** The route the kit's aria-current="page" highlight goes on. */
  get here(): string {
    const route = this.router.currentRoute;
    if (route?.name === 'tools.tool') {
      const id = route.params?.['tool_id'];
      return typeof id === 'string' ? id : '';
    }
    return route?.name === 'index' ? 'index' : '';
  }

  current = (id: string) => (this.here === id ? 'page' : undefined);

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

  close = () => this.args.onClose?.();
  toggleRail = () => this.args.onToggleRail?.();

  <template>
    <aside
      class="xz-sidebar app-sidebar {{if @rail 'xz-sidebar--rail'}}"
      ...attributes
    >
      <div class="xz-sidebar__header">
        <LinkTo @route="index" class="xz-logo" {{on "click" this.navigated}}>
          <BrandLogo class="xz-logo__mark" @size={{28}} />
          <span>xsenze tools</span>
        </LinkTo>
        {{#if @onToggleRail}}
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--icon xz-sidebar__toggle app-sidebar__fold"
            aria-label={{if @rail "Open the sidebar" "Close the sidebar"}}
            title={{if
              @rail
              "Open the sidebar (Ctrl B)"
              "Close the sidebar (Ctrl B)"
            }}
            aria-expanded={{if @rail "false" "true"}}
            {{on "click" this.toggleRail}}
          >
            <Icon @name={{if @rail "panel-left-open" "panel-left-close"}} />
          </button>
        {{/if}}
        {{#if @onClose}}
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--icon xz-sidebar__toggle"
            aria-label="Close menu"
            {{on "click" this.close}}
          >
            <Icon @name="x" />
          </button>
        {{/if}}
      </div>

      <div class="app-sidebar__search">
        <label class="xz-input-group">
          <Icon @name="search" class="xz-input-group__icon" />
          <span class="sr-only">Search tools</span>
          <input
            class="xz-input"
            type="search"
            placeholder="Search tools…"
            value={{this.query}}
            {{on "input" this.updateQuery}}
            {{on "keydown" this.clearOnEscape}}
            {{focusOnCtrlK}}
          />
          <kbd class="xz-kbd xz-input-group__kbd">Ctrl K</kbd>
        </label>
      </div>

      <nav class="app-sidebar__scroll" aria-label="Tools">
        <div class="xz-sidebar__section">
          <ul class="xz-sidebar__nav">
            <li>
              <LinkTo
                @route="index"
                class="xz-sidebar__link"
                aria-current={{this.current "index"}}
                {{on "click" this.navigated}}
              >
                <Icon @name="house" />
                Home
              </LinkTo>
            </li>
          </ul>
        </div>

        {{#each this.categories as |cat|}}
          <div class="xz-sidebar__section">
            <div class="xz-sidebar__heading" id="nav-{{cat.id}}">
              {{cat.name}}
            </div>
            {{#if cat.tools.length}}
              <ul class="xz-sidebar__nav" aria-labelledby="nav-{{cat.id}}">
                {{#each cat.tools as |tool|}}
                  <li>
                    <LinkTo
                      @route="tools.tool"
                      @model={{tool.id}}
                      class="xz-sidebar__link"
                      title={{if
                        @rail
                        (if tool.beta (concat tool.name " (beta)") tool.name)
                        tool.description
                      }}
                      aria-current={{this.current tool.id}}
                      {{on "click" this.navigated}}
                    >
                      <Icon @name={{tool.icon}} />
                      <span class="xz-truncate">{{tool.name}}</span>
                      {{#if tool.beta}}
                        <span class="xz-badge xz-badge--highlight">beta</span>
                      {{/if}}
                    </LinkTo>
                  </li>
                {{/each}}
              </ul>
            {{else}}
              <p class="app-sidebar__empty">
                <Icon @name={{cat.icon}} />
                Coming soon
              </p>
            {{/if}}
          </div>
        {{/each}}

        {{#unless this.hasResults}}
          <p class="app-sidebar__empty">No tools match “{{this.query}}”</p>
        {{/unless}}
      </nav>

      <div class="xz-sidebar__footer">
        <LinkTo
          @route="privacy"
          class="xz-link xz-link--quiet app-sidebar__privacy"
          {{on "click" this.navigated}}
        >
          <Icon @name="shield-check" />
          Runs locally · no uploads
        </LinkTo>
      </div>
    </aside>
  </template>
}
