import Component from '@glimmer/component';
import XzButton from 'xsenze-tools/components/xz/button';
import XzCodeBlock from 'xsenze-tools/components/xz/code-block';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSplit from 'xsenze-tools/components/xz/split';
import XzStatus from 'xsenze-tools/components/xz/status';
import TabBar from 'xsenze-tools/components/tools/story-studio/tab-bar';
import { downloadText } from 'xsenze-tools/lib/download';
import {
  allPrompts,
  projectMarkdown,
  promptsCsv,
  stemOf,
} from 'xsenze-tools/lib/story/export';
import type { Project } from 'xsenze-tools/lib/story/types';

export interface ExportTabSignature {
  Args: {
    project: Project;
    tab: number;
    onTab: (index: number) => void;
  };
}

/** The whole project as Markdown, and the picture prompts as CSV. */
export default class ExportTab extends Component<ExportTabSignature> {
  get markdown() {
    return projectMarkdown(this.args.project);
  }

  get promptCount() {
    return allPrompts(this.args.project).length;
  }

  get csvNote() {
    const n = this.promptCount;
    return n
      ? `CSV: ${n} picture prompt${n === 1 ? '' : 's'}, one row each, for a spreadsheet.`
      : 'CSV: no picture prompts yet. Read the story first.';
  }

  saveMarkdown = () =>
    downloadText(
      this.markdown,
      `${stemOf(this.args.project)}.md`,
      'text/markdown;charset=utf-8',
    );

  saveCsv = () =>
    downloadText(
      promptsCsv(this.args.project),
      `${stemOf(this.args.project)} prompts.csv`,
      'text/csv;charset=utf-8',
    );

  <template>
    <XzSplit class="story-studio">
      <:sidebar>
        <TabBar @selected={{@tab}} @onChange={{@onTab}} />
        <XzRows @framed={{true}}>
          <XzHeading @text="Export" />
          <XzStatus
            @text="Markdown: the plan, the story summary, the list, the outline, every picture prompt and the story."
            @tone="muted"
            @row={{true}}
          />
          <XzButton
            @kind="primary"
            @text="Download Markdown"
            @onClick={{this.saveMarkdown}}
          />
          <XzStatus @text={{this.csvNote}} @tone="muted" @row={{true}} />
          <XzButton @text="Download CSV" @onClick={{this.saveCsv}} />
          <XzStatus
            @text="Shots and their frame and video prompts join the export in a later phase."
            @tone="muted"
            @row={{true}}
          />
        </XzRows>
      </:sidebar>
      <:main>
        <XzRows @framed={{true}}>
          <XzHeading @text="Preview" />
          <XzCodeBlock
            class="ss-prompt"
            @code={{this.markdown}}
            @language="Markdown"
            @maxHeight={{640}}
          />
        </XzRows>
      </:main>
    </XzSplit>
  </template>
}
