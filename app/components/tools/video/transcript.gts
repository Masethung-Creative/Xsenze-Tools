import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import XzButton from 'xsenze-tools/components/xz/button';
import XzCanvas from 'xsenze-tools/components/xz/canvas';
import XzEmptyRow from 'xsenze-tools/components/xz/empty-row';
import XzFigure from 'xsenze-tools/components/xz/figure';
import XzGrid from 'xsenze-tools/components/xz/grid';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzRow from 'xsenze-tools/components/xz/row';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSegmented from 'xsenze-tools/components/xz/segmented';
import XzSlider from 'xsenze-tools/components/xz/slider';
import XzSplit from 'xsenze-tools/components/xz/split';
import XzStatus from 'xsenze-tools/components/xz/status';
import XzSwitch from 'xsenze-tools/components/xz/switch';
import XzTiles from 'xsenze-tools/components/xz/tiles';
import type XzToastService from 'xsenze-tools/services/xz-toast';
import { IconSvg } from 'xsenze-tools/components/icon';
import DownloadAll from 'xsenze-tools/components/tools/shared/media/download-all';
import Drop from 'xsenze-tools/components/tools/shared/media/drop';
import Slot from 'xsenze-tools/components/tools/shared/media/slot';
import filePaste from 'xsenze-tools/modifiers/file-paste';
import { downloadBlob } from 'xsenze-tools/lib/download';
import { downloadIcon, passAlong } from 'xsenze-tools/lib/flow-hooks';
import type { Cue } from 'xsenze-tools/lib/subtitles/subtitles';
import {
  EXTRA_FORMATS,
  FORMAT_NAMES,
  MAIN_FORMATS,
  TRANSCRIPT_SUBTITLES,
  baseName,
  clock,
  paragraphs,
  readCues,
  wordCount,
  writeText,
  type Paragraph,
  type Stamps,
  type TranscriptFormat,
  type TranscriptOptions,
} from 'xsenze-tools/lib/subtitles/transcript';
import { acceptAttr } from 'xsenze-tools/lib/tools';
import type { NamedBlob } from 'xsenze-tools/lib/zip-files';
import '../shared/media/media.css';
import './transcript/transcript.css';

const ACCEPT = acceptAttr(TRANSCRIPT_SUBTITLES);
const STAMPS: Stamps[] = ['off', 'paragraph', 'minute'];
const STAMP_LABELS = ['Off', 'Paragraph', 'Minute'];
const bannerHeight = 132;

const Trash = <template><IconSvg @name="trash-2" /></template>;
const Eye = <template><IconSvg @name="eye" /></template>;
const Remove = <template><IconSvg @name="x" /></template>;
const Copy = <template><IconSvg @name="copy" /></template>;
const Save = <template><IconSvg @name={{(downloadIcon)}} /></template>;

type State = 'reading' | 'ready' | 'failed';

interface Item {
  id: number;
  file: File;
  state: State;
  cues: Cue[];
}

const plural = (n: number, word: string) =>
  `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;

const kindOf = (name: string) =>
  name.slice(name.lastIndexOf('.') + 1).toUpperCase();

const lengthOf = (cues: Cue[]) =>
  cues.reduce((end, cue) => Math.max(end, cue.end), 0);

/**
 * Transcripts from subtitle files (SRT, VTT, ASS, LRC), one or many, in any
 * mix of TXT, Word, Markdown, PDF, CSV, JSON and HTML.
 */
export default class TranscriptTool extends Component {
  @service('xz-toast') declare toast: XzToastService;

  drop = new Drop(ACCEPT, (files) => this.add(files), true);

  @tracked items: Item[] = [];
  @tracked selectedId = 0;
  @tracked formats: TranscriptFormat[] = ['txt'];
  @tracked stamps: Stamps = 'paragraph';
  @tracked gapSeconds = 2;
  @tracked dropNotes = true;

  #nextId = 0;

  // ---------- options ----------

  get options(): TranscriptOptions {
    return {
      gapMs: this.gapSeconds * 1000,
      stamps: this.stamps,
      dropNotes: this.dropNotes,
    };
  }

  get stampIndex() {
    return STAMPS.indexOf(this.stamps);
  }

  #formatButtons(list: TranscriptFormat[]) {
    return list.map((format) => ({
      format,
      text: FORMAT_NAMES[format],
      on: this.formats.includes(format),
    }));
  }

  get mainFormats() {
    return this.#formatButtons(MAIN_FORMATS);
  }

  get extraFormats() {
    return this.#formatButtons(EXTRA_FORMATS);
  }

  toggleFormat = (format: TranscriptFormat) => {
    const on = this.formats.includes(format);
    // one format always stays ticked
    if (on && this.formats.length === 1) return;
    const next = on
      ? this.formats.filter((f) => f !== format)
      : [...this.formats, format];
    this.formats = [...MAIN_FORMATS, ...EXTRA_FORMATS].filter((f) =>
      next.includes(f),
    );
  };

  pickStamps = (index: number) => {
    this.stamps = STAMPS[index] ?? 'paragraph';
  };

  setGap = (value: number) => {
    this.gapSeconds = value;
  };

  gapReadout = (value: number) => value.toFixed(1);

  setDropNotes = (on: boolean) => {
    this.dropNotes = on;
  };

  // ---------- the list ----------

  get loaded() {
    return this.items.length > 0;
  }

  get ready() {
    return this.items.filter((item) => item.state === 'ready');
  }

  get selected(): Item | undefined {
    return (
      this.items.find((item) => item.id === this.selectedId) ?? this.items[0]
    );
  }

  get rows() {
    const chosen = this.selected;
    return this.items.map((item) => ({
      item,
      on: item === chosen,
      detail: this.#detail(item),
    }));
  }

  #detail(item: Item) {
    const parts = [kindOf(item.file.name)];
    if (item.state === 'reading') parts.push('Reading…');
    else if (item.state === 'failed') parts.push('No subtitle lines found');
    else {
      parts.push(clock(lengthOf(item.cues)));
      const paras = paragraphs(item.cues, this.options);
      parts.push(paras.length ? plural(wordCount(paras), 'word') : 'No text');
    }
    return parts.join(' · ');
  }

  add = (files: File[]) => {
    if (!files.length) return;
    const fresh = files.map((file): Item => ({
      id: ++this.#nextId,
      file,
      state: 'reading',
      cues: [],
    }));
    this.items = [...this.items, ...fresh];
    if (!this.items.some((item) => item.id === this.selectedId))
      this.selectedId = fresh[0]!.id;
    for (const item of fresh) void this.#read(item);
  };

  addOne = (file: File) => this.add([file]);

  async #read(item: Item) {
    let cues: Cue[] = [];
    try {
      cues = readCues(await item.file.text(), item.file.name);
    } catch {
      // unreadable: shown as failed
    }
    if (this.isDestroying) return;
    this.items = this.items.map((i) =>
      i.id === item.id
        ? { ...i, cues, state: cues.length ? 'ready' : 'failed' }
        : i,
    );
  }

  select = (id: number) => {
    this.selectedId = id;
  };

  remove = (id: number) => {
    this.items = this.items.filter((item) => item.id !== id);
  };

  clear = () => {
    this.items = [];
    this.selectedId = 0;
  };

  // ---------- the preview and the files ----------

  get preview(): Paragraph[] {
    const item = this.selected;
    return item?.state === 'ready' ? paragraphs(item.cues, this.options) : [];
  }

  get hasPreview() {
    return this.preview.length > 0;
  }

  get previewTitle() {
    const item = this.selected;
    return item ? `Transcript: ${baseName(item.file.name)}` : 'Transcript';
  }

  get previewNote() {
    const item = this.selected;
    if (!item) return 'Add a subtitle file to see its transcript here.';
    if (item.state === 'reading') return 'Reading…';
    if (item.state === 'failed')
      return "Couldn't read any subtitle lines from this file.";
    return 'No text left in this file. Try turning off Remove sound notes.';
  }

  stampOf = (p: Paragraph) => clock(p.start);

  get totals() {
    const ready = this.ready;
    const words = ready.reduce(
      (n, item) => n + wordCount(paragraphs(item.cues, this.options)),
      0,
    );
    const ms = ready.reduce((n, item) => n + lengthOf(item.cues), 0);
    return { files: ready.length, words, ms };
  }

  get figure() {
    return this.totals.words.toLocaleString();
  }

  get figureUnit() {
    return this.totals.words === 1 ? 'word' : 'words';
  }

  get figureLabel() {
    const { files, ms } = this.totals;
    if (!files) return 'Drop subtitle files (SRT, VTT, ASS, LRC) to begin';
    return `${plural(files, 'transcript')} · ${clock(ms)}`;
  }

  get tiles() {
    const { files, words, ms } = this.totals;
    return [
      { label: 'Ready', value: `${files} of ${this.items.length}` },
      { label: 'Words', value: words ? words.toLocaleString() : '—' },
      { label: 'Length', value: ms ? clock(ms) : '—' },
      { label: 'Files out', value: String(files * this.formats.length) },
    ];
  }

  get noneReady() {
    return this.ready.length === 0;
  }

  #filesOf = async (items: Item[]): Promise<NamedBlob[]> => {
    const { transcriptFile } =
      await import('xsenze-tools/lib/subtitles/transcript-files');
    const out: NamedBlob[] = [];
    for (const item of items)
      for (const format of this.formats)
        out.push(
          await transcriptFile(item.file.name, item.cues, format, this.options),
        );
    return out;
  };

  allFiles = () => this.#filesOf(this.ready);

  get downloadText() {
    return passAlong(this.formats.length > 1 ? 'Download this' : 'Download');
  }

  copy = () => {
    if (this.hasPreview) void this.toast.copy(writeText(this.preview));
  };

  download = () => void this.#download();

  async #download() {
    const item = this.selected;
    if (!item || !this.hasPreview) return;
    const files = await this.#filesOf([item]);
    if (files.length === 1) {
      downloadBlob(files[0]!.blob, files[0]!.name);
      return;
    }
    const { zipFiles } = await import('xsenze-tools/lib/zip-files');
    downloadBlob(await zipFiles(files), `${baseName(item.file.name)}.zip`);
  }

  <template>
    <XzSplit
      class="transcript"
      @bannerSticks={{true}}
      @mainLeadsStacked={{true}}
      @footerHidden={{if this.hasPreview false true}}
      {{filePaste this.addOne accept=ACCEPT}}
      {{on "dragover" this.drop.enter}}
      {{on "dragleave" this.drop.leave}}
      {{on "drop" this.drop.drop}}
    >
      <:banner>
        <XzCanvas @height={{bannerHeight}}>
          <div class="tr-banner">
            <XzFigure
              class="tr-figure"
              @text={{this.figure}}
              @unit={{this.figureUnit}}
            />
            <span class="tr-banner-label">{{this.figureLabel}}</span>
          </div>
        </XzCanvas>
      </:banner>
      <:sidebar>
        <XzRows class="tr-controls" @framed={{true}}>
          <XzHeading @text="Main formats" />
          <XzGrid class="tr-formats tr-formats--main">
            {{#each this.mainFormats as |f|}}
              <XzButton
                class="tr-format"
                @kind="segment"
                @text={{f.text}}
                @selected={{f.on}}
                aria-pressed={{if f.on "true" "false"}}
                @onClick={{fn this.toggleFormat f.format}}
              />
            {{/each}}
          </XzGrid>
          <XzHeading @text="Extra formats" />
          <XzGrid class="tr-formats tr-formats--extra">
            {{#each this.extraFormats as |f|}}
              <XzButton
                class="tr-format"
                @kind="segment"
                @text={{f.text}}
                @selected={{f.on}}
                aria-pressed={{if f.on "true" "false"}}
                @onClick={{fn this.toggleFormat f.format}}
              />
            {{/each}}
          </XzGrid>
          <XzHeading @text="Timestamps" />
          <XzSegmented
            class="tr-stamps"
            aria-label="Timestamps"
            @items={{STAMP_LABELS}}
            @selected={{this.stampIndex}}
            @onChange={{this.pickStamps}}
          />
          <XzHeading @text="Paragraphs" />
          <XzRow
            class="tr-gap-row"
            @title="Pause (s)"
            @form="flush"
            as |titleId|
          >
            <XzSlider
              class="tr-gap"
              @labelledBy={{titleId}}
              @value={{this.gapSeconds}}
              @min={{1}}
              @max={{6}}
              @step={{0.5}}
              @readout={{this.gapReadout}}
              @onChange={{this.setGap}}
            />
          </XzRow>
          <XzRow @title="Remove sound notes" as |titleId|>
            <XzSwitch
              class="tr-notes"
              aria-labelledby={{titleId}}
              @on={{this.dropNotes}}
              @onChange={{this.setDropNotes}}
            />
          </XzRow>
          <XzEmptyRow @text="Drops [Music], (laughs) and ♪ from the text." />
          <XzHeading @text="Output" />
          <XzTiles @items={{this.tiles}} />
          <DownloadAll
            class="tr-save-all"
            @files={{this.allFiles}}
            @zipName="transcripts.zip"
            @disabled={{this.noneReady}}
          />
        </XzRows>
      </:sidebar>
      <:main>
        <XzRows class="tr-files" @framed={{true}}>
          <XzHeading @text="Files" />
          {{#each this.rows as |row|}}
            <XzRow
              class="tr-file {{if row.on 'tr-file--on'}}"
              @title={{row.item.file.name}}
              @detail={{row.detail}}
              @form="flush"
            >
              <XzButton
                class="tr-view"
                @kind="cell"
                @text="View"
                aria-current={{if row.on "true"}}
                @icon={{Eye}}
                @onClick={{fn this.select row.item.id}}
              />
              <XzButton
                class="tr-remove"
                @kind="cell"
                @text="Remove"
                @icon={{Remove}}
                @onClick={{fn this.remove row.item.id}}
              />
            </XzRow>
          {{/each}}
          <Slot
            class="tr-slot"
            @prompt={{if
              this.loaded
              "Add more subtitle files"
              "Drop subtitle files (SRT, VTT, ASS, LRC)"
            }}
            @icon="file-text"
            @row={{true}}
            @multiple={{true}}
            @accept={{ACCEPT}}
            @over={{this.drop.over}}
            @onFiles={{this.add}}
          />
          {{#if this.loaded}}
            <XzButton
              class="tr-clear"
              @kind="cell"
              @text="Clear all"
              @icon={{Trash}}
              @onClick={{this.clear}}
            />
          {{/if}}
        </XzRows>
        <XzRows class="tr-result" @framed={{true}}>
          <XzHeading @text={{this.previewTitle}} />
          {{#if this.hasPreview}}
            <div class="tr-preview">
              {{#each this.preview as |para|}}
                <p class="tr-para">
                  {{#if para.stamp}}
                    <span class="tr-stamp">[{{this.stampOf para}}]</span>
                  {{/if}}
                  {{para.text}}
                </p>
              {{/each}}
            </div>
          {{else}}
            <XzStatus
              class="tr-note"
              @text={{this.previewNote}}
              @tone="muted"
              @row={{true}}
            />
          {{/if}}
        </XzRows>
      </:main>
      <:footer>
        <XzGrid class="tr-actions">
          <XzButton
            class="tr-copy"
            aria-label="Copy transcript"
            @text="Copy"
            @icon={{Copy}}
            @onClick={{this.copy}}
          />
          <XzButton
            class="tr-download"
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
