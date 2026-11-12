import type { TOC } from '@ember/component/template-only';
import { pageTitle } from 'ember-page-title';
import type { ToolModel } from 'xsenze-tools/routes/tools/tool';

// the tool fills the area under the top bar, which already shows its name
const ToolTemplate: TOC<{ Args: { model: ToolModel | undefined } }> = <template>
  {{#if @model}}
    {{pageTitle @model.tool.name}}
    <div class="canon-tool">
      {{#if @model.component}}
        {{#let @model.component as |ToolUi|}}
          <ToolUi @tool={{@model.tool}} />
        {{/let}}
      {{else}}
        <p class="canon-tool__pending">This tool is still being built.</p>
      {{/if}}
    </div>
  {{/if}}
</template>;

export default ToolTemplate;
