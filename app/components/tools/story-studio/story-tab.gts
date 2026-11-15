import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import type Owner from '@ember/owner';
import type CanonToastService from 'delphicanon/services/canon-toast';
import CanonButton from 'delphicanon/components/canon-button';
import CanonCodeBlock from 'delphicanon/components/canon-code-block';
import CanonDialog from 'delphicanon/components/canon-dialog';
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
import { IconSvg } from 'xsenze-tools/components/icon';
import {
  readDocument,
  transcribeStory,
} from 'xsenze-tools/lib/story/read-document';
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

const FileIcon = <template><IconSvg @name="folder-open" /></template>;

/** A story read from a file, waiting for Replace or Add to the end. */
interface Incoming {
  text: string;
  name: string;
}

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

  /** What a story file is doing now: reading, downloading, listening. */
  @tracked reading: string | undefined;
  @tracked readNote: string | undefined;
  @tracked readProblem: string | undefined;
  @tracked incoming: Incoming | undefined;
  /** Audio or video waiting for the go-ahead to be heard. */
  @tracked media: File | undefined;
  /** Only the latest file's result is used. */
  #readToken = 0;

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

  // ---------- a story from a file ----------

  get hasIncoming() {
    return !!this.incoming;
  }

  get incomingText() {
    return `Your story box already has text. Replace it with the story from “${this.incoming?.name ?? ''}”, or add that story to the end?`;
  }

  get hasMedia() {
    return !!this.media;
  }

  get mediaText() {
    return `Turn the speech in “${this.media?.name ?? ''}” into text? The speech reader (Whisper, about 80–140 MB) downloads once, then works offline. A long recording takes a few minutes.`;
  }

  openStoryFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) void this.#readStory(file);
    });
    input.click();
  };

  dragOver = (event: DragEvent) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  /** A dropped file; dropped text keeps the text box's own behaviour. */
  dropped = (event: DragEvent) => {
    const file = event.dataTransfer?.files[0];
    if (!file) return;
    event.preventDefault();
    void this.#readStory(file);
  };

  async #readStory(file: File) {
    const token = ++this.#readToken;
    this.readNote = undefined;
    this.readProblem = undefined;
    this.reading = `Reading ${file.name}…`;
    const result = await readDocument(file, (note) => {
      if (token === this.#readToken) this.reading = note;
    });
    if (this.isDestroying || token !== this.#readToken) return;
    this.reading = undefined;
    if ('error' in result) this.readProblem = `${file.name}: ${result.error}`;
    else if ('media' in result) this.media = file;
    else this.#offer(result.text, file.name);
  }

  async #listen(file: File) {
    const token = ++this.#readToken;
    this.readNote = undefined;
    this.readProblem = undefined;
    this.reading = `Listening to ${file.name}…`;
    const language = String(this.args.project.answers.language ?? '');
    try {
      const text = await transcribeStory(file, language, (percent) => {
        if (token !== this.#readToken) return;
        this.reading =
          percent < 100
            ? `Downloading the speech reader: ${Math.round(percent)}%`
            : `Listening to ${file.name}…`;
      });
      if (this.isDestroying || token !== this.#readToken) return;
      this.reading = undefined;
      if (text) this.#offer(text, file.name);
      else this.readProblem = `${file.name}: no speech was heard in it.`;
    } catch {
      if (this.isDestroying || token !== this.#readToken) return;
      this.reading = undefined;
      this.readProblem = `${file.name}: this recording could not be played, so it could not be heard. Try an mp3, wav, m4a or mp4.`;
    }
  }

  #offer(text: string, name: string) {
    if (this.args.project.story.trim()) this.incoming = { text, name };
    else this.#use(text, name, false);
  }

  #use(text: string, name: string, add: boolean) {
    const before = this.args.project.story.trimEnd();
    this.setStory(add && before ? `${before}\n\n${text}` : text);
    this.readNote = add
      ? `Added the story from ${name} to the end.`
      : `Read the story from ${name}.`;
  }

  incomingClosed = (choice: string) => {
    const { incoming } = this;
    this.incoming = undefined;
    if (incoming && (choice === 'replace' || choice === 'add'))
      this.#use(incoming.text, incoming.name, choice === 'add');
  };

  mediaClosed = (choice: string) => {
    const { media } = this;
    this.media = undefined;
    if (media && choice === 'listen') void this.#listen(media);
  };

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
            @placeholder="Paste your story or script here, or drop a file: Word, PDF, text, script, subtitles, web page, e-book, or a recording"
            @height={{320}}
            @onChange={{this.setStory}}
            aria-label="Your story"
            {{on "dragover" this.dragOver}}
            {{on "drop" this.dropped}}
          />
          <CanonGrid>
            <PasteClear @text={{@project.story}} @onChange={{this.setStory}} />
            <CanonButton
              @text="Open file"
              @icon={{FileIcon}}
              @disabled={{if this.reading true false}}
              @onClick={{this.openStoryFile}}
            />
          </CanonGrid>
          {{#if this.reading}}
            <CanonStatus @text={{this.reading}} @tone="muted" @row={{true}} />
          {{/if}}
          {{#if this.readNote}}
            <CanonStatus @text={{this.readNote}} @tone="ok" @row={{true}} />
          {{/if}}
          {{#if this.readProblem}}
            <CanonStatus
              @text={{this.readProblem}}
              @tone="warn"
              @row={{true}}
            />
          {{/if}}
          <CanonStatus @text={{this.storyStats}} @tone="muted" @row={{true}} />
        </CanonRows>
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Outline" />
          <PartsEditor @project={{@project}} @onChange={{this.setPart}} />
        </CanonRows>
      </:main>
    </CanonSplit>

    <CanonDialog
      @open={{this.hasIncoming}}
      @title="You already have a story here"
      @message={{this.incomingText}}
      @onClose={{this.incomingClosed}}
    >
      <:footer as |close|>
        <CanonButton @text="Add to the end" @onClick={{fn close "add"}} />
        <CanonButton
          @kind="primary"
          @text="Replace"
          @onClick={{fn close "replace"}}
        />
      </:footer>
    </CanonDialog>

    <CanonDialog
      @open={{this.hasMedia}}
      @title="Hear the story in this recording?"
      @message={{this.mediaText}}
      @onClose={{this.mediaClosed}}
    >
      <:footer as |close|>
        <CanonButton @text="Cancel" @onClick={{fn close ""}} />
        <CanonButton
          @kind="primary"
          @text="Turn into text"
          @onClick={{fn close "listen"}}
        />
      </:footer>
    </CanonDialog>
  </template>
}
