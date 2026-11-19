import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import XzButton from 'xsenze-tools/components/xz/button';
import XzGrid from 'xsenze-tools/components/xz/grid';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzRow from 'xsenze-tools/components/xz/row';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSegmented from 'xsenze-tools/components/xz/segmented';
import XzSplit from 'xsenze-tools/components/xz/split';
import XzStatus from 'xsenze-tools/components/xz/status';
import XzTextCell from 'xsenze-tools/components/xz/text-cell';
import Icon from 'xsenze-tools/components/icon';
import Outline from 'xsenze-tools/components/tools/story-studio/outline';
import PlanSummary from 'xsenze-tools/components/tools/story-studio/plan-summary';
import Questions from 'xsenze-tools/components/tools/story-studio/questions';
import {
  newProject,
  untitled,
  type Carried,
} from 'xsenze-tools/lib/story/project-store';
import {
  HAVE_QUESTIONS,
  LOOK_QUESTIONS,
  PROJECT_TYPES,
  TYPE_QUESTIONS,
  customKey,
  layoutParts,
  planOf,
  settle,
  typeInfo,
} from 'xsenze-tools/lib/story/project-types';
import {
  partHasContent,
  type Answers,
  type Project,
  type ProjectType,
} from 'xsenze-tools/lib/story/types';

const STEPS = ['Type', 'Plan', 'Have', 'Look', 'Create'];
const LAST = STEPS.length - 1;

/** Answers every type shares: what you have, and the look. */
const SHARED = new Set(
  [...HAVE_QUESTIONS, ...LOOK_QUESTIONS].flatMap((q) => [
    q.id,
    customKey(q.id),
  ]),
);

export const sharedAnswers = (a: Answers): Answers =>
  Object.fromEntries(Object.entries(a).filter(([key]) => SHARED.has(key)));

/** What Copy as new project carries into a new type. */
export interface Seed {
  answers: Answers;
  /** The story, its list and the style picture. */
  carried: Carried;
  /** The new name to start from. */
  title: string;
  /** The project it copies. */
  from: string;
}

export interface NewProjectSignature {
  Args: {
    seed?: Seed;
    /** How many projects this browser keeps, for Open a project. */
    saved: number;
    /** Back to the open project, when there is one. */
    onCancel?: () => void;
    onCreate: (project: Project) => void;
    onProjects: () => void;
    onOpenFile: () => void;
  };
}

/** The New project questions, a screen at a time, with the plan they add up to beside them. */
export default class NewProject extends Component<NewProjectSignature> {
  @tracked step = 0;
  @tracked type: ProjectType | undefined;
  @tracked answers: Answers = this.args.seed?.answers ?? {};
  @tracked title = this.args.seed?.title ?? '';

  types = PROJECT_TYPES;

  get typeName() {
    return this.type ? typeInfo(this.type).name : '';
  }

  get typeQuestions() {
    return this.type ? TYPE_QUESTIONS[this.type] : [];
  }

  get haveQuestions() {
    return HAVE_QUESTIONS;
  }

  get lookQuestions() {
    return LOOK_QUESTIONS;
  }

  /** Every answer has a default, so once there is a type any step can open. */
  get locked(): number[] {
    return this.type ? [] : STEPS.map((_, i) => i).filter((i) => i > 0);
  }

  get isFirst() {
    return this.step === 0;
  }

  get isLast() {
    return this.step === LAST;
  }

  get placeholder() {
    return this.type ? untitled(this.type) : '';
  }

  /** The parts the plan would lay out, for the preview. */
  get parts() {
    if (!this.type) return [];
    return layoutParts(planOf(this.type, this.answers), [], partHasContent)
      .parts;
  }

  pickType = (type: ProjectType) => {
    // a new type keeps what you have and the look; its own questions start fresh
    const kept =
      type === this.type ? this.answers : sharedAnswers(this.answers);
    this.type = type;
    this.answers = settle(type, kept);
    this.go(1);
  };

  go = (step: number) => {
    if (!this.type && step > 0) return;
    this.step = Math.max(0, Math.min(LAST, step));
  };

  back = () => this.go(this.step - 1);
  next = () => this.go(this.step + 1);

  answer = (answers: Answers) => (this.answers = answers);

  rename = (title: string) => (this.title = title);

  create = () => {
    if (!this.type) return;
    this.args.onCreate(
      newProject(this.type, this.answers, this.title, this.args.seed?.carried),
    );
  };

  <template>
    <XzSplit class="story-studio" @mainLeadsStacked={{this.isFirst}}>
      <:sidebar>
        <XzRows @framed={{true}}>
          <XzHeading @text="New project" />
          <XzSegmented
            class="ss-steps"
            aria-label="Steps"
            @items={{STEPS}}
            @selected={{this.step}}
            @columns={{5}}
            @disabledIndices={{this.locked}}
            @onChange={{this.go}}
          />
        </XzRows>

        {{#if this.isFirst}}
          <XzRows @framed={{true}}>
            <XzHeading @text="Start" />
            <XzStatus
              @text="Pick what you are making. You can change every answer later except the type."
              @tone="muted"
              @row={{true}}
            />
            {{#if @seed}}
              <XzStatus
                @text="Copying “{{@seed.from}}”: its look and what you have come along."
                @tone="ok"
                @row={{true}}
              />
            {{/if}}
            <XzGrid>
              {{#if @saved}}
                <XzButton @text="Saved projects" @onClick={{@onProjects}} />
              {{/if}}
              <XzButton @text="Open project file" @onClick={{@onOpenFile}} />
            </XzGrid>
            {{#if @onCancel}}
              <XzButton @text="Back to my project" @onClick={{@onCancel}} />
            {{/if}}
          </XzRows>
        {{else}}
          <XzRows @framed={{true}}>
            {{#if (eq this.step 1)}}
              <XzHeading @text="{{this.typeName}} plan" />
              {{#if this.type}}
                <Questions
                  @type={{this.type}}
                  @questions={{this.typeQuestions}}
                  @answers={{this.answers}}
                  @onChange={{this.answer}}
                />
              {{/if}}
            {{else if (eq this.step 2)}}
              <XzHeading @text="What you already have" />
              <XzStatus
                @text="These only set the start: later each character, place or prop can be I have a picture or Make a prompt."
                @tone="muted"
                @row={{true}}
              />
              {{#if this.type}}
                <Questions
                  @type={{this.type}}
                  @questions={{this.haveQuestions}}
                  @answers={{this.answers}}
                  @heading="What you already have"
                  @onChange={{this.answer}}
                />
              {{/if}}
            {{else if (eq this.step 3)}}
              <XzHeading @text="Look and motion" />
              {{#if this.type}}
                <Questions
                  @type={{this.type}}
                  @questions={{this.lookQuestions}}
                  @answers={{this.answers}}
                  @onChange={{this.answer}}
                />
              {{/if}}
            {{else}}
              <XzHeading @text="Name" />
              <XzRow @title="Project name" @form="flush" as |titleId|>
                <XzTextCell
                  @value={{this.title}}
                  @placeholder={{this.placeholder}}
                  @onChange={{this.rename}}
                  aria-labelledby={{titleId}}
                />
              </XzRow>
              <XzStatus
                @text="Once you create the project its type is locked. Everything else can change on the Plan tab."
                @tone="muted"
                @row={{true}}
              />
            {{/if}}
            <XzGrid>
              <XzButton @text="Back" @onClick={{this.back}} />
              {{#if this.isLast}}
                <XzButton
                  @kind="primary"
                  @text="Create project"
                  @onClick={{this.create}}
                />
              {{else}}
                <XzButton @kind="primary" @text="Next" @onClick={{this.next}} />
              {{/if}}
            </XzGrid>
          </XzRows>
        {{/if}}
      </:sidebar>
      <:main>
        {{#if this.isFirst}}
          <XzRows @framed={{true}}>
            <XzHeading @text="What are you making?" />
            <ul class="ss-types">
              {{#each this.types as |t|}}
                <li>
                  <button
                    type="button"
                    class="ss-type {{if (eq t.id this.type) 'ss-type--on'}}"
                    aria-pressed={{if (eq t.id this.type) "true" "false"}}
                    {{on "click" (fn this.pickType t.id)}}
                  >
                    <Icon @name={{t.icon}} class="ss-type-icon" />
                    <span class="ss-type-name">{{t.name}}</span>
                    <span class="ss-type-desc">{{t.description}}</span>
                  </button>
                </li>
              {{/each}}
            </ul>
          </XzRows>
        {{else if this.type}}
          <XzRows @framed={{true}}>
            <XzHeading @text="Your plan" />
            <PlanSummary @type={{this.type}} @answers={{this.answers}} />
          </XzRows>
          <XzRows @framed={{true}}>
            <XzHeading @text="Outline" />
            <Outline
              @type={{this.type}}
              @answers={{this.answers}}
              @parts={{this.parts}}
              @compact={{true}}
            />
          </XzRows>
        {{/if}}
      </:main>
    </XzSplit>
  </template>
}

function eq(a: unknown, b: unknown): boolean {
  return a === b;
}
