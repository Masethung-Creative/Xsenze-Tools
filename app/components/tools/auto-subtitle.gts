import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import type Owner from '@ember/owner';
import { service } from '@ember/service';
import XzBar from 'xsenze-tools/components/xz/bar';
import XzButton from 'xsenze-tools/components/xz/button';
import XzCanvas from 'xsenze-tools/components/xz/canvas';
import XzDialog from 'xsenze-tools/components/xz/dialog';
import XzDropZone from 'xsenze-tools/components/xz/drop-zone';
import XzGrid from 'xsenze-tools/components/xz/grid';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzLoader from 'xsenze-tools/components/xz/loader';
import XzPopover from 'xsenze-tools/components/xz/popover';
import XzRow from 'xsenze-tools/components/xz/row';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSegmented from 'xsenze-tools/components/xz/segmented';
import XzSplit from 'xsenze-tools/components/xz/split';
import XzStatus from 'xsenze-tools/components/xz/status';
import type XzToastService from 'xsenze-tools/services/xz-toast';
import { IconSvg } from 'xsenze-tools/components/icon';
import CueRow from 'xsenze-tools/components/tools/media/cue-row';
import { peakBuckets } from 'xsenze-tools/components/tools/media/frames';
import LanguagePick from 'xsenze-tools/components/tools/auto-subtitle/language-pick';
import Picture from 'xsenze-tools/components/tools/auto-subtitle/picture';
import {
  MIME,
  type ExportFormat,
  altered,
  failure,
  output,
  outputName,
  stats,
  type Failure,
} from 'xsenze-tools/components/tools/auto-subtitle/result';
import filePaste, { matchesAccept } from 'xsenze-tools/modifiers/file-paste';
import {
  audioContext,
  channelsOf,
  extractPeaks,
  type WaveformPeaks,
} from 'xsenze-tools/lib/audio';
import { downloadText } from 'xsenze-tools/lib/download';
import { downloadIcon, passAlong } from 'xsenze-tools/lib/flow-hooks';
import { parseSubtitles, type Cue } from 'xsenze-tools/lib/subtitles';
import { AUDIO_ACCEPT, VIDEO_ACCEPT, acceptAttr } from 'xsenze-tools/lib/tools';
import { MODELS, transcribe, type Mode } from 'xsenze-tools/lib/transcribe';
import { bandHeight } from 'xsenze-tools/components/tools/media/strips';
import './media/media.css';
import './auto-subtitle/auto-subtitle.css';

const ACCEPT = acceptAttr([...AUDIO_ACCEPT, ...VIDEO_ACCEPT]);
const FORMATS: ExportFormat[] = ['srt', 'vtt', 'txt', 'ass', 'lrc'];
const FORMAT_LABELS = ['SRT', 'VTT', 'TXT', 'ASS', 'LRC'];
const MODES: Mode[] = ['fast', 'reasonable', 'accurate'];
const MODE_LABELS = ['Rough', 'Decent', 'Experimental'];

const DROP_TITLE = 'Drop an audio or video file';
const FAILURES: Record<Exclude<Failure, ''>, string> = {
  decode: "Couldn't read that file, try WAV or MP4",
  webgpu: 'WebGPU required',
  generic: 'Transcription failed. Try again',
};
// wording by Ruby, from the web tool
const EXPERIMENTAL_WARNING =
  'This will download 760 MB of engine files to work, and needs a pretty beefy computer, are you sure?';

const Wave = <template><IconSvg @name="audio-waveform" /></template>;
const Trash = <template><IconSvg @name="trash-2" /></template>;
const Captions = <template><IconSvg @name="captions" /></template>;
const Cancel = <template><IconSvg @name="x" /></template>;
const Info = <template><IconSvg @name="info" /></template>;
const Copy = <template><IconSvg @name="copy" /></template>;
const Save = <template><IconSvg @name={{(downloadIcon)}} /></template>;

// the document paste (filePaste) would load a drop-zone paste a second time
const keepPaste = (event: Event) => event.stopPropagation();

const device = () =>
  typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm';

const MODEL_ROWS = MODES.map((id, index) => ({
  label: MODE_LABELS[index]!,
  name: MODELS[id].name,
  href: `https://huggingface.co/${MODELS[id].model}`,
  size: `${MODELS[id].sizeMb[device()]} MB`,
}));

const flag = (query: URLSearchParams, key: string) => {
  const value = Number(query.get(key));
  return query.has(key) && Number.isInteger(value) ? value : undefined;
};

/**
 * Auto subtitles with Whisper running in the
 * browser: the source and the cues the user corrects are the main pane,
 * the model, language and format the sidebar.
 */
export default class AutoSubtitleTool extends Component {
  @service('xz-toast') declare toast: XzToastService;

  @tracked file: File | null = null;
  @tracked peaks: WaveformPeaks | null = null;
  @tracked duration = 0;
  @tracked detail = '';
  @tracked mode: Mode = 'reasonable';
  @tracked language = '';
  @tracked target: ExportFormat = 'srt';
  @tracked busy = false;
  @tracked percent = 0;
  @tracked problem: Failure = '';
  @tracked cues: Cue[] = [];
  @tracked original: Cue[] = [];
  @tracked finished = false;
  @tracked warning = false;
  /** One key per refused Experimental pick, so the segmented remounts on the old mode. */
  @tracked refused = 0;

  #token = 0;
  #scan = 0;
  #experimentalOk = false;

  // ?asMode= ?asFormat= (indices) ?asSample=<same-origin path> ?asOffer=yes: preset the tool
  // from the URL; ?asCues=<srt or vtt text> stands in for a finished run
  constructor(owner: Owner, args: object) {
    super(owner, args);
    const query = new URLSearchParams(window.location.search);
    const mode = MODES[flag(query, 'asMode') ?? -1];
    if (mode) this.mode = mode;
    const format = FORMATS[flag(query, 'asFormat') ?? -1];
    if (format) this.target = format;
    const cues = parseSubtitles(query.get('asCues') ?? '');
    if (cues.length) {
      this.cues = cues;
      this.original = cues;
      this.finished = true;
    }
    this.warning = query.get('asOffer') === 'yes';
    const sample = query.get('asSample');
    if (sample?.startsWith('/') && !sample.startsWith('//'))
      void this.#fetchSample(sample);
  }

  async #fetchSample(url: string) {
    const response = await fetch(url).catch(() => null);
    if (!response?.ok || this.isDestroying) return;
    const blob = await response.blob();
    const name = url.split('/').pop() || 'audio';
    this.#open(new File([blob], name, { type: blob.type }), false);
  }

  willDestroy() {
    super.willDestroy();
    this.#token++;
    this.#scan++;
  }

  get fileName() {
    return this.file?.name ?? '';
  }

  get modeIndex() {
    return MODES.indexOf(this.mode);
  }

  get formatIndex() {
    return FORMATS.indexOf(this.target);
  }

  get modeKeys() {
    return [this.refused];
  }

  get model() {
    return MODEL_ROWS[this.modeIndex]!;
  }

  get unready() {
    return !this.file || this.busy;
  }

  get showsResult() {
    return this.busy || this.finished;
  }

  get hasCues() {
    return this.cues.length > 0;
  }

  get noCues() {
    return this.finished && !this.busy && !this.hasCues;
  }

  get downloading() {
    return this.percent > 0 && this.percent < 100;
  }

  get status() {
    return this.downloading ? `Downloading… ${this.percent}%` : 'Transcribing…';
  }

  get share() {
    return this.percent / 100;
  }

  get problemText() {
    return this.problem ? FAILURES[this.problem] : '';
  }

  @cached
  get output() {
    return output(this.cues, this.target);
  }

  get stats() {
    return stats(this.cues);
  }

  get figure() {
    if (this.busy) return this.downloading ? String(this.percent) : '';
    return this.hasCues ? String(this.cues.length) : '';
  }

  get unit() {
    return this.busy ? '%' : 'cues';
  }

  get pictureLabel() {
    return this.stats || this.fileName;
  }

  get downloadText() {
    return passAlong('Download');
  }

  isAltered = (cue: Cue, index: number) => altered(this.original, cue, index);

  #reset() {
    this.#token++;
    this.busy = false;
    this.percent = 0;
    this.problem = '';
    this.cues = [];
    this.original = [];
    this.finished = false;
  }

  #open(file: File, reset = true) {
    if (reset) this.#reset();
    this.file = file;
    this.peaks = null;
    this.duration = 0;
    this.detail = '';
    void this.#decode(file, ++this.#scan);
  }

  load = (file: File) => this.#open(file);

  loadFiles = (files: File[]) => {
    if (files[0]) this.load(files[0]);
  };

  // waveform: the band and the file row's detail
  async #decode(file: File, scan: number) {
    try {
      const buffer = await audioContext().decodeAudioData(
        await file.arrayBuffer(),
      );
      if (scan !== this.#scan) return;
      this.peaks = extractPeaks(channelsOf(buffer), peakBuckets);
      this.duration = buffer.duration;
      this.detail = `${buffer.duration.toFixed(2)} s · ${buffer.sampleRate} Hz · ${buffer.numberOfChannels} ch`;
    } catch {
      // no waveform; the run reports what it cannot read
    }
  }

  allowDrop = (event: DragEvent) => {
    if (event.dataTransfer?.types.includes('Files')) event.preventDefault();
  };

  // a drop anywhere loads the file; the drop zone handles its own
  dropAnywhere = (event: DragEvent) => {
    if (event.defaultPrevented) return;
    const file = [...(event.dataTransfer?.files ?? [])].find((f) =>
      matchesAccept(f, ACCEPT),
    );
    if (!file) return;
    event.preventDefault();
    this.load(file);
  };

  clear = () => {
    this.#reset();
    this.#scan++;
    this.file = null;
    this.peaks = null;
    this.duration = 0;
    this.detail = '';
  };

  pickMode = (index: number) => {
    const mode = MODES[index];
    if (!mode) return;
    if (mode === 'accurate' && !this.#experimentalOk) {
      this.warning = true;
      return;
    }
    this.mode = mode;
    this.problem = '';
  };

  closeWarning = (returnValue: string) => {
    this.warning = false;
    if (returnValue !== 'confirm') {
      this.refused++;
      return;
    }
    this.#experimentalOk = true;
    this.mode = 'accurate';
    this.problem = '';
  };

  setLanguage = (code: string) => {
    this.language = code;
  };

  pickFormat = (index: number) => {
    this.target = FORMATS[index] ?? 'srt';
  };

  run = () => void this.#run();

  async #run() {
    const file = this.file;
    if (!file || this.busy) return;
    this.#reset();
    const token = this.#token;
    this.busy = true;
    try {
      const cues = await transcribe(file, {
        mode: this.mode,
        language: this.language || undefined,
        onProgress: (p) => {
          if (token === this.#token) this.percent = p;
        },
      });
      if (token !== this.#token) return;
      this.cues = cues;
      this.original = cues;
      this.finished = true;
    } catch (error) {
      if (token !== this.#token) return;
      console.error('Transcription failed:', error);
      this.problem = failure(error);
    } finally {
      if (token === this.#token) {
        this.busy = false;
        this.percent = 0;
      }
    }
  }

  // ponytail: drops the run; a model download in flight keeps going in the background
  cancel = () => this.#reset();

  editCue = (index: number, cue: Cue) => {
    const next = this.cues.slice();
    next[index] = cue;
    this.cues = next;
  };

  copy = () => void this.toast.copy(this.output);

  download = () => {
    if (!this.output) return;
    downloadText(
      this.output,
      outputName(this.fileName, this.target),
      MIME[this.target],
    );
  };

  <template>
    <XzSplit
      class="auto-subtitle"
      @collapsesTo={{72}}
      @mainLeadsStacked={{true}}
      @footerHidden={{if this.hasCues false true}}
      {{filePaste this.load accept=ACCEPT}}
      {{on "dragover" this.allowDrop}}
      {{on "drop" this.dropAnywhere}}
    >
      <:banner>
        <XzCanvas @height={{bandHeight}} @background="var(--xz-surface-2)">
          <Picture
            @peaks={{this.peaks}}
            @duration={{this.duration}}
            @cues={{this.cues}}
            @done={{this.finished}}
            @figure={{this.figure}}
            @unit={{this.unit}}
            @label={{this.pictureLabel}}
          />
        </XzCanvas>
      </:banner>
      <:sidebar>
        <XzRows class="as-controls" @framed={{true}}>
          <XzHeading @text="Model" />
          {{#each this.modeKeys key="@identity"}}
            <XzSegmented
              class="as-mode"
              aria-label="Model"
              @items={{MODE_LABELS}}
              @selected={{this.modeIndex}}
              @disabled={{this.busy}}
              @onChange={{this.pickMode}}
            />
          {{/each}}
          <XzRow
            class="as-model"
            @title={{this.model.name}}
            @detail={{this.model.size}}
            @form="flush"
          >
            <XzPopover class="as-models" @placement="bottom-end">
              <:trigger as |p|>
                <XzButton
                  class="as-models-open"
                  @kind="cell"
                  @label="Models used"
                  @icon={{Info}}
                  {{p.trigger}}
                />
              </:trigger>
              <:content>
                <XzRows
                  class="as-models-panel"
                  role="dialog"
                  aria-label="Models used"
                  @framed={{true}}
                >
                  {{#each MODEL_ROWS as |row|}}
                    <XzRow
                      class="as-models-row"
                      @title={{row.label}}
                      @detail={{row.size}}
                    >
                      <a
                        class="as-models-link"
                        href={{row.href}}
                        target="_blank"
                        rel="noopener noreferrer"
                      >{{row.name}}</a>
                    </XzRow>
                  {{/each}}
                  <XzStatus
                    @text="Experimental requires WebGPU"
                    @tone="muted"
                    @row={{true}}
                  />
                </XzRows>
              </:content>
            </XzPopover>
          </XzRow>
          <XzHeading @text="Language" />
          <LanguagePick
            @value={{this.language}}
            @disabled={{this.busy}}
            @onChange={{this.setLanguage}}
          />
          <XzHeading @text="Format" />
          <XzSegmented
            class="as-format"
            aria-label="Format"
            @items={{FORMAT_LABELS}}
            @selected={{this.formatIndex}}
            @disabled={{this.busy}}
            @onChange={{this.pickFormat}}
          />
          <XzButton
            class="as-run"
            @kind="primary"
            @text="Transcribe"
            @icon={{Captions}}
            @iconStyle="oversized"
            @disabled={{this.unready}}
            @onClick={{this.run}}
          />
          {{#if this.problemText}}
            <XzStatus
              class="as-problem"
              role="alert"
              @text={{this.problemText}}
              @tone="warn"
              @row={{true}}
            />
          {{/if}}
        </XzRows>
        <XzDialog
          class="as-warning"
          @open={{this.warning}}
          @message={{EXPERIMENTAL_WARNING}}
          @onClose={{this.closeWarning}}
          aria-label="Experimental mode"
        >
          <:header>
            <img
              class="as-warning-art"
              src="/art/760mb.webp"
              width="960"
              height="435"
              alt=""
            />
          </:header>
          <:footer as |close|>
            <XzButton
              class="as-warning-cancel"
              @text="Cancel"
              @onClick={{fn close "cancel"}}
            />
            <XzButton
              class="as-warning-proceed"
              @kind="primary"
              @text="Proceed"
              @onClick={{fn close "confirm"}}
            />
          </:footer>
        </XzDialog>
      </:sidebar>
      <:main>
        <XzRows class="as-source" @framed={{true}}>
          <XzHeading @text="Source" />
          {{#if this.file}}
            <XzRow
              class="as-file"
              @title={{this.fileName}}
              @detail={{this.detail}}
              @form="flush"
            >
              <XzButton
                class="as-clear"
                @kind="cell"
                @text="Clear"
                @icon={{Trash}}
                @onClick={{this.clear}}
              />
            </XzRow>
          {{else}}
            <XzDropZone
              class="as-drop"
              @prompt={{DROP_TITLE}}
              @icon={{Wave}}
              @accept={{ACCEPT}}
              @paste={{false}}
              @onFiles={{this.loadFiles}}
              {{on "paste" keepPaste}}
            />
          {{/if}}
        </XzRows>
        {{#if this.showsResult}}
          <XzRows class="as-result" @framed={{true}}>
            <XzHeading @text="Subtitles" />
            {{#if this.busy}}
              <XzRow class="as-busy" @title={{this.status}}>
                <span class="as-busy-cell">
                  <XzLoader @cell={{5}} @gap={{1}} />
                  {{#if this.downloading}}
                    <span role="status">{{this.percent}}%</span>
                  {{/if}}
                </span>
              </XzRow>
              {{#if this.downloading}}
                <XzBar
                  class="as-bar"
                  role="progressbar"
                  aria-label="Progress"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={{this.percent}}
                  @share={{this.share}}
                />
              {{/if}}
              <XzButton
                class="as-cancel"
                @text="Cancel"
                @icon={{Cancel}}
                @onClick={{this.cancel}}
              />
            {{else if this.noCues}}
              <XzStatus
                class="as-empty"
                @text="No cues found."
                @tone="warn"
                @row={{true}}
              />
            {{else}}
              <XzRow class="as-stats" @title={{this.stats}} />
              {{#each this.cues key="@index" as |cue index|}}
                <CueRow
                  @index={{index}}
                  @cue={{cue}}
                  @editable={{true}}
                  @marked={{this.isAltered cue index}}
                  @onChange={{fn this.editCue index}}
                />
              {{/each}}
            {{/if}}
          </XzRows>
        {{/if}}
      </:main>
      <:footer>
        <XzGrid class="as-actions">
          <XzButton
            class="as-copy"
            aria-label="Copy subtitles"
            @text="Copy"
            @icon={{Copy}}
            @onClick={{this.copy}}
          />
          <XzButton
            class="as-download"
            @kind="primary"
            @text={{this.downloadText}}
            @icon={{Save}}
            @onClick={{this.download}}
          />
        </XzGrid>
      </:footer>
    </XzSplit>
  </template>
}
