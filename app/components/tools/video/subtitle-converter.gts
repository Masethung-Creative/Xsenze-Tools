import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import type Owner from '@ember/owner';
import { modifier } from 'ember-modifier';
import XzButton from 'xsenze-tools/components/xz/button';
import XzCanvas from 'xsenze-tools/components/xz/canvas';
import XzCodeBlock from 'xsenze-tools/components/xz/code-block';
import XzDecimalField from 'xsenze-tools/components/xz/decimal-field';
import XzDropZone from 'xsenze-tools/components/xz/drop-zone';
import XzEmptyRow from 'xsenze-tools/components/xz/empty-row';
import XzFromTo from 'xsenze-tools/components/xz/from-to';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzRow from 'xsenze-tools/components/xz/row';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSegmented from 'xsenze-tools/components/xz/segmented';
import XzSplit from 'xsenze-tools/components/xz/split';
import XzStatus from 'xsenze-tools/components/xz/status';
import XzTextCell from 'xsenze-tools/components/xz/text-cell';
import { IconSvg } from 'xsenze-tools/components/icon';
import CueTimeline, {
  type CueLane,
} from 'xsenze-tools/components/tools/shared/media/cue-timeline';
import {
  RATES,
  downloadName,
  parseRatePair,
  ratePair,
} from 'xsenze-tools/components/tools/video/subtitle-converter/rates';
import Source from 'xsenze-tools/components/tools/shared/text-tool/source';
import { downloadText } from 'xsenze-tools/lib/download';
import { downloadIcon, passAlong } from 'xsenze-tools/lib/flow-hooks';
import {
  detectFormat,
  formatTimestamp,
  parseSubtitles,
  scaleCues,
  shiftCues,
  writeSrt,
  writeVtt,
  type SubtitleFormat,
} from 'xsenze-tools/lib/subtitles/subtitles';
import { SUBTITLE_ACCEPT } from 'xsenze-tools/lib/tools';
import filePaste, { matchesAccept } from 'xsenze-tools/modifiers/file-paste';
import './subtitle-converter/subtitle-converter.css';

const ACCEPT = SUBTITLE_ACCEPT.join(',');
const FORMATS: SubtitleFormat[] = ['srt', 'vtt'];
const FORMAT_LABELS = ['SRT', 'VTT'];
const MIME: Record<SubtitleFormat, string> = {
  srt: 'application/x-subrip',
  vtt: 'text/vtt',
};
const VTT_KINDS = ['', 'captions', 'subtitles', 'descriptions'];
const KIND_LABELS = VTT_KINDS.map((kind) => kind || '—');
const RATE_LABELS = RATES.map((rate) => rate.label);
/** fixed 132px canvas */
const BAND_HEIGHT = 132;

const FileIcon = <template><IconSvg @name="captions" /></template>;
const Save = <template><IconSvg @name={{(downloadIcon)}} /></template>;

// the document paste (filePaste) would load a drop-zone paste a second time
const keepPaste = (event: Event) => event.stopPropagation();

const editable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.matches('input, textarea, select'));

const label = (format: SubtitleFormat | null) =>
  format ? FORMAT_LABELS[FORMATS.indexOf(format)] : undefined;

/** The port of SubtitleConverterViewController, with the input as the main pane's editor. */
export default class SubtitleConverterTool extends Component {
  @tracked input = '';
  @tracked fileName = '';
  @tracked target: SubtitleFormat = 'vtt';
  @tracked shiftSeconds = 0;
  @tracked scaleFactor = 1;
  @tracked rateFrom?: number;
  @tracked rateTo?: number;
  @tracked vttKind = '';
  @tracked vttLanguage = '';

  // ?subText= ?subShift=2.5 ?subScale=0.95904 ?subRate=0,2: preset the tool from the URL
  constructor(owner: Owner, args: object) {
    super(owner, args);
    const query = new URLSearchParams(window.location.search);
    const text = query.get('subText');
    if (text) this.#load(text, '');
    const shift = Number(query.get('subShift'));
    if (Number.isFinite(shift)) this.shiftSeconds = shift;
    const scale = Number(query.get('subScale'));
    if (scale > 0 && Number.isFinite(scale)) this.scaleFactor = scale;
    const pair = parseRatePair(query.get('subRate'));
    if (pair) this.#pickRate(pair);
  }

  get detected() {
    return detectFormat(this.input);
  }

  @cached
  get cues() {
    return parseSubtitles(this.input);
  }

  // scale before shift
  @cached
  get adjusted() {
    let cues = this.cues;
    if (this.scaleFactor !== 1 && this.scaleFactor > 0)
      cues = scaleCues(cues, this.scaleFactor);
    if (this.shiftSeconds)
      cues = shiftCues(cues, Math.round(this.shiftSeconds * 1000));
    return cues;
  }

  @cached
  get output() {
    if (this.adjusted.length === 0) return '';
    if (this.target === 'srt') return writeSrt(this.adjusted);
    return writeVtt(this.adjusted, {
      kind: this.vttKind,
      language: this.vttLanguage,
    });
  }

  get hasInput() {
    return this.input.trim().length > 0;
  }

  get noCues() {
    return this.hasInput && this.adjusted.length === 0;
  }

  get stats() {
    const cues = this.adjusted;
    const first = cues[0];
    const last = cues.at(-1);
    if (!first || !last) return '';
    return `${cues.length} cues · ${formatTimestamp(first.start, '.')} – ${formatTimestamp(last.end, '.')}`;
  }

  get inputHeading() {
    const detected = label(this.detected);
    return detected ? `Input · ${detected}` : 'Input';
  }

  get sourceFormat() {
    return label(this.detected);
  }

  get resultFormat() {
    return label(this.target)!;
  }

  get targetIndex() {
    return FORMATS.indexOf(this.target);
  }

  get kindIndex() {
    return Math.max(0, VTT_KINDS.indexOf(this.vttKind));
  }

  get isVtt() {
    return this.target === 'vtt';
  }

  get lanes(): CueLane[] {
    return [
      { cues: this.cues, label: this.sourceFormat },
      {
        cues: this.adjusted,
        label: this.resultFormat,
        lit: true,
      },
    ];
  }

  get timelineLabel() {
    return this.stats || 'Timeline';
  }

  get downloadText() {
    return passAlong('Download');
  }

  #load(text: string, fileName: string) {
    this.input = text;
    this.fileName = fileName;
    const detected = detectFormat(text);
    if (detected) this.target = detected === 'srt' ? 'vtt' : 'srt';
  }

  readFile = (file: File) => {
    void file.text().then((text) => {
      if (!this.isDestroying) this.#load(text, file.name);
    });
  };

  readFiles = (files: File[]) => {
    if (files[0]) this.readFile(files[0]);
  };

  setInput = (text: string) => {
    this.input = text;
    this.fileName = '';
  };

  pickTarget = (index: number) => {
    this.target = FORMATS[index] ?? 'vtt';
  };

  setShift = (seconds: number) => {
    this.shiftSeconds = seconds;
  };

  // a typed scale lets go of the rate pair
  setScale = (factor: number) => {
    this.scaleFactor = factor;
    this.rateFrom = undefined;
    this.rateTo = undefined;
  };

  #pickRate({
    from,
    to,
    factor,
  }: {
    from: number;
    to: number;
    factor: number;
  }) {
    this.rateFrom = from;
    this.rateTo = to;
    this.scaleFactor = factor;
  }

  pickRateFrom = (index: number) =>
    this.#pickRate(ratePair(index, this.rateTo));

  pickRateTo = (index: number) =>
    this.#pickRate(ratePair(this.rateFrom, index));

  pickKind = (index: number) => {
    this.vttKind = VTT_KINDS[index] ?? '';
  };

  setLanguage = (language: string) => {
    this.vttLanguage = language;
  };

  download = () => {
    if (!this.output) return;
    downloadText(
      this.output,
      downloadName(this.fileName, this.target),
      MIME[this.target],
    );
  };

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
    this.readFile(file);
  };

  // subtitle text pasted outside a field loads as the input; files go through filePaste
  pasteText = modifier(() => {
    const paste = (event: ClipboardEvent) => {
      if (editable(event.target) || event.clipboardData?.files.length) return;
      const text = event.clipboardData?.getData('text/plain') ?? '';
      if (!detectFormat(text)) return;
      event.preventDefault();
      this.setInput(text);
    };
    document.addEventListener('paste', paste);
    return () => document.removeEventListener('paste', paste);
  });

  <template>
    <XzSplit
      class="subtitle-converter"
      @collapsesTo={{72}}
      @mainLeadsStacked={{true}}
      {{filePaste this.readFile accept=ACCEPT}}
      {{this.pasteText}}
      {{on "dragover" this.allowDrop}}
      {{on "drop" this.dropAnywhere}}
    >
      <:banner>
        <XzCanvas @height={{BAND_HEIGHT}} @background="var(--xz-surface-2)">
          <CueTimeline
            class="sc-timeline"
            @lanes={{this.lanes}}
            @label={{this.timelineLabel}}
          />
        </XzCanvas>
      </:banner>
      <:sidebar>
        <XzRows @framed={{true}}>
          <XzHeading @text="Target" />
          <XzSegmented
            class="sc-target"
            aria-label="Target"
            @items={{FORMAT_LABELS}}
            @selected={{this.targetIndex}}
            @onChange={{this.pickTarget}}
          />
          <XzRow class="sc-shift" @title="Shift (s)" @form="flush" as |titleId|>
            <XzDecimalField
              @value={{this.shiftSeconds}}
              @signed={{true}}
              @min={{-86400}}
              @max={{86400}}
              @labelledBy={{titleId}}
              @onChange={{this.setShift}}
            />
          </XzRow>
          <XzRow class="sc-scale" @title="Scale (×)" @form="flush" as |titleId|>
            <XzDecimalField
              @value={{this.scaleFactor}}
              @unit="×"
              @step={{0.001}}
              @decimals={{6}}
              @min={{0.000001}}
              @max={{1000}}
              @labelledBy={{titleId}}
              @onChange={{this.setScale}}
            />
          </XzRow>
          <XzHeading @text="Rate" />
          <XzFromTo
            class="sc-rate"
            @items={{RATE_LABELS}}
            @from={{this.rateFrom}}
            @to={{this.rateTo}}
            @fromLabel="Source"
            @toLabel="Target"
            @onFromChange={{this.pickRateFrom}}
            @onToChange={{this.pickRateTo}}
          />
          {{#if this.isVtt}}
            <XzHeading @text="Kind" />
            <XzSegmented
              class="sc-kind"
              aria-label="Kind"
              @items={{KIND_LABELS}}
              @columns={{2}}
              @selected={{this.kindIndex}}
              @onChange={{this.pickKind}}
            />
            <XzRow
              class="sc-language"
              @title="Language"
              @form="flush"
              as |titleId|
            >
              <XzTextCell
                class="sc-language-cell"
                @value={{this.vttLanguage}}
                @placeholder="en"
                aria-labelledby={{titleId}}
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                @onChange={{this.setLanguage}}
              />
            </XzRow>
          {{/if}}
        </XzRows>
      </:sidebar>
      <:main>
        <XzRows class="sc-input" @framed={{true}}>
          <Source
            @heading={{this.inputHeading}}
            @text={{this.input}}
            @label="Subtitle input"
            @onChange={{this.setInput}}
          />
          {{#if this.fileName}}
            <XzRow
              class="sc-file"
              @title={{this.fileName}}
              @icon={{FileIcon}}
            />
          {{else}}
            {{#unless this.hasInput}}
              <XzDropZone
                class="sc-drop"
                @prompt="SRT or VTT"
                @icon={{FileIcon}}
                @accept={{ACCEPT}}
                @paste={{false}}
                @onFiles={{this.readFiles}}
                {{on "paste" keepPaste}}
              />
            {{/unless}}
          {{/if}}
        </XzRows>
        <XzRows class="sc-output" @framed={{true}}>
          <XzHeading @text="Output" />
          {{#if this.stats}}
            <XzRow class="sc-stats" @title={{this.stats}} />
          {{/if}}
          {{#if this.noCues}}
            <XzStatus
              class="sc-warning"
              @text="No cues found."
              @tone="warn"
              @row={{true}}
            />
          {{/if}}
          {{#if this.output}}
            <XzCodeBlock
              class="sc-code"
              aria-label="Converted output"
              @code={{this.output}}
              @maxHeight={{420}}
            />
            <XzButton
              class="sc-download"
              @kind="primary"
              @text={{this.downloadText}}
              @icon={{Save}}
              @iconStyle="oversized"
              @onClick={{this.download}}
            />
          {{else}}
            {{#unless this.noCues}}
              <XzEmptyRow @text="None" />
            {{/unless}}
          {{/if}}
        </XzRows>
      </:main>
    </XzSplit>
  </template>
}
