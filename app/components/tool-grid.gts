import type { TOC } from '@ember/component/template-only';
import { LinkTo } from '@ember/routing';
import Icon from 'xsenze-tools/components/icon';
import type { ToolCategory } from 'xsenze-tools/lib/tools';

/** Each category as a heading over a grid of kit cards, one per tool. */
const ToolGrid: TOC<{ Args: { categories: ToolCategory[] } }> = <template>
  {{#each @categories as |cat|}}
    <section class="category" aria-labelledby="cat-{{cat.id}}">
      <header class="category__head">
        <h2 id="cat-{{cat.id}}" class="xz-h5">{{cat.name}}</h2>
        <p class="xz-small xz-text-muted">{{cat.description}}</p>
      </header>

      <ul class="tool-cards xz-grid xz-grid--auto">
        {{#each cat.tools as |tool|}}
          <li>
            <LinkTo
              @route="tools.tool"
              @model={{tool.id}}
              class="tool-card xz-card xz-card--interactive"
            >
              <div class="xz-card__body">
                <Icon @name={{tool.icon}} />
                <span class="xz-card__title">
                  {{tool.name}}
                  {{#if tool.beta}}
                    <span class="xz-badge xz-badge--highlight">beta</span>
                  {{/if}}
                </span>
                <span class="xz-card__subtitle">{{tool.description}}</span>
              </div>
            </LinkTo>
          </li>
        {{else}}
          <li>
            <div class="tool-card tool-card--soon xz-card">
              <div class="xz-card__body">
                <Icon @name={{cat.icon}} />
                <span class="xz-card__title">Coming soon</span>
                <span class="xz-card__subtitle">
                  {{#if cat.soon}}
                    {{cat.soon}}
                  {{else}}
                    The first
                    {{cat.name}}
                    tool is on its way.
                  {{/if}}
                </span>
              </div>
            </div>
          </li>
        {{/each}}
      </ul>
    </section>
  {{/each}}
</template>;

export default ToolGrid;
