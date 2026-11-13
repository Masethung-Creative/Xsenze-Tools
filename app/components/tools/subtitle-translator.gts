import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import type Owner from '@ember/owner';
import CanonBar from 'delphicanon/components/canon-bar';
import CanonButton from 'delphicanon/components/canon-button';
import CanonCanvas from 'delphicanon/components/canon-canvas';
import CanonDropZone from 'delphicanon/components/canon-drop-zone';
import CanonEmptyRow from 'delphicanon/components/canon-empty-row';
import CanonHeading from 'delphicanon/components/canon-heading';
import CanonLoader from 'delphicanon/components/canon-loader';
import CanonRow from 'delphicanon/components/canon-row';
import CanonRows from 'delphicanon/components/canon-rows';
import CanonSegmented from 'delphicanon/components/canon-segmented';
import CanonSplit from 'delphicanon/components/canon-split';
import CanonStatus from 'delphicanon/components/canon-status';
import CanonSwitch from 'delphicanon/components/canon-switch';
import { IconSvg } from 'xsenze-tools/components/icon';
import CueRow from 'xsenze-tools/components/tools/media/cue-row';
import DownloadAll from 'xsenze-tools/components/tools/media/download-all';
import Source from 'xsenze-tools/components/tools/text-tool/source';
import { downloadText } from 'xsenze-tools/lib/download';
import {
  formatTimestamp,
  parseSubtitles,
  type Cue,
} from 'xsenze-tools/lib/subtitles';
import { SUBTITLE_ACCEPT } from 'xsenze-tools/lib/tools';
import {
  NLLB_SIZE_MB,
  TRANSLATE_LANGUAGES,
  browserCanTranslate,
  prepareCue,
  restoreCue,
  translateTexts,
  type Engine,
  type EngineChoice,
  type Language,
  type Progress,
} from 'xsenze-tools/lib/translate';
import type { NamedBlob } from 'xsenze-tools/lib/zip-files';
import filePaste from 'xsenze-tools/modifiers/file-paste';
import LanguageSelect, {
  flagOf,
  languageOf,
} from 'xsenze-tools/components/tools/subtitle-translator/language-select';
import {
  FORMATS,
  FORMAT_LABELS,
  FORMAT_NOTES,
  mimeOf,
  outputName,
  writeOutput,
  type OutFormat,
} from 'xsenze-tools/components/tools/subtitle-translator/output';
import Picture, {
  type TargetLane,
} from 'xsenze-tools/components/tools/subtitle-translator/picture';
import './subtitle-translator/subtitle-translator.css';

type JobState = 'waiting' | 'running' | 'done' | 'failed' | 'stopped';

interface Job {
  code: string;
  state: JobState;
  /** Translated lines so far, by cue index. */
  lines: string[];
  done: number;
  engine?: Engine;
}

const ACCEPT = SUBTITLE_ACCEPT.join(',');
/** the converter's band height, growing with the lanes up to a cap */
const BAND_MIN = 132;
const BAND_MAX = 260;
const LANE_HEIGHT = 24;
const ENGINES: EngineChoice[] = ['auto', 'nllb'];
const ENGINE_LABELS = ['Auto', 'NLLB only'];

const FileIcon = <template><IconSvg @name="languages" /></template>;
const Run = <template><IconSvg @name="languages" /></template>;
const Save = <template><IconSvg @name="download" /></template>;
const Cancel = <template><IconSvg @name="x" /></template>;
const Remove = <template><IconSvg @name="x" /></template>;

const keepPaste = (event: Event) => event.stopPropagation();

const STATE_TEXT: Record<JobState, string> = {
  waiting: 'Waiting',
  running: 'Translating…',
  done: 'Done',
  failed: 'Failed',
  stopped: 'Stopped',
};

/**
 * Translate SRT/VTT subtitles on the device into one language or several,
 * one after another: the browser's own translator where it has the pair,
 * NLLB-200 otherwise. Timings never change; every line stays editable under
 * its original.
 */
export default class SubtitleTranslatorTool extends Component {
  @tracked input = '';
  @tracked fileName = '';
  @tracked from = 'en';
  @tracked targets: string[] = ['ta'];
  @tracked multiple = false;
  @tracked engine: EngineChoice = 'auto';
  @tracked format: OutFormat = 'srt';
  @tracked jobs: Job[] = [];
  @tracked busy = false;
  @tracked progress: Progress | null = null;
  @tracked current = '';
  @tracked tab = '';
  @tracked error = '';
  @tracked browserPair = false;
  #abort: AbortController | null = null;

  // ?stText=<srt or vtt> ?stFrom=en ?stTo=ta,hi ?stEngine=nllb ?stRun=1:
  // preset the tool from the URL
  constructor(owner: Owner, args: object) {
    super(owner, args);
    const query = new URLSearchParams(window.location.search);
    const text = query.get('stText');
    if (text) this.input = text;
    const from = query.get('stFrom');
    if (from && languageOf(from)) this.from = from;
    const to = (query.get('stTo') ?? '')
      .split(',')
      .filter((code) => languageOf(code) && code !== this.from);
    if (to.length) {
      this.targets = to;
      this.multiple = to.length > 1;
    }
    if (query.get('stEngine') === 'nllb') this.engine = 'nllb';
    void this.#checkBrowser();
    // after the first render: starting sets tracked state the render read
    if (text && query.get('stRun') === '1')
      setTimeout(() => void this.translate(), 0);
  }

  willDestroy() {
    super.willDestroy();
    this.#abort?.abort();
  }

  /* --- input --- */

  @cached
  get cues(): Cue[] {
    return parseSubtitles(this.input);
  }

  get hasInput() {
    return this.input.trim().length > 0;
  }

  get noCues() {
    return this.hasInput && this.cues.length === 0;
  }

  get stats() {
    const last = this.cues.at(-1);
    if (!last) return '';
    return `${this.cues.length} lines · ${formatTimestamp(last.end, '.')}`;
  }

  /* --- languages --- */

  get fromLanguage(): Language {
    return languageOf(this.from) ?? TRANSLATE_LANGUAGES[0]!;
  }

  get fromSelected() {
    return [this.from];
  }

  get targetRows() {
    return this.targets.map((code) => ({
      code,
      name: languageOf(code)?.name ?? code,
      icon: flagOf(code),
    }));
  }

  get canRun() {
    return (
      this.cues.length > 0 &&
      !this.busy &&
      this.targets.length > 0 &&
      !this.targets.includes(this.from)
    );
  }

  get cannotRun() {
    return !this.canRun;
  }

  get runText() {
    const n = this.targets.length;
    return n > 1 ? `Translate into ${n}` : 'Translate';
  }

  /* --- engine and format --- */

  get engineIndex() {
    return ENGINES.indexOf(this.engine);
  }

  get engineNote() {
    if (this.engine === 'auto' && this.browserPair)
      return 'Tries your browser’s built-in translator first (fast, small download), then NLLB-200.';
    return `Uses NLLB-200: about ${NLLB_SIZE_MB} MB the first time, then cached.`;
  }

  get formatIndex() {
    return FORMATS.indexOf(this.format);
  }

  get formatNote() {
    return FORMAT_NOTES[this.format];
  }

  /* --- progress --- */

  get downloading() {
    return this.busy && this.progress?.phase === 'download';
  }

  get percent() {
    return Math.round((this.progress?.ratio ?? 0) * 100);
  }

  get currentJob() {
    return this.jobs.find((job) => job.code === this.current);
  }

  get status() {
    if (this.downloading) return 'Downloading model…';
    const job = this.currentJob;
    if (!job) return 'Starting…';
    const name = languageOf(job.code)?.name ?? job.code;
    return `Translating ${name}… ${job.done} / ${this.cues.length}`;
  }

  get share() {
    if (this.downloading) return this.progress?.ratio ?? 0;
    const n = this.cues.length * Math.max(1, this.jobs.length);
    const done = this.jobs.reduce((sum, job) => sum + job.done, 0);
    return n ? done / n : 0;
  }

  get sharePercent() {
    return Math.round(this.share * 100);
  }

  /* --- band --- */

  get lanes(): TargetLane[] {
    const jobs = this.jobs.length
      ? this.jobs
      : this.targets.map((code) => ({ code, done: 0 }));
    return jobs.map((job) => ({
      label: job.code.toUpperCase().slice(0, 4),
      done: job.done,
    }));
  }

  get bandHeight() {
    const lanes = 1 + this.lanes.length;
    return Math.min(BAND_MAX, Math.max(BAND_MIN, 20 + lanes * LANE_HEIGHT));
  }

  get figure() {
    const n = this.cues.length;
    if (!n) return '';
    if (this.downloading) return String(this.percent);
    if (this.busy) return String(this.currentJob?.done ?? 0);
    const finished = this.finished.length;
    if (finished > 1) return String(finished);
    return String(n);
  }

  get unit() {
    if (this.downloading) return '% model';
    if (this.busy)
      return `/ ${this.cues.length} ${this.current.toUpperCase().slice(0, 4)}`;
    if (this.finished.length > 1) return 'languages';
    return this.cues.length === 1 ? 'line' : 'lines';
  }

  get pictureLabel() {
    if (!this.stats) return '';
    const names = this.targets.map((c) => languageOf(c)?.name ?? c);
    return `Timeline: ${this.stats}, ${this.fromLanguage.name} to ${names.join(', ')}`;
  }

  get sourceLabel() {
    return this.from.toUpperCase();
  }

  /* --- results --- */

  get finished(): Job[] {
    return this.jobs.filter((job) => job.state === 'done');
  }

  get queueRows() {
    return this.jobs.map((job) => ({
      code: job.code,
      name: languageOf(job.code)?.name ?? job.code,
      icon: flagOf(job.code),
      state: job.state,
      detail:
        job.state === 'running'
          ? `${job.done} / ${this.cues.length}`
          : job.state === 'done' && job.engine
            ? job.engine === 'browser'
              ? 'Browser translator'
              : 'NLLB-200'
            : STATE_TEXT[job.state],
      running: job.state === 'running',
      done: job.state === 'done',
    }));
  }

  get showsQueue() {
    return this.jobs.length > 1;
  }

  get tabs() {
    return this.finished.map((job) => languageOf(job.code)?.name ?? job.code);
  }

  get showsTabs() {
    return this.finished.length > 1;
  }

  get tabIndex() {
    return Math.max(
      0,
      this.finished.findIndex((job) => job.code === this.tab),
    );
  }

  get shown(): Job | undefined {
    return this.finished[this.tabIndex];
  }

  get shownLanguage() {
    return languageOf(this.shown?.code ?? '');
  }

  get shownDir() {
    return this.shownLanguage?.rtl ? 'rtl' : 'auto';
  }

  get shownCues(): Cue[] {
    const job = this.shown;
    if (!job) return [];
    return this.cues.map((cue, i) => ({ ...cue, text: job.lines[i] ?? '' }));
  }

  get shownRows() {
    return this.shownCues.map((cue, index) => ({
      cue,
      index,
      original: this.cues[index]?.text ?? '',
    }));
  }

  get resultStats() {
    const job = this.shown;
    if (!job) return '';
    const name = languageOf(job.code)?.name ?? job.code;
    return `${name} · ${this.stats}`;
  }

  get resultEngine() {
    const engine = this.shown?.engine;
    if (!engine) return '';
    return engine === 'browser'
      ? 'Translated with the browser’s built-in translator'
      : 'Translated with NLLB-200';
  }

  get zipName() {
    const base = (this.fileName || 'subtitles').replace(/\.[^.]+$/, '');
    return `${base}.translations.zip`;
  }

  get noResult() {
    return !this.busy && this.finished.length === 0;
  }

  /* --- actions --- */

  async #checkBrowser() {
    const to = languageOf(this.targets[0] ?? '');
    const ok = to ? await browserCanTranslate(this.fromLanguage, to) : false;
    if (!this.isDestroying) this.browserPair = ok;
  }

  #reset() {
    this.jobs = [];
    this.tab = '';
    this.error = '';
  }

  readFile = (file: File) => {
    void file.text().then((text) => {
      if (this.isDestroying) return;
      this.input = text;
      this.fileName = file.name;
      this.#reset();
    });
  };

  readFiles = (files: File[]) => {
    if (files[0]) this.readFile(files[0]);
  };

  setInput = (text: string) => {
    this.input = text;
    this.fileName = '';
    this.#reset();
  };

  pickFrom = (codes: string[]) => {
    const code = codes[0];
    if (!code) return;
    this.from = code;
    this.targets = this.targets.filter((c) => c !== code);
    this.#reset();
    void this.#checkBrowser();
  };

  pickTargets = (codes: string[]) => {
    this.targets = this.multiple ? codes : codes.slice(-1);
    this.#reset();
    void this.#checkBrowser();
  };

  removeTarget = (code: string) => {
    this.targets = this.targets.filter((c) => c !== code);
    this.#reset();
  };

  setMultiple = (on: boolean) => {
    this.multiple = on;
    if (!on) this.targets = this.targets.slice(0, 1);
    this.#reset();
  };

  pickEngine = (index: number) => {
    this.engine = ENGINES[index] ?? 'auto';
  };

  pickFormat = (index: number) => {
    this.format = FORMATS[index] ?? 'srt';
  };

  pickTab = (index: number) => {
    this.tab = this.finished[index]?.code ?? '';
  };

  #update(code: string, change: Partial<Job>) {
    this.jobs = this.jobs.map((job) =>
      job.code === code ? { ...job, ...change } : job,
    );
  }

  translate = async () => {
    if (!this.canRun) return;
    this.#reset();
    this.jobs = this.targets.map((code) => ({
      code,
      state: 'waiting',
      lines: [],
      done: 0,
    }));
    this.busy = true;
    this.progress = null;
    const abort = new AbortController();
    this.#abort = abort;
    const shapes = this.cues.map((cue) => prepareCue(cue.text));
    const texts = shapes.map((s) => s.plain);
    // one language after another; the model loads once and is reused
    for (const code of this.targets) {
      if (abort.signal.aborted || this.isDestroying) break;
      const to = languageOf(code);
      if (!to) continue;
      this.current = code;
      this.#update(code, { state: 'running' });
      const lines: string[] = [];
      try {
        const result = await translateTexts(texts, {
          from: this.fromLanguage,
          to,
          engine: this.engine,
          signal: abort.signal,
          onLine: (index, text) => {
            if (this.isDestroying) return;
            lines[index] = restoreCue(text, shapes[index]!);
            this.#update(code, { done: index + 1, lines: [...lines] });
          },
          onProgress: (p) => {
            if (!this.isDestroying) this.progress = p;
          },
        });
        if (this.isDestroying) return;
        this.#update(code, {
          state: 'done',
          done: texts.length,
          lines: result.texts.map((t, i) => restoreCue(t, shapes[i]!)),
          engine: result.engine,
        });
        if (!this.tab) this.tab = code;
      } catch (error) {
        if (this.isDestroying) return;
        if (abort.signal.aborted) {
          this.#update(code, { state: 'stopped' });
          break;
        }
        this.#update(code, { state: 'failed' });
        this.error = `${to.name} failed. Check your connection for the first model download and try again.`;
        void error;
      }
    }
    if (this.isDestroying) return;
    this.jobs = this.jobs.map((job) =>
      job.state === 'waiting' ? { ...job, state: 'stopped' } : job,
    );
    this.busy = false;
    this.current = '';
    this.progress = null;
    this.#abort = null;
  };

  cancel = () => {
    this.#abort?.abort();
  };

  editLine = (cue: Cue) => {
    const job = this.shown;
    if (!job) return;
    const index = this.cues.findIndex(
      (c) => c.start === cue.start && c.end === cue.end,
    );
    if (index < 0) return;
    const lines = [...job.lines];
    lines[index] = cue.text;
    this.#update(job.code, { lines });
  };

  #file(job: Job): NamedBlob & { text: string } {
    const cues = this.cues.map((cue, i) => ({
      ...cue,
      text: job.lines[i] ?? '',
    }));
    const text = writeOutput(this.format, cues, this.cues, job.code);
    return {
      name: outputName(this.fileName, this.format, this.from, job.code),
      blob: new Blob([text], { type: mimeOf(this.format) }),
      text,
    };
  }

  downloadOne = (code: string) => {
    const job = this.finished.find((j) => j.code === code);
    if (!job) return;
    const file = this.#file(job);
    downloadText(file.text, file.name, mimeOf(this.format));
  };

  downloadShown = () => {
    if (this.shown) this.downloadOne(this.shown.code);
  };

  allFiles = (): NamedBlob[] =>
    this.finished.map((job) => {
      const { name, blob } = this.#file(job);
      return { name, blob };
    });

  <template>
    <CanonSplit
      class="subtitle-translator"
      @collapsesTo={{72}}
      @mainLeadsStacked={{true}}
      {{filePaste this.readFile accept=ACCEPT}}
    >
      <:banner>
        <CanonCanvas
          @height={{this.bandHeight}}
          @background="var(--canon-muted)"
        >
          <Picture
            @cues={{this.cues}}
            @source={{this.sourceLabel}}
            @targets={{this.lanes}}
            @figure={{this.figure}}
            @unit={{this.unit}}
            @label={{this.pictureLabel}}
          />
        </CanonCanvas>
      </:banner>
      <:sidebar>
        <CanonRows class="st-controls" @framed={{true}}>
          <CanonHeading @text="Languages" />
          <LanguageSelect
            @title="From"
            @selected={{this.fromSelected}}
            @disabled={{this.busy}}
            @onChange={{this.pickFrom}}
          />
          <CanonRow
            class="st-multiple"
            @title="Multiple languages"
            @detail="Translate into several, one by one"
            as |titleId|
          >
            <CanonSwitch
              aria-labelledby={{titleId}}
              @on={{this.multiple}}
              @disabled={{this.busy}}
              @onChange={{this.setMultiple}}
            />
          </CanonRow>
          <LanguageSelect
            @title="To"
            @selected={{this.targets}}
            @multiple={{this.multiple}}
            @exclude={{this.from}}
            @disabled={{this.busy}}
            @onChange={{this.pickTargets}}
          />
          {{#if this.multiple}}
            {{#each this.targetRows key="code" as |row|}}
              <CanonRow
                class="st-target"
                @title={{row.name}}
                @icon={{row.icon}}
              >
                <CanonButton
                  class="st-target-remove"
                  @kind="cell"
                  @icon={{Remove}}
                  @label="Remove {{row.name}}"
                  @disabled={{this.busy}}
                  @onClick={{fn this.removeTarget row.code}}
                />
              </CanonRow>
            {{else}}
              <CanonEmptyRow @text="Pick languages above" />
            {{/each}}
          {{/if}}
          <CanonHeading @text="Engine" />
          <CanonSegmented
            class="st-engine"
            aria-label="Engine"
            @items={{ENGINE_LABELS}}
            @selected={{this.engineIndex}}
            @disabled={{this.busy}}
            @onChange={{this.pickEngine}}
          />
          <CanonStatus @text={{this.engineNote}} @tone="muted" @row={{true}} />
          <CanonHeading @text="Format" />
          <CanonSegmented
            class="st-format"
            aria-label="Format"
            @items={{FORMAT_LABELS}}
            @columns={{3}}
            @selected={{this.formatIndex}}
            @onChange={{this.pickFormat}}
          />
          <CanonStatus @text={{this.formatNote}} @tone="muted" @row={{true}} />
          <CanonButton
            class="st-run"
            @kind="primary"
            @text={{this.runText}}
            @icon={{Run}}
            @iconStyle="oversized"
            @disabled={{this.cannotRun}}
            @onClick={{this.translate}}
          />
        </CanonRows>
      </:sidebar>
      <:main>
        <CanonRows class="st-input" @framed={{true}}>
          <Source
            @heading="Subtitles"
            @text={{this.input}}
            @label="Subtitle input"
            @onChange={{this.setInput}}
          />
          {{#if this.fileName}}
            <CanonRow
              class="st-file"
              @title={{this.fileName}}
              @icon={{FileIcon}}
            />
          {{else}}
            {{#unless this.hasInput}}
              <CanonDropZone
                class="st-drop"
                @prompt="SRT or VTT"
                @icon={{FileIcon}}
                @accept={{ACCEPT}}
                @paste={{false}}
                @onFiles={{this.readFiles}}
                {{on "paste" keepPaste}}
              />
            {{/unless}}
          {{/if}}
          {{#if this.noCues}}
            <CanonStatus
              @text="No subtitle lines found."
              @tone="warn"
              @row={{true}}
            />
          {{/if}}
        </CanonRows>

        <CanonRows class="st-output" @framed={{true}}>
          <CanonHeading @text="Translation" />
          {{#if this.busy}}
            <CanonRow class="st-busy" @title={{this.status}}>
              <span class="st-busy-cell">
                <CanonLoader @cell={{5}} @gap={{1}} />
                <span role="status">{{if
                    this.downloading
                    this.percent
                    this.sharePercent
                  }}%</span>
              </span>
            </CanonRow>
            <CanonBar
              class="st-bar"
              role="progressbar"
              aria-label="Progress"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={{this.sharePercent}}
              @share={{this.share}}
            />
            <CanonButton
              class="st-cancel"
              @text="Cancel"
              @icon={{Cancel}}
              @onClick={{this.cancel}}
            />
          {{/if}}
          {{#if this.error}}
            <CanonStatus @text={{this.error}} @tone="warn" @row={{true}} />
          {{/if}}

          {{#if this.showsQueue}}
            <CanonHeading @text="Languages" />
            {{#each this.queueRows key="code" as |row|}}
              <CanonRow
                class="st-job st-job--{{row.state}}"
                @title={{row.name}}
                @detail={{row.detail}}
                @icon={{row.icon}}
              >
                {{#if row.running}}
                  <span class="st-busy-cell st-job-cell">
                    <CanonLoader @cell={{4}} @gap={{1}} />
                  </span>
                {{else if row.done}}
                  <CanonButton
                    class="st-job-download"
                    @kind="cell"
                    @text="Download"
                    @icon={{Save}}
                    @onClick={{fn this.downloadOne row.code}}
                  />
                {{/if}}
              </CanonRow>
            {{/each}}
          {{/if}}

          {{#if this.shown}}
            {{#if this.showsTabs}}
              <CanonSegmented
                class="st-tabs"
                aria-label="Review language"
                @items={{this.tabs}}
                @columns={{3}}
                @selected={{this.tabIndex}}
                @onChange={{this.pickTab}}
              />
            {{/if}}
            <CanonRow
              class="st-stats"
              @title={{this.resultStats}}
              @detail={{this.resultEngine}}
            />
            <div class="st-lines">
              {{#each this.shownRows key="index" as |row|}}
                <CueRow
                  @index={{row.index}}
                  @cue={{row.cue}}
                  @note={{row.original}}
                  @editable={{true}}
                  @lockTimes={{true}}
                  @dir={{this.shownDir}}
                  @lang={{this.shown.code}}
                  @onChange={{this.editLine}}
                />
              {{/each}}
            </div>
            {{#if this.showsQueue}}
              <DownloadAll
                class="st-download-all"
                @files={{this.allFiles}}
                @zipName={{this.zipName}}
              />
            {{else}}
              <CanonButton
                class="st-download"
                @kind="primary"
                @text="Download"
                @icon={{Save}}
                @iconStyle="oversized"
                @onClick={{this.downloadShown}}
              />
            {{/if}}
          {{else if this.noResult}}
            <CanonEmptyRow @text="None yet" />
          {{/if}}
        </CanonRows>
      </:main>
    </CanonSplit>
  </template>
}
