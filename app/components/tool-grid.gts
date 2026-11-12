import type { TOC } from '@ember/component/template-only';
import { LinkTo } from '@ember/routing';
import Icon from 'xsenze-tools/components/icon';
import type { ToolCategory } from 'xsenze-tools/lib/tools';

/** Category strip + bordered cell grid. */
const ToolGrid: TOC<{ Args: { categories: ToolCategory[] } }> = <template>
  {{#each @categories as |cat|}}
    <section class="category" aria-labelledby="cat-{{cat.id}}">
      <h2 id="cat-{{cat.id}}" class="category__strip">
        {{cat.name}}
        <Icon @name="chevron-right" />
        <span class="category__desc">{{cat.description}}</span>
      </h2>

      <ul class="cell-grid">
        {{#each cat.tools as |tool|}}
          <li>
            <LinkTo @route="tools.tool" @model={{tool.id}} class="cell">
              <Icon @name={{tool.icon}} class="cell__icon" />
              <span class="cell__name">{{tool.name}}</span>
              <span class="cell__desc">{{tool.description}}</span>
            </LinkTo>
          </li>
        {{else}}
          <li>
            <div class="cell cell--placeholder">
              <Icon @name={{cat.icon}} class="cell__icon" />
              <span class="cell__name">Coming soon</span>
              <span class="cell__desc">
                The first
                {{cat.name}}
                tool is on its way.
              </span>
            </div>
          </li>
        {{/each}}
      </ul>
    </section>
  {{/each}}
</template>;

export default ToolGrid;
