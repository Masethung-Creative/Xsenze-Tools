import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import XzButton from 'xsenze-tools/components/xz/button';
import XzDialog from 'xsenze-tools/components/xz/dialog';
import NewProject, {
  sharedAnswers,
  type Seed,
} from 'xsenze-tools/components/tools/ai-studio/story-studio/new-project';
import ProjectView from 'xsenze-tools/components/tools/ai-studio/story-studio/project-view';
import ProjectsDialog from 'xsenze-tools/components/tools/ai-studio/story-studio/projects-dialog';
import { downloadText } from 'xsenze-tools/lib/download';
import {
  PROJECT_FILE_ACCEPT,
  ProjectStore,
  copyOf,
  projectFileName,
  projectFileText,
  readProjectFile,
} from 'xsenze-tools/lib/ai-studio/story/project-store';
import { list } from 'xsenze-tools/lib/ai-studio/story/project-types';
import type { Project } from 'xsenze-tools/lib/ai-studio/story/types';
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
  /** Why picked files could not be opened. */
  @tracked fileProblem: string | undefined;
  /** Projects from files whose ids this browser already has. */
  @tracked clashes: Project[] = [];

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
    return this.clashes.length > 0;
  }

  get clashTitle() {
    return this.clashes.length > 1
      ? 'These projects are already here'
      : 'This project is already here';
  }

  get clashText() {
    const titles = this.clashes.map((p) => `“${p.title}”`);
    if (titles.length < 2)
      return `${titles[0] ?? ''} is already in this browser. Replace it with the one in the file, or keep both?`;
    const named = `${titles.slice(0, -1).join(', ')} and ${titles.at(-1)}`;
    return `${named} are already in this browser. Replace them with the ones in the files, or keep both?`;
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
    input.accept = PROJECT_FILE_ACCEPT;
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) void this.#readAll([file]);
    });
    input.click();
  };

  /** Files dropped or chosen in Saved projects. */
  openFiles = (files: File[]) => void this.#readAll(files);

  /**
   * Adds the project in each file, settings and all, and opens the first.
   * A project this browser already has waits for Replace or Keep both.
   */
  async #readAll(files: File[]) {
    const read = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        result: readProjectFile(await file.text().catch(() => '')),
      })),
    );
    if (this.isDestroying) return;
    const problems: string[] = [];
    const clashes: Project[] = [];
    const added: Project[] = [];
    for (const { name, result } of read) {
      if ('error' in result) {
        problems.push(
          read.length > 1 ? `${name}: ${result.error}` : result.error,
        );
      } else if (this.store.find(result.project.id)) {
        // so is a second file of a project added just now
        clashes.push(result.project);
      } else {
        this.store.add(result.project);
        added.push(result.project);
      }
    }
    this.#show(added[0]);
    if (problems.length) this.fileProblem = problems.join(' ');
    if (clashes.length) this.clashes = clashes;
  }

  /** Opens a project that is in the store and closes whatever covered it. */
  #show(project: Project | undefined) {
    if (!project) return;
    this.store.open(project.id);
    this.creating = false;
    this.seed = undefined;
    this.projectsOpen = false;
  }

  problemClosed = () => (this.fileProblem = undefined);

  /** Replace, Keep both, or a dismiss that keeps things as they are. */
  clashClosed = (choice: string) => {
    const { clashes } = this;
    this.clashes = [];
    if (choice !== 'replace' && choice !== 'both') return;
    const taken = clashes.map((p) =>
      choice === 'replace' ? p : copyOf(p, `${p.title} (copy)`),
    );
    for (const project of taken) this.store.add(project);
    this.#show(taken[0]);
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
      @onFiles={{this.openFiles}}
      @onClose={{this.hideProjects}}
    />

    <XzDialog
      @open={{this.hasProblem}}
      @title="Cannot open this file"
      @message={{this.fileProblem}}
      @onClose={{this.problemClosed}}
    >
      <:footer as |close|>
        <XzButton @kind="primary" @text="OK" @onClick={{fn close ""}} />
      </:footer>
    </XzDialog>

    <XzDialog
      @open={{this.hasClash}}
      @title={{this.clashTitle}}
      @message={{this.clashText}}
      @onClose={{this.clashClosed}}
    >
      <:footer as |close|>
        <XzButton @text="Keep both" @onClick={{fn close "both"}} />
        <XzButton
          @kind="primary"
          @text="Replace"
          @onClick={{fn close "replace"}}
        />
      </:footer>
    </XzDialog>
  </template>
}
