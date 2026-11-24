import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { modifier } from 'ember-modifier';
import AppSidebar from 'xsenze-tools/components/app-sidebar';
import ThemeToggle from 'xsenze-tools/components/theme-toggle';
import Icon from 'xsenze-tools/components/icon';
import { findTool } from 'xsenze-tools/lib/tools';
import './app-shell.css';

const RAIL_KEY = 'xsenze.sidebar-rail';

function readRail(): boolean {
  try {
    return localStorage.getItem(RAIL_KEY) === '1';
  } catch {
    return false;
  }
}

interface Signature {
  Blocks: { default: [] };
}

/** Opens the native dialog as a modal while it is rendered. */
const modal = modifier((dialog: HTMLDialogElement) => {
  if (!dialog.open) dialog.showModal();
  return () => dialog.close();
});

/**
 * The kit's app shell: the sidebar from 1024px up, a drawer below that, and
 * a top bar with the page title. Only the content area scrolls, so a tool can
 * fill it.
 */
export default class AppShell extends Component<Signature> {
  @service declare router: RouterService;
  @tracked navOpen = false;
  /** The desktop sidebar folded to icons; kept on this device. */
  @tracked rail = readRail();

  toggleRail = () => {
    this.rail = !this.rail;
    try {
      localStorage.setItem(RAIL_KEY, this.rail ? '1' : '0');
    } catch {
      // storage blocked: the choice lasts for this visit
    }
  };

  /** Ctrl+B / Cmd+B folds or opens the sidebar, outside text fields. */
  railKey = modifier(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'b') return;
      const t = e.target as HTMLElement | null;
      if (
        t?.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName ?? '')
      )
        return;
      e.preventDefault();
      this.toggleRail();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  openNav = () => (this.navOpen = true);
  closeNav = () => (this.navOpen = false);

  /** A click on the backdrop lands on the dialog itself. */
  backdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) this.closeNav();
  };

  get pageTitle(): string {
    const route = this.router.currentRoute;
    switch (route?.name) {
      case 'index':
        return 'Home';
      case 'tools.tool': {
        const id = route.params?.['tool_id'];
        return (typeof id === 'string' && findTool(id)?.name) || 'Tool';
      }
      case 'privacy':
        return 'Privacy';
      case undefined:
        return '';
      default:
        return 'Not found';
    }
  }

  <template>
    <a class="xz-skip-link" href="#main-content">Skip to content</a>
    <div class="xz-shell app-shell" {{this.railKey}}>
      <AppSidebar @rail={{this.rail}} @onToggleRail={{this.toggleRail}} />

      <div class="xz-shell__main">
        <header class="xz-navbar xz-navbar--static">
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--icon xz-shell__toggle"
            aria-label="Open menu"
            {{on "click" this.openNav}}
          >
            <Icon @name="menu" />
          </button>
          <h1 class="xz-navbar__title">{{this.pageTitle}}</h1>
          <span class="xz-navbar__spacer"></span>
          <div class="xz-navbar__actions">
            {{! a tool may put its own buttons here (see PageTools) }}
            <div id="page-tools" class="app-shell__tools"></div>
            <ThemeToggle />
          </div>
        </header>
        <main id="main-content" class="app-shell__content" tabindex="-1">
          {{yield}}
        </main>
      </div>
    </div>

    {{#if this.navOpen}}
      {{! a click on the backdrop closes the drawer; Escape and the close button do too }}
      {{! template-lint-disable no-invalid-interactive }}
      <dialog
        class="xz-drawer xz-drawer--left xz-drawer--nav"
        aria-label="Menu"
        {{modal}}
        {{on "close" this.closeNav}}
        {{on "click" this.backdropClick}}
      >
        <AppSidebar @onNavigate={{this.closeNav}} @onClose={{this.closeNav}} />
      </dialog>
    {{/if}}
  </template>
}
