import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import CanonButton from 'delphicanon/components/canon-button';
import CanonDialog from 'delphicanon/components/canon-dialog';
import CanonEmptyRow from 'delphicanon/components/canon-empty-row';
import CanonGrid from 'delphicanon/components/canon-grid';
import CanonRow from 'delphicanon/components/canon-row';
import CanonStatus from 'delphicanon/components/canon-status';
import { typeInfo } from 'xsenze-tools/lib/story/project-types';
import type { Project } from 'xsenze-tools/lib/story/types';

interface Line {
  id: string;
  title: string;
  detail: string;
  current: boolean;
}

export interface ProjectsDialogSignature {
  Args: {
    open: boolean;
    /** Newest first. */
    projects: readonly Project[];
    currentId?: string;
    onOpen: (id: string) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
  };
}

const when = (ms: number) =>
  new Date(ms).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** The projects kept in this browser: open one, or delete it after a second tap. */
export default class ProjectsDialog extends Component<ProjectsDialogSignature> {
  /** The project a Delete tap is waiting to confirm. */
  @tracked deleting: string | undefined;

  get lines(): Line[] {
    return this.args.projects.map((p) => ({
      id: p.id,
      title: p.title,
      detail: `${typeInfo(p.type).name} · saved ${when(p.updated)}`,
      current: p.id === this.args.currentId,
    }));
  }

  get deletingTitle(): string {
    return this.args.projects.find((p) => p.id === this.deleting)?.title ?? '';
  }

  ask = (id: string) => (this.deleting = id);
  cancel = () => (this.deleting = undefined);

  confirm = () => {
    if (this.deleting) this.args.onDelete(this.deleting);
    this.deleting = undefined;
  };

  closed = () => {
    this.deleting = undefined;
    this.args.onClose();
  };

  <template>
    <CanonDialog
      class="ss-projects"
      @open={{@open}}
      @title="Saved projects"
      @message="Kept in this browser. Use Save file to move one to another device."
      @onClose={{this.closed}}
    >
      <:default>
        {{#each this.lines key="id" as |line|}}
          <CanonRow @title={{line.title}} @detail={{line.detail}}>
            <CanonGrid>
              <CanonButton
                @kind="cell"
                @text={{if line.current "Open now" "Open"}}
                @disabled={{line.current}}
                @onClick={{fn @onOpen line.id}}
              />
              <CanonButton
                @kind="cell"
                @text="Delete"
                @onClick={{fn this.ask line.id}}
              />
            </CanonGrid>
          </CanonRow>
        {{else}}
          <CanonEmptyRow @text="No saved projects yet" />
        {{/each}}
        {{#if this.deleting}}
          <CanonStatus
            @text="Delete “{{this.deletingTitle}}”? This cannot be undone."
            @tone="warn"
            @row={{true}}
          />
          <CanonGrid>
            <CanonButton @text="Keep it" @onClick={{this.cancel}} />
            <CanonButton
              @kind="primary"
              @text="Delete"
              @onClick={{this.confirm}}
            />
          </CanonGrid>
        {{/if}}
      </:default>
      <:footer as |close|>
        <CanonButton @text="Close" @onClick={{fn close ""}} />
      </:footer>
    </CanonDialog>
  </template>
}
