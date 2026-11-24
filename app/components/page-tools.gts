import type { TOC } from '@ember/component/template-only';

/** The top bar's slot for a tool's own buttons (in components/app-shell.gts). */
const slot = () => document.getElementById('page-tools');

/** Renders its block in the top bar, next to the theme button. */
const PageTools: TOC<{ Blocks: { default: [] } }> = <template>
  {{#let (slot) as |target|}}
    {{#if target}}
      {{#in-element target insertBefore=null}}
        {{yield}}
      {{/in-element}}
    {{/if}}
  {{/let}}
</template>;

export default PageTools;
