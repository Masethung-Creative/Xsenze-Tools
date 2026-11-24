import Component from '@glimmer/component';
import type { TOC } from '@ember/component/template-only';
import type { ComponentLike } from '@glint/template';
import XzBar from 'xsenze-tools/components/xz/bar';
import XzButton from 'xsenze-tools/components/xz/button';
import XzGrid from 'xsenze-tools/components/xz/grid';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzLoader from 'xsenze-tools/components/xz/loader';
import XzRow from 'xsenze-tools/components/xz/row';
import XzStatus from 'xsenze-tools/components/xz/status';
import { IconSvg } from 'xsenze-tools/components/icon';
import { downloadIcon, passAlong } from 'xsenze-tools/lib/flow-hooks';

export interface JobResult {
  name: string;
  detail: string;
}

export interface JobSignature {
  Args: {
    /** The verb on the export button. */
    title: string;
    icon: ComponentLike;
    /** Shown when the job fails. */
    failure: string;
    disabled?: boolean;
    busy: boolean;
    /** 0 to 1 while busy; none for a job that cannot tell, which shows the loader alone. */
    progress?: number;
    failed: boolean;
    result?: JobResult | null;
    onRun: () => void;
    /** Shows Cancel while busy. */
    onCancel?: () => void;
    onSave: () => void;
    /** Shows Preview beside Download. */
    onPreview?: () => void;
  };
}

const Cancel = <template><IconSvg @name="x" /></template>;
const Eye = <template><IconSvg @name="eye" /></template>;
const Save = <template><IconSvg @name={{(downloadIcon)}} /></template>;

/** Job's busy rows: progress, its bar when known, and Cancel. */
export class JobProgress extends Component<{
  Args: { progress?: number; onCancel?: () => void };
}> {
  get share() {
    return this.args.progress ?? 0;
  }

  get percent() {
    const { progress } = this.args;
    return progress === undefined ? '' : `${Math.round(progress * 100)}%`;
  }

  <template>
    <XzRow class="media-job-progress" @title="Processing…">
      <span class="media-job-percent">
        <XzLoader @cell={{5}} @gap={{1}} />
        <span role="status">{{this.percent}}</span>
      </span>
    </XzRow>
    {{#if this.percent}}
      <XzBar class="media-job-bar" @share={{this.share}} />
    {{/if}}
    {{#if @onCancel}}
      <XzButton
        class="media-job-cancel"
        @text="Cancel"
        @icon={{Cancel}}
        @onClick={{@onCancel}}
      />
    {{/if}}
  </template>
}

/**
 * Rows for a XzRows: the export button,
 * progress with Cancel, then the finished file with Download (a workflow
 * passes it along) in place of Preview and Share.
 */
const Job: TOC<JobSignature> = <template>
  {{#if @busy}}
    <JobProgress @progress={{@progress}} @onCancel={{@onCancel}} />
  {{else}}
    <XzButton
      class="media-job-run"
      @kind="primary"
      @text={{@title}}
      @icon={{@icon}}
      @iconStyle="oversized"
      @disabled={{@disabled}}
      @onClick={{@onRun}}
    />
    {{#if @failed}}
      <XzStatus @text={{@failure}} @tone="warn" @row={{true}} />
    {{/if}}
    {{#if @result}}
      <XzHeading @text="Result" />
      <XzRow
        class="media-job-result"
        @title={{@result.name}}
        @detail={{@result.detail}}
      />
      {{#if @onPreview}}
        <XzGrid>
          <XzButton
            class="media-job-preview"
            @text="Preview"
            @icon={{Eye}}
            @onClick={{@onPreview}}
          />
          <XzButton
            class="media-job-save"
            @kind="primary"
            @text={{passAlong "Download"}}
            @icon={{Save}}
            @onClick={{@onSave}}
          />
        </XzGrid>
      {{else}}
        <XzButton
          class="media-job-save"
          @kind="primary"
          @text={{passAlong "Download"}}
          @icon={{Save}}
          @onClick={{@onSave}}
        />
      {{/if}}
    {{/if}}
  {{/if}}
</template>;

export default Job;
