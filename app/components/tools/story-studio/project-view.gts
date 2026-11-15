import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import CanonButton from 'delphicanon/components/canon-button';
import CanonDialog from 'delphicanon/components/canon-dialog';
import CanonEmptyRow from 'delphicanon/components/canon-empty-row';
import CanonGrid from 'delphicanon/components/canon-grid';
import CanonHeading from 'delphicanon/components/canon-heading';
import CanonRow from 'delphicanon/components/canon-row';
import CanonRows from 'delphicanon/components/canon-rows';
import CanonSegmented from 'delphicanon/components/canon-segmented';
import CanonSplit from 'delphicanon/components/canon-split';
import CanonStatus from 'delphicanon/components/canon-status';
import CanonTextCell from 'delphicanon/components/canon-text-cell';
import Icon from 'xsenze-tools/components/icon';
import Outline from 'xsenze-tools/components/tools/story-studio/outline';
import PlanSummary from 'xsenze-tools/components/tools/story-studio/plan-summary';
import Questions from 'xsenze-tools/components/tools/story-studio/questions';
import {
  untitled,
  type ProjectStore,
} from 'xsenze-tools/lib/story/project-store';
import {
  HAVE_QUESTIONS,
  LOOK_QUESTIONS,
  TYPE_QUESTIONS,
  layoutParts,
  planOf,
  typeInfo,
} from 'xsenze-tools/lib/story/project-types';
import {
  partHasContent,
  type Answers,
  type Part,
  type Project,
} from 'xsenze-tools/lib/story/types';

/** Shots holds each shot's frame and video prompts. */
const TABS = ['Plan', 'Story', 'Bible', 'Assets', 'Shots', 'Export'];
/** Tabs the next phases fill in. */
const LATER = [1, 2, 3, 4, 5];

/** A change that would drop parts with content, waiting for a yes. */
interface Pending {
  answers: Answers;
  parts: Part[];
  lost: Part[];
}

export interface ProjectViewSignature {
  Args: {
    project: Project;
    store: ProjectStore;
    onNew: () => void;
    onCopy: (project: Project) => void;
    onProjects: () => void;
    onOpenFile: () => void;
    onSaveFile: (project: Project) => void;
  };
}

/** An open project: the Plan tab, where every answer but the type can change. */
export default class ProjectView extends Component<ProjectViewSignature> {
  @tracked pending: Pending | undefined;

  tabs = TABS;
  later = LATER;

  get answers(): Answers {
    return this.pending?.answers ?? this.args.project.answers;
  }

  get info() {
    return typeInfo(this.args.project.type);
  }

  get typeQuestions() {
    return TYPE_QUESTIONS[this.args.project.type];
  }

  get haveQuestions() {
    return HAVE_QUESTIONS;
  }

  get lookQuestions() {
    return LOOK_QUESTIONS;
  }

  get placeholder() {
    return untitled(this.args.project.type);
  }

  get asking(): boolean {
    return !!this.pending;
  }

  get askTitle(): string {
    return `Remove ${this.info.parts.toLowerCase()} with titles?`;
  }

  get lostText(): string {
    const lost = this.pending?.lost ?? [];
    const names = lost
      .slice(0, 5)
      .map((p) => `“${p.title.trim()}”`)
      .join(', ');
    const more = lost.length > 5 ? ` and ${lost.length - 5} more` : '';
    const word = (
      lost.length === 1 ? this.info.part : this.info.parts
    ).toLowerCase();
    return `The shorter plan has no room for ${lost.length} ${word} with titles: ${names}${more}.`;
  }

  answer = (answers: Answers) => {
    const { project, store } = this.args;
    const plan = planOf(project.type, answers);
    const { parts, lost } = layoutParts(plan, project.parts, partHasContent);
    if (lost.length) this.pending = { answers, parts, lost };
    else store.put({ ...project, answers, parts });
  };

  /** Keep my plan, or Remove them. */
  settled = (choice: string) => {
    const { pending } = this;
    this.pending = undefined;
    if (pending && choice === 'remove')
      this.args.store.put({
        ...this.args.project,
        answers: pending.answers,
        parts: pending.parts,
      });
  };

  rename = (title: string) =>
    this.args.store.put({ ...this.args.project, title });

  renamePart = (id: string, title: string) => {
    const { project, store } = this.args;
    store.put({
      ...project,
      parts: project.parts.map((p) => (p.id === id ? { ...p, title } : p)),
    });
  };

  copy = () => this.args.onCopy(this.args.project);
  save = () => this.args.onSaveFile(this.args.project);

  <template>
    <CanonSplit class="story-studio">
      <:sidebar>
        <CanonRows @framed={{true}}>
          <CanonSegmented
            class="ss-tabs"
            aria-label="Steps"
            @items={{this.tabs}}
            @selected={{0}}
            @columns={{3}}
            @disabledIndices={{this.later}}
          />
        </CanonRows>

        <CanonRows @framed={{true}}>
          <CanonHeading @text="Project" />
          <CanonRow @title="Name" @form="flush" as |titleId|>
            <CanonTextCell
              @value={{@project.title}}
              @placeholder={{this.placeholder}}
              @onChange={{this.rename}}
              aria-labelledby={{titleId}}
            />
          </CanonRow>
          <CanonRow
            @title="Type"
            @detail="Locked. Copy as new project to use another type."
          >
            <span class="ss-locked">
              <Icon @name="lock" />
              {{this.info.name}}
            </span>
          </CanonRow>
          <CanonGrid @columns={{2}}>
            <CanonButton @text="Save file" @onClick={{this.save}} />
            <CanonButton @text="Open file" @onClick={{@onOpenFile}} />
            <CanonButton @text="Saved projects" @onClick={{@onProjects}} />
            <CanonButton @text="New project" @onClick={{@onNew}} />
            <CanonButton @text="Copy as new project" @onClick={{this.copy}} />
          </CanonGrid>
          {{#unless @store.saves}}
            <CanonStatus
              @text="This browser is not keeping projects. Use Save file to keep your work."
              @tone="warn"
              @row={{true}}
            />
          {{/unless}}
        </CanonRows>

        <CanonRows @framed={{true}}>
          <CanonHeading @text="{{this.info.name}} plan" />
          <Questions
            @type={{@project.type}}
            @questions={{this.typeQuestions}}
            @answers={{this.answers}}
            @onChange={{this.answer}}
          />
        </CanonRows>

        <CanonRows @framed={{true}}>
          <CanonHeading @text="What you already have" />
          <Questions
            @type={{@project.type}}
            @questions={{this.haveQuestions}}
            @answers={{this.answers}}
            @heading="What you already have"
            @onChange={{this.answer}}
          />
        </CanonRows>

        <CanonRows @framed={{true}}>
          <CanonHeading @text="Look and motion" />
          <Questions
            @type={{@project.type}}
            @questions={{this.lookQuestions}}
            @answers={{this.answers}}
            @onChange={{this.answer}}
          />
        </CanonRows>
      </:sidebar>
      <:main>
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Your plan" />
          <PlanSummary @type={{@project.type}} @answers={{this.answers}} />
        </CanonRows>
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Outline" />
          <Outline
            @type={{@project.type}}
            @answers={{@project.answers}}
            @parts={{@project.parts}}
            @onRename={{this.renamePart}}
          />
        </CanonRows>
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Next" />
          <CanonEmptyRow
            @text="Story, Bible, Assets, Shots and Export come in the next phases."
          />
        </CanonRows>
      </:main>
    </CanonSplit>

    <CanonDialog
      @open={{this.asking}}
      @alert={{true}}
      @title={{this.askTitle}}
      @message={{this.lostText}}
      @onClose={{this.settled}}
    >
      <:footer as |close|>
        <CanonButton @text="Keep my plan" @onClick={{fn close "keep"}} />
        <CanonButton
          @kind="primary"
          @text="Remove them"
          @onClick={{fn close "remove"}}
        />
      </:footer>
    </CanonDialog>
  </template>
}
