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
    <div class="xz-shell app-shell">
      <AppSidebar />

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
