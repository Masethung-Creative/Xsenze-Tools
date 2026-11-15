import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import type Owner from '@ember/owner';
import type CanonToastService from 'delphicanon/services/canon-toast';
import CanonButton from 'delphicanon/components/canon-button';
import CanonCodeBlock from 'delphicanon/components/canon-code-block';
import CanonGrid from 'delphicanon/components/canon-grid';
import CanonHeading from 'delphicanon/components/canon-heading';
import CanonMenuCell from 'delphicanon/components/canon-menu-cell';
import CanonRow from 'delphicanon/components/canon-row';
import CanonRows from 'delphicanon/components/canon-rows';
import CanonSplit from 'delphicanon/components/canon-split';
import CanonStatus from 'delphicanon/components/canon-status';
import CanonSwitch from 'delphicanon/components/canon-switch';
import CanonTextArea from 'delphicanon/components/canon-text-area';
import CanonTextCell from 'delphicanon/components/canon-text-cell';
import PartsEditor, {
  type PartField,
} from 'xsenze-tools/components/tools/story-studio/parts-editor';
import TabBar, {
  TAB,
} from 'xsenze-tools/components/tools/story-studio/tab-bar';
import PasteClear from 'xsenze-tools/components/tools/text-tool/paste-clear';
import {
  passesOf,
  promptOf,
  readAnswer,
  type Report,
} from 'xsenze-tools/lib/story/analysis';
import type { ProjectStore } from 'xsenze-tools/lib/story/project-store';
import { clock, planOf } from 'xsenze-tools/lib/story/project-types';
import type { Project } from 'xsenze-tools/lib/story/types';

/** Words a minute when a story is read aloud to children. */
const READ_PACE = 130;

export interface StoryTabSignature {
  Args: {
    project: Project;
    store: ProjectStore;
    tab: number;
    onTab: (index: number) => void;
  };
}

/** The story, the chatbot steps that read it, and what they filled in. */
export default class StoryTab extends Component<StoryTabSignature> {
  @service('canon-toast') declare toast: CanonToastService;

  @tracked passIndex = 0;
  @tracked showsPrompt = false;
  @tracked report: Report | undefined;
  @tracked error: string | undefined;

  constructor(owner: Owner, args: StoryTabSignature['Args']) {
    super(owner, args);
    // open on the first step not yet filled
    const first = this.passes.findIndex(
      (p) => !args.project.filled.includes(p.id),
    );
    this.passIndex = Math.max(0, first);
  }

  get passes() {
    return passesOf(this.args.project);
  }

  get pass() {
    return this.passes[Math.min(this.passIndex, this.passes.length - 1)]!;
  }

  get passItems(): string[] {
    return this.passes.map(
      (p) => `${p.label}${this.args.project.filled.includes(p.id) ? ' ✓' : ''}`,
    );
  }

  get selectedPass() {
    return Math.min(this.passIndex, this.passes.length - 1);
  }

  get writing() {
    return this.pass.kind === 'write';
  }

  get prompt() {
    return promptOf(this.args.project, this.pass);
  }

  get answer() {
    return this.args.project.chat[this.pass.id] ?? '';
  }

  get idea() {
    return String(this.args.project.answers.idea ?? '');
  }

  get needsStory() {
    return !this.writing && !this.args.project.story.trim();
  }

  get storyStats(): string {
    const words = this.args.project.story
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    if (!words) return 'No story yet.';
    const plan = planOf(this.args.project.type, this.args.project.answers);
    const read = clock(Math.round((words / READ_PACE) * 60));
    return `${words.toLocaleString('en')} words: about ${read} read aloud. The plan runs ${clock(plan.seconds)}.`;
  }

  /** The next step still to fill, after a fill. */
  get nextStep(): string | undefined {
    const { filled } = this.args.project;
    const next = this.passes.find((p) => !filled.includes(p.id));
    return next ? `Next: pick “${next.label}” above.` : undefined;
  }

  get allRead() {
    return this.passes.every((p) => this.args.project.filled.includes(p.id));
  }

  pickPass = (index: number) => {
    this.passIndex = index;
    this.report = undefined;
    this.error = undefined;
  };

  showPrompt = (on: boolean) => (this.showsPrompt = on);

  copyPrompt = () => void this.toast.copy(this.prompt);

  setAnswer = (text: string) => {
    const { project, store } = this.args;
    store.put({ ...project, chat: { ...project.chat, [this.pass.id]: text } });
  };

  setIdea = (idea: string) => {
    const { project, store } = this.args;
    store.put({ ...project, answers: { ...project.answers, idea } });
  };

  setStory = (story: string) =>
    this.args.store.put({ ...this.args.project, story });

  fill = () => {
    const outcome = readAnswer(this.args.project, this.pass, this.answer);
    if ('error' in outcome) {
      this.error = outcome.error;
      this.report = undefined;
      return;
    }
    this.args.store.put(outcome.project);
    this.report = outcome.report;
    this.error = undefined;
  };

  setPart = (id: string, field: PartField, value: string | string[]) => {
    const { project, store } = this.args;
    store.put({
      ...project,
      parts: project.parts.map((p) =>
        p.id === id ? { ...p, [field]: value } : p,
      ),
    });
  };

  toBible = () => this.args.onTab(TAB.bible);

  <template>
    <CanonSplit class="story-studio">
      <:sidebar>
        <TabBar @selected={{@tab}} @onChange={{@onTab}} />
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Read with a chatbot" />
          <CanonStatus
            @text="Copy the prompt into free ChatGPT, Gemini or Claude. Paste its whole answer below, then press Fill."
            @tone="muted"
            @row={{true}}
          />
          <CanonRow @title="Step" @form="flush" as |titleId|>
            <CanonMenuCell
              @items={{this.passItems}}
              @selected={{this.selectedPass}}
              @labelledBy={{titleId}}
              @onChange={{this.pickPass}}
            />
          </CanonRow>
          {{#if this.writing}}
            <CanonRow @title="Your idea" @form="stacked" as |titleId|>
              <CanonTextCell
                @value={{this.idea}}
                @placeholder="What the story is about, in one line"
                @onChange={{this.setIdea}}
                aria-labelledby={{titleId}}
              />
            </CanonRow>
          {{/if}}
          {{#if this.needsStory}}
            <CanonStatus
              @text="Paste your story first, on the right."
              @tone="warn"
              @row={{true}}
            />
          {{/if}}
          <CanonButton @text="Copy prompt" @onClick={{this.copyPrompt}} />
          <CanonRow @title="Show the prompt" as |titleId|>
            <CanonSwitch
              @on={{this.showsPrompt}}
              @onChange={{this.showPrompt}}
              aria-labelledby={{titleId}}
            />
          </CanonRow>
          {{#if this.showsPrompt}}
            <CanonCodeBlock
              class="ss-prompt"
              @code={{this.prompt}}
              @maxHeight={{320}}
            />
          {{/if}}
          <CanonHeading @text="The chatbot’s answer" />
          <CanonTextArea
            @value={{this.answer}}
            @placeholder="Paste the whole answer here"
            @height={{180}}
            @onChange={{this.setAnswer}}
            aria-label="The chatbot’s answer"
          />
          <CanonGrid>
            <PasteClear @text={{this.answer}} @onChange={{this.setAnswer}} />
            <CanonButton @kind="primary" @text="Fill" @onClick={{this.fill}} />
          </CanonGrid>
          {{#if this.error}}
            <CanonStatus @text={{this.error}} @tone="warn" @row={{true}} />
          {{/if}}
          {{#if this.report}}
            <CanonStatus
              @text={{this.report.filled}}
              @tone="ok"
              @row={{true}}
            />
            {{#each this.report.problems as |problem|}}
              <CanonStatus @text={{problem}} @tone="warn" @row={{true}} />
            {{/each}}
            {{#if this.nextStep}}
              <CanonStatus
                @text={{this.nextStep}}
                @tone="muted"
                @row={{true}}
              />
            {{/if}}
          {{/if}}
          {{#if this.allRead}}
            <CanonButton
              @text="Check the list on the Bible tab"
              @onClick={{this.toBible}}
            />
          {{/if}}
        </CanonRows>
      </:sidebar>
      <:main>
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Your story" />
          <CanonTextArea
            class="ss-story"
            @value={{@project.story}}
            @placeholder="Paste your story or script here"
            @height={{320}}
            @onChange={{this.setStory}}
            aria-label="Your story"
          />
          <CanonGrid>
            <PasteClear @text={{@project.story}} @onChange={{this.setStory}} />
          </CanonGrid>
          <CanonStatus @text={{this.storyStats}} @tone="muted" @row={{true}} />
        </CanonRows>
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Outline" />
          <PartsEditor @project={{@project}} @onChange={{this.setPart}} />
        </CanonRows>
      </:main>
    </CanonSplit>
  </template>
}
