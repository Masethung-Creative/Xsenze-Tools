import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import XzButton from 'xsenze-tools/components/xz/button';
import XzDialog from 'xsenze-tools/components/xz/dialog';
import XzDropZone from 'xsenze-tools/components/xz/drop-zone';
import XzEmptyRow from 'xsenze-tools/components/xz/empty-row';
import XzGrid from 'xsenze-tools/components/xz/grid';
import XzRow from 'xsenze-tools/components/xz/row';
import XzStatus from 'xsenze-tools/components/xz/status';
import { IconSvg } from 'xsenze-tools/components/icon';
import { PROJECT_FILE_ACCEPT } from 'xsenze-tools/lib/ai-studio/story/project-store';
import { typeInfo } from 'xsenze-tools/lib/ai-studio/story/project-types';
import type { Project } from 'xsenze-tools/lib/ai-studio/story/types';

const FolderIcon = <template><IconSvg @name="folder-open" /></template>;

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
    /** Project files dropped or chosen here. */
    onFiles: (files: File[]) => void;
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

/**
 * The projects kept in this browser: open one, delete one after a second
 * tap, or bring one in from its project file with every setting in place.
 */
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
    <XzDialog
      class="ss-projects"
      @open={{@open}}
      @title="Saved projects"
      @message="Kept in this browser. Use Save file to move one to another device."
      @onClose={{this.closed}}
    >
      <:header>
        <XzDropZone
          @prompt="Drop a project file (.story.json) here, or press Files. It opens with all its settings."
          @icon={{FolderIcon}}
          @accept={{PROJECT_FILE_ACCEPT}}
          @multiple={{true}}
          @paste={{false}}
          @onFiles={{@onFiles}}
        />
      </:header>
      <:default>
        {{#each this.lines key="id" as |line|}}
          <XzRow @title={{line.title}} @detail={{line.detail}}>
            <XzGrid>
              <XzButton
                @kind="cell"
                @text={{if line.current "Open now" "Open"}}
                @disabled={{line.current}}
                @onClick={{fn @onOpen line.id}}
              />
              <XzButton
                @kind="cell"
                @text="Delete"
                @onClick={{fn this.ask line.id}}
              />
            </XzGrid>
          </XzRow>
        {{else}}
          <XzEmptyRow @text="No saved projects yet" />
        {{/each}}
        {{#if this.deleting}}
          <XzStatus
            @text="Delete “{{this.deletingTitle}}”? This cannot be undone."
            @tone="warn"
            @row={{true}}
          />
          <XzGrid>
            <XzButton @text="Keep it" @onClick={{this.cancel}} />
            <XzButton
              @kind="primary"
              @text="Delete"
              @onClick={{this.confirm}}
            />
          </XzGrid>
        {{/if}}
      </:default>
      <:footer as |close|>
        <XzButton @text="Close" @onClick={{fn close ""}} />
      </:footer>
    </XzDialog>
  </template>
}
