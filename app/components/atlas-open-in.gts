import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { LinkTo } from '@ember/routing';
import Icon from 'xsenze-tools/components/icon';
import { giveFile } from 'xsenze-tools/lib/handoff';
import { toolsForFile } from 'xsenze-tools/lib/tools';
import type { Tool } from 'xsenze-tools/lib/tools';

type Entry = Pick<Tool, 'id' | 'name' | 'icon'>;

interface Signature {
  Args: {
    /** The loaded file; the list is every other tool that accepts it. */
    file?: File | null;
    /** This tool's id, left out of the list. */
    self?: string;
    /** A fixed list instead (the blank state). */
    tools?: Entry[];
  };
}

/** Links to the other tools that can open a file, handing the file over. */
export default class AtlasOpenIn extends Component<Signature> {
  @cached
  get tools(): Entry[] {
    if (this.args.tools) return this.args.tools;
    const file = this.args.file;
    if (!file) return [];
    return toolsForFile(file).filter((tool) => tool.id !== this.args.self);
  }

  pick = () => {
    const file = this.args.file;
    if (file) giveFile(file);
  };

  <template>
    {{#if this.tools.length}}
      <div class="atlas-open">
        {{#each this.tools key="id" as |tool|}}
          <LinkTo
            @route="tools.tool"
            @model={{tool.id}}
            data-tool={{tool.id}}
            {{on "click" this.pick}}
          >
            <Icon @name={{tool.icon}} />
            <span>{{tool.name}}</span>
          </LinkTo>
        {{/each}}
      </div>
    {{/if}}
  </template>
}
