import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import CanonButton from 'delphicanon/components/canon-button';
import CanonDialog from 'delphicanon/components/canon-dialog';
import NewProject, {
  sharedAnswers,
  type Seed,
} from 'xsenze-tools/components/tools/story-studio/new-project';
import ProjectView from 'xsenze-tools/components/tools/story-studio/project-view';
import ProjectsDialog from 'xsenze-tools/components/tools/story-studio/projects-dialog';
import { downloadText } from 'xsenze-tools/lib/download';
import {
  ProjectStore,
  copyOf,
  projectFileName,
  projectFileText,
  readProjectFile,
} from 'xsenze-tools/lib/story/project-store';
import { list } from 'xsenze-tools/lib/story/project-types';
import type { Project } from 'xsenze-tools/lib/story/types';
import type { Tool } from 'xsenze-tools/lib/tools';
import './story-studio/story-studio.css';

interface StoryStudioSignature {
  Args: { tool: Tool };
}

/**
 * Story Studio: plan a Course, Story or Movie, then (in later phases) get
 * every character, place, frame and video prompt for it. Runs entirely in
 * the browser; the chatbot steps are the user's own copy and paste.
 */
export default class StoryStudio extends Component<StoryStudioSignature> {
  store = new ProjectStore();

  /** New project is showing over an open project. */
  @tracked creating = false;
  @tracked seed: Seed | undefined;
  @tracked projectsOpen = false;
  /** Why a picked file could not be opened. */
  @tracked fileProblem: string | undefined;
  /** A project from a file whose id this browser already has. */
  @tracked clash: Project | undefined;

  get project(): Project | undefined {
    return this.creating ? undefined : this.store.current;
  }

  get canCancel() {
    return !!this.store.current;
  }

  get hasProblem() {
    return !!this.fileProblem;
  }

  get hasClash() {
    return !!this.clash;
  }

  get clashText() {
    return `“${this.clash?.title ?? ''}” is already in this browser. Replace it with the one in the file, or keep both?`;
  }

  startNew = () => {
    this.seed = undefined;
    this.creating = true;
  };

  startCopy = (project: Project) => {
    const answers = sharedAnswers(project.answers);
    // a story that comes along is one the copy already has
    if (project.story.trim())
      answers.have = [...new Set([...list(answers, 'have'), 'story'])];
    this.seed = {
      answers,
      carried: {
        story: project.story,
        synopsis: project.synopsis,
        logline: project.logline,
        assets: project.assets,
        tools: project.tools,
        style: project.style,
      },
      title: `${project.title} (copy)`,
      from: project.title,
    };
    this.creating = true;
  };

  cancelNew = () => {
    this.creating = false;
    this.seed = undefined;
  };

  created = (project: Project) => {
    this.store.add(project);
    this.creating = false;
    this.seed = undefined;
  };

  showProjects = () => (this.projectsOpen = true);
  hideProjects = () => (this.projectsOpen = false);

  openProject = (id: string) => {
    this.store.open(id);
    this.creating = false;
    this.seed = undefined;
    this.projectsOpen = false;
  };

  deleteProject = (id: string) => this.store.remove(id);

  saveFile = (project: Project) =>
    downloadText(
      projectFileText(project),
      projectFileName(project),
      'application/json',
    );

  openFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) void this.#read(file);
    });
    input.click();
  };

  async #read(file: File) {
    const result = readProjectFile(await file.text().catch(() => ''));
    if (this.isDestroying) return;
    if ('error' in result) {
      this.fileProblem = result.error;
      return;
    }
    if (this.store.find(result.project.id)) {
      this.clash = result.project;
      return;
    }
    this.#take(result.project);
  }

  #take(project: Project) {
    this.store.add(project);
    this.creating = false;
    this.seed = undefined;
    this.projectsOpen = false;
  }

  problemClosed = () => (this.fileProblem = undefined);

  /** Replace, Keep both, or a dismiss that keeps things as they are. */
  clashClosed = (choice: string) => {
    const { clash } = this;
    this.clash = undefined;
    if (!clash) return;
    if (choice === 'replace') this.#take(clash);
    else if (choice === 'both')
      this.#take(copyOf(clash, `${clash.title} (copy)`));
  };

  <template>
    {{#if this.project}}
      <ProjectView
        @project={{this.project}}
        @store={{this.store}}
        @onNew={{this.startNew}}
        @onCopy={{this.startCopy}}
        @onProjects={{this.showProjects}}
        @onOpenFile={{this.openFile}}
        @onSaveFile={{this.saveFile}}
      />
    {{else}}
      <NewProject
        @seed={{this.seed}}
        @saved={{this.store.projects.length}}
        @onCancel={{if this.canCancel this.cancelNew}}
        @onCreate={{this.created}}
        @onProjects={{this.showProjects}}
        @onOpenFile={{this.openFile}}
      />
    {{/if}}

    <ProjectsDialog
      @open={{this.projectsOpen}}
      @projects={{this.store.sorted}}
      @currentId={{this.store.currentId}}
      @onOpen={{this.openProject}}
      @onDelete={{this.deleteProject}}
      @onClose={{this.hideProjects}}
    />

    <CanonDialog
      @open={{this.hasProblem}}
      @title="Cannot open this file"
      @message={{this.fileProblem}}
      @onClose={{this.problemClosed}}
    >
      <:footer as |close|>
        <CanonButton @kind="primary" @text="OK" @onClick={{fn close ""}} />
      </:footer>
    </CanonDialog>

    <CanonDialog
      @open={{this.hasClash}}
      @title="This project is already here"
      @message={{this.clashText}}
      @onClose={{this.clashClosed}}
    >
      <:footer as |close|>
        <CanonButton @text="Keep both" @onClick={{fn close "both"}} />
        <CanonButton
          @kind="primary"
          @text="Replace"
          @onClick={{fn close "replace"}}
        />
      </:footer>
    </CanonDialog>
  </template>
}
