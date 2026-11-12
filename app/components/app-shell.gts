import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import AppSidebar from 'xsenze-tools/components/app-sidebar';
import ThemeToggle from 'xsenze-tools/components/theme-toggle';
import Icon from 'xsenze-tools/components/icon';
import { findTool } from 'xsenze-tools/lib/tools';
import './app-shell.css';

interface Signature {
  Blocks: { default: [] };
}

export default class AppShell extends Component<Signature> {
  @service declare router: RouterService;
  @tracked navOpen = false;

  openNav = () => (this.navOpen = true);
  closeNav = () => (this.navOpen = false);

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
    <a class="skip-link" href="#main-content">Skip to content</a>
    <div class="shell {{if this.navOpen 'shell--nav-open'}}">
      <AppSidebar class="shell__sidebar" @onNavigate={{this.closeNav}} />
      {{#if this.navOpen}}
        <button
          type="button"
          class="shell__scrim"
          aria-label="Close menu"
          {{on "click" this.closeNav}}
        ></button>
      {{/if}}

      <div class="shell__body">
        <header class="topbar">
          <button
            type="button"
            class="topbar__menu square-button"
            aria-label="Open menu"
            {{on "click" this.openNav}}
          >
            <Icon @name="menu" />
          </button>
          <h1 class="topbar__title">{{this.pageTitle}}</h1>
          <div class="topbar__actions">
            <ThemeToggle class="square-button" />
          </div>
        </header>
        <main id="main-content" class="shell__main" tabindex="-1">
          {{yield}}
        </main>
      </div>
    </div>
  </template>
}
