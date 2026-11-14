import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import CanonButton from 'delphicanon/components/canon-button';
import CanonCanvas from 'delphicanon/components/canon-canvas';
import CanonCompressionScale from 'delphicanon/components/canon-compression-scale';
import CanonEmptyRow from 'delphicanon/components/canon-empty-row';
import CanonHeading from 'delphicanon/components/canon-heading';
import CanonImageCompare from 'delphicanon/components/canon-image-compare';
import CanonRow from 'delphicanon/components/canon-row';
import CanonRows from 'delphicanon/components/canon-rows';
import CanonSegmented from 'delphicanon/components/canon-segmented';
import CanonSlider from 'delphicanon/components/canon-slider';
import CanonSplit from 'delphicanon/components/canon-split';
import CanonStatus from 'delphicanon/components/canon-status';
import CanonSwitch from 'delphicanon/components/canon-switch';
import CanonTiles from 'delphicanon/components/canon-tiles';
import { IconSvg } from 'xsenze-tools/components/icon';
import filePaste from 'xsenze-tools/modifiers/file-paste';
import { downloadBlob } from 'xsenze-tools/lib/download';
import { formatBytes } from 'xsenze-tools/lib/format';
import { IMAGE_ACCEPT, acceptAttr } from 'xsenze-tools/lib/tools';
import type { NamedBlob } from 'xsenze-tools/lib/zip-files';
import {
  IMAGE_FORMATS,
  compressImage,
  formatOf,
  imageSize,
  stopImageWork,
  type OutFormat,
} from 'xsenze-tools/lib/image-compress';
import DownloadAll from 'xsenze-tools/components/tools/media/download-all';
import Drop from 'xsenze-tools/components/tools/media/drop';
import Job from 'xsenze-tools/components/tools/media/job';
import Slot from 'xsenze-tools/components/tools/media/slot';
import WorkBanner from 'xsenze-tools/components/tools/media/work-banner';
import './media/media.css';
import './image-compressor.css';

const ACCEPT = acceptAttr(IMAGE_ACCEPT);
const COMPRESS_ERROR = "Couldn't compress this image. Try another format.";
const scaleHeight = 132;
const tallestPreview = 420;
const KB = 1024;

const MODES = ['Quality', 'Target size'];
const TARGET_KB = [100, 200, 500, 1000];
const TARGETS = ['100 KB', '200 KB', '500 KB', '1 MB'];
/** null keeps each image's format. */
const FORMAT_PICKS: (OutFormat | null)[] = [
  null,
  ...IMAGE_FORMATS.map((f) => f.id),
];
const FORMATS = ['Same', ...IMAGE_FORMATS.map((f) => f.label)];
const PNG_INDEX = FORMAT_PICKS.indexOf('png');
const SIDES = [0, 2560, 1920, 1280, 800];
const SIZES = ['Original', '2560', '1920', '1280', '800'];
const VIEWS = ['Original', 'Compressed'];
const FORMAT_NOTES: Record<OutFormat, string> = {
  jpeg: 'JPEG opens everywhere. It has no transparency, so clear areas turn white.',
  webp: 'WebP is about a third smaller than JPEG and opens in every modern browser.',
  avif: "AVIF is the smallest, but it is slow to encode and some older apps can't open it.",
  png: 'PNG is lossless. Reduce colours makes graphics and screenshots much smaller.',
};

const Trash = <template><IconSvg @name="trash-2" /></template>;
const Eye = <template><IconSvg @name="eye" /></template>;
const Remove = <template><IconSvg @name="x" /></template>;
const Shrink = <template><IconSvg @name="image-minus" /></template>;

const whole = (v: number) => `${Math.round(v * 100)}`;
const labelOf = (format: OutFormat) =>
  IMAGE_FORMATS.find((f) => f.id === format)!.label;
const extOf = (format: OutFormat) =>
  IMAGE_FORMATS.find((f) => f.id === format)!.ext;

interface Result {
  blob: Blob;
  /** Empty when the original is kept: it shows the item's own url. */
  url: string;
  width: number;
  height: number;
  format: OutFormat;
  missed: boolean;
  /** The re-encode came out larger, so the original stays. */
  kept: boolean;
}

interface Item {
  id: number;
  file: File;
  url: string;
  format: OutFormat | null;
  width: number;
  height: number;
  /** The browser cannot decode it. */
  broken: boolean;
  failed: boolean;
  result: Result | null;
}

/** Smaller images from WASM codecs in a worker, on the device. */
export default class ImageCompressor extends Component {
  drop = new Drop(ACCEPT, (files) => this.add(files), true);

  @tracked items: Item[] = [];
  @tracked selectedId = 0;

  @tracked mode = 0;
  @tracked quality = 0.75;
  @tracked target = 1;
  @tracked formatPick = 0;
  @tracked sizePick = 0;
  @tracked reduceColours = true;

  @tracked busy = false;
  @tracked progress = 0;
  @tracked current = 0;
  @tracked view = 1;
  @tracked compareOn = true;

  #nextId = 0;
  #job = 0;

  willDestroy() {
    super.willDestroy();
    this.#job++;
    stopImageWork();
    for (const item of this.items) this.#release(item, true);
  }

  // ---------- the list ----------

  get usable() {
    return this.items.filter((item) => !item.broken);
  }

  get selected() {
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
    if (item.broken) return "Can't read this image";
    const parts = [];
    const r = item.result;
    const w = r?.width ?? item.width;
    const h = r?.height ?? item.height;
    if (w && h) parts.push(`${w} × ${h}`);
    if (r) {
      parts.push(
        `${formatBytes(item.file.size)} → ${formatBytes(r.blob.size)}`,
        saving(item.file.size, r.blob.size),
      );
      if (r.kept) parts.push('already smaller, kept');
      else if (r.missed) parts.push('over target');
    } else {
      if (item.format) parts.push(labelOf(item.format));
      parts.push(formatBytes(item.file.size));
      if (item.failed) parts.push('failed');
    }
    return parts.join(' · ');
  }

  add = (files: File[]) => {
    if (this.busy) return;
    const fresh = files.map((file): Item => ({
      id: ++this.#nextId,
      file,
      url: URL.createObjectURL(file),
      format: formatOf(file),
      width: 0,
      height: 0,
      broken: false,
      failed: false,
      result: null,
    }));
    if (!fresh.length) return;
    this.items = [...this.items, ...fresh];
    if (!this.items.some((item) => item.id === this.selectedId))
      this.selectedId = fresh[0]!.id;
    for (const item of fresh) void this.#measure(item);
  };

  addOne = (file: File) => this.add([file]);

  async #measure(item: Item) {
    const size = await imageSize(item.file);
    this.#patch(item.id, size ? size : { broken: true });
  }

  #patch(id: number, changes: Partial<Item>) {
    this.items = this.items.map((item) =>
      item.id === id ? { ...item, ...changes } : item,
    );
  }

  select = (id: number) => {
    this.selectedId = id;
  };

  remove = (id: number) => {
    if (this.busy) return;
    const item = this.items.find((i) => i.id === id);
    if (item) this.#release(item, true);
    this.items = this.items.filter((i) => i.id !== id);
  };

  clear = () => {
    if (this.busy) return;
    for (const item of this.items) this.#release(item, true);
    this.items = [];
    this.selectedId = 0;
  };

  /** Lets go of an item's result url, and its own when it leaves. */
  #release(item: Item, all = false) {
    const urls = [item.result?.url, all ? item.url : ''];
    // the preview lets go of them on the next render
    setTimeout(() => {
      for (const url of urls) if (url) URL.revokeObjectURL(url);
    });
  }

  // ---------- settings ----------

  get blockedFormats() {
    return this.mode === 1 ? [PNG_INDEX] : [];
  }

  get formatIndex() {
    return this.blockedFormats.includes(this.formatPick) ? 0 : this.formatPick;
  }

  /** What one image becomes. */
  outFormat(item: Pick<Item, 'format'>): OutFormat {
    const pick = FORMAT_PICKS[this.formatIndex] ?? null;
    const format = pick ?? item.format ?? 'webp';
    // a palette cannot aim at a size
    return this.mode === 1 && format === 'png' ? 'webp' : format;
  }

  get outFormats() {
    const list = this.usable.length ? this.usable : [{ format: null }];
    return new Set(list.map((item) => this.outFormat(item)));
  }

  get showsQuality() {
    return this.mode === 0 && [...this.outFormats].some((f) => f !== 'png');
  }

  get showsColours() {
    return this.outFormats.has('png');
  }

  get blockedSizes() {
    const longest = Math.max(
      0,
      ...this.usable.map((item) => Math.max(item.width, item.height)),
    );
    if (!longest) return [];
    return SIDES.flatMap((side, i) => (side && side >= longest ? [i] : []));
  }

  get sizeIndex() {
    return this.blockedSizes.includes(this.sizePick) ? 0 : this.sizePick;
  }

  get formatNote() {
    const pick = FORMAT_PICKS[this.formatIndex];
    if (pick) return FORMAT_NOTES[pick];
    return this.mode === 1
      ? 'Each image keeps its format. PNGs become WebP so they can hit a size.'
      : 'Each image keeps its format.';
  }

  #changed() {
    if (!this.items.some((item) => item.result || item.failed)) return;
    for (const item of this.items) this.#release(item);
    this.items = this.items.map((item) => ({
      ...item,
      result: null,
      failed: false,
    }));
  }

  pickMode = (i: number) => {
    this.mode = i;
    this.#changed();
  };
  setQuality = (value: number) => {
    this.quality = value;
    this.#changed();
  };
  pickTarget = (i: number) => {
    this.target = i;
    this.#changed();
  };
  pickFormat = (i: number) => {
    this.formatPick = i;
    this.#changed();
  };
  pickSize = (i: number) => {
    this.sizePick = i;
    this.#changed();
  };
  setColours = (on: boolean) => {
    this.reduceColours = on;
    this.#changed();
  };
  pickView = (i: number) => {
    this.view = i;
  };
  setCompare = (on: boolean) => {
    this.compareOn = on;
  };

  // ---------- the job ----------

  get done() {
    return this.usable.length > 0 && this.usable.every((item) => item.result);
  }

  get ready() {
    return !this.busy && this.usable.length > 0;
  }

  get runTitle() {
    if (this.busy) return 'Compressing…';
    const n = this.usable.length;
    return n > 1 ? `Compress ${n} images` : 'Compress';
  }

  get bannerTitle() {
    const n = this.usable.length;
    return n > 1 ? `Compressing ${this.current} of ${n}…` : 'Compressing…';
  }

  compress = () => void this.#compress();

  async #compress() {
    if (!this.ready) return;
    const job = ++this.#job;
    this.#changed();
    const todo = this.usable;
    const n = todo.length;
    this.busy = true;
    this.progress = 0;
    const maxSide = SIDES[this.sizeIndex] ?? 0;
    const targetBytes =
      this.mode === 1 ? (TARGET_KB[this.target] ?? 200) * KB : null;
    try {
      for (const [i, item] of todo.entries()) {
        this.current = i + 1;
        const format = this.outFormat(item);
        try {
          const out = await compressImage(
            item.file,
            {
              format,
              quality: Math.round(this.quality * 100),
              maxSide,
              reduceColours: this.reduceColours,
              targetBytes,
            },
            (share) => {
              if (job === this.#job) this.progress = (i + share) / n;
            },
          );
          if (job !== this.#job) return;
          const sameSize =
            out.width === item.width && out.height === item.height;
          const kept =
            format === item.format &&
            sameSize &&
            out.blob.size >= item.file.size;
          this.#patch(item.id, {
            failed: false,
            result: {
              blob: kept ? item.file : out.blob,
              url: kept ? '' : URL.createObjectURL(out.blob),
              width: out.width,
              height: out.height,
              format,
              missed: out.missed && !kept,
              kept,
            },
          });
        } catch (error) {
          if (job !== this.#job) return;
          if ((error as Error).name === 'AbortError') return;
          console.error('Image compress failed:', error);
          this.#patch(item.id, { failed: true });
        }
        this.progress = (i + 1) / n;
      }
      if (job === this.#job) this.view = 1;
    } finally {
      if (job === this.#job) this.busy = false;
    }
  }

  cancel = () => {
    this.#job++;
    stopImageWork();
    this.busy = false;
    this.progress = 0;
  };

  #name(item: Item) {
    const r = item.result!;
    const dot = item.file.name.lastIndexOf('.');
    const stem = dot > 0 ? item.file.name.slice(0, dot) : item.file.name;
    const ext =
      r.kept && dot > 0 ? item.file.name.slice(dot + 1) : extOf(r.format);
    return `${stem}-compressed.${ext}`;
  }

  outputs = (): NamedBlob[] =>
    this.items.flatMap((item) =>
      item.result ? [{ name: this.#name(item), blob: item.result.blob }] : [],
    );

  save = () => {
    const item = this.usable[0];
    if (item?.result) downloadBlob(item.result.blob, this.#name(item));
  };

  // ---------- readouts ----------

  get sourceBytes() {
    return this.usable.reduce((sum, item) => sum + item.file.size, 0);
  }

  get resultBytes() {
    return this.done
      ? this.usable.reduce((sum, item) => sum + item.result!.blob.size, 0)
      : 0;
  }

  get scaleFormat() {
    const formats = this.outFormats;
    return formats.size === 1 ? labelOf([...formats][0]!) : 'Mixed';
  }

  get tiles() {
    const before = this.sourceBytes;
    const after = this.resultBytes;
    const side = SIDES[this.sizeIndex];
    return [
      { label: 'Images', value: String(this.usable.length) },
      { label: 'Format', value: this.usable.length ? this.scaleFormat : '—' },
      { label: 'Original', value: before ? formatBytes(before) : '—' },
      { label: 'Compressed', value: after ? formatBytes(after) : '—' },
      { label: 'Saving', value: after ? saving(before, after) : '—' },
      { label: 'Longest side', value: side ? `${side} px` : 'Original' },
    ];
  }

  get single() {
    return this.usable.length === 1;
  }

  get singleResult() {
    const item = this.usable[0];
    if (!this.single || !item?.result) return null;
    return { name: this.#name(item), detail: this.#detail(item) };
  }

  get warning() {
    const broken = this.items.length - this.usable.length;
    const failed = this.items.filter((item) => item.failed).length;
    const missed = this.items.filter((item) => item.result?.missed).length;
    if (failed)
      return `Couldn't compress ${plural(failed, 'image')}. Try another format.`;
    if (missed)
      return `${plural(missed, 'image')} couldn't get under ${TARGETS[this.target]}, even at the lowest quality. Try a smaller longest side.`;
    if (broken)
      return `${plural(broken, 'file')} can't be read here and will be skipped.`;
    return '';
  }

  // ---------- preview ----------

  get previewAspect() {
    const item = this.selected;
    return item?.width && item.height
      ? Math.max(item.width / item.height, 0.6)
      : 16 / 9;
  }

  get resultUrl() {
    const r = this.selected?.result;
    return r ? r.url || this.selected.url : '';
  }

  get comparing() {
    return this.compareOn && !!this.resultUrl;
  }

  get shownUrl() {
    return (this.view === 1 && this.resultUrl) || this.selected?.url || '';
  }

  <template>
    <CanonSplit
      class="image-compressor"
      @bannerSticks={{true}}
      @mainLeadsStacked={{true}}
      {{filePaste this.addOne accept=ACCEPT}}
      {{on "dragover" this.drop.enter}}
      {{on "dragleave" this.drop.leave}}
      {{on "drop" this.drop.drop}}
    >
      <:banner>
        <CanonCanvas @height={{scaleHeight}}>
          {{#if this.busy}}
            <WorkBanner
              @title={{this.bannerTitle}}
              @progress={{this.progress}}
              @onCancel={{this.cancel}}
            />
          {{else}}
            <CanonCompressionScale
              @before={{this.sourceBytes}}
              @after={{this.resultBytes}}
              @format={{this.scaleFormat}}
            />
          {{/if}}
        </CanonCanvas>
      </:banner>
      <:sidebar>
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Compress by" />
          <CanonSegmented
            @items={{MODES}}
            @selected={{this.mode}}
            @disabled={{this.busy}}
            @onChange={{this.pickMode}}
          />
          {{#if this.mode}}
            <CanonHeading @text="Target size, each image" />
            <CanonSegmented
              @items={{TARGETS}}
              @selected={{this.target}}
              @disabled={{this.busy}}
              @onChange={{this.pickTarget}}
            />
          {{else if this.showsQuality}}
            <CanonRow
              class="ic-quality"
              @title="Quality"
              @form="flush"
              as |titleId|
            >
              <CanonSlider
                @value={{this.quality}}
                @min={{0.05}}
                @max={{1}}
                @step={{0.01}}
                @readout={{whole}}
                @labelledBy={{titleId}}
                @onChange={{this.setQuality}}
              />
            </CanonRow>
          {{/if}}
          <CanonHeading @text="Format" />
          <CanonSegmented
            @items={{FORMATS}}
            @selected={{this.formatIndex}}
            @disabledIndices={{this.blockedFormats}}
            @disabled={{this.busy}}
            @onChange={{this.pickFormat}}
          />
          <CanonEmptyRow @text={{this.formatNote}} />
          {{#if this.showsColours}}
            <CanonRow @title="Reduce colours" as |titleId|>
              <CanonSwitch
                aria-labelledby={{titleId}}
                @on={{this.reduceColours}}
                @disabled={{this.busy}}
                @onChange={{this.setColours}}
              />
            </CanonRow>
          {{/if}}
          <CanonHeading @text="Longest side" />
          <CanonSegmented
            @items={{SIZES}}
            @selected={{this.sizeIndex}}
            @disabledIndices={{this.blockedSizes}}
            @disabled={{this.busy}}
            @onChange={{this.pickSize}}
          />
          <CanonHeading @text="Output" />
          <CanonTiles @items={{this.tiles}} />
          {{! progress shows in the banner; here the button just says so }}
          <Job
            @title={{this.runTitle}}
            @icon={{Shrink}}
            @failure={{COMPRESS_ERROR}}
            @disabled={{if this.ready false true}}
            @busy={{false}}
            @failed={{false}}
            @result={{this.singleResult}}
            @onRun={{this.compress}}
            @onSave={{this.save}}
          />
          {{#if this.done}}
            {{#unless this.single}}
              <DownloadAll
                class="ic-save-all"
                @files={{this.outputs}}
                @zipName="images-compressed.zip"
              />
            {{/unless}}
          {{/if}}
        </CanonRows>
      </:sidebar>
      <:main>
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Images" />
          {{#each this.rows as |row|}}
            <CanonRow
              class="ic-item {{if row.on 'ic-item--on'}}"
              @title={{row.item.file.name}}
              @detail={{row.detail}}
              @form="flush"
            >
              <CanonButton
                class="ic-view"
                @kind="cell"
                @text={{if row.on "Viewing" "View"}}
                @icon={{Eye}}
                @disabled={{row.item.broken}}
                @onClick={{fn this.select row.item.id}}
              />
              <CanonButton
                class="ic-remove"
                @kind="cell"
                @text="Remove"
                @icon={{Remove}}
                @disabled={{this.busy}}
                @onClick={{fn this.remove row.item.id}}
              />
            </CanonRow>
          {{/each}}
          <Slot
            class="ic-slot"
            @prompt={{if
              this.items.length
              "Add more images"
              "Drop images here"
            }}
            @icon="image"
            @row={{true}}
            @multiple={{true}}
            @accept={{ACCEPT}}
            @over={{this.drop.over}}
            @onFiles={{this.add}}
          />
          {{#if this.items.length}}
            <CanonButton
              class="ic-clear"
              @kind="cell"
              @text="Clear all"
              @icon={{Trash}}
              @disabled={{this.busy}}
              @onClick={{this.clear}}
            />
          {{/if}}
          {{#if this.warning}}
            <CanonStatus @text={{this.warning}} @tone="warn" @row={{true}} />
          {{/if}}
          {{#if this.resultUrl}}
            <CanonSegmented
              @items={{VIEWS}}
              @selected={{this.view}}
              @onChange={{this.pickView}}
            />
            <CanonRow @title="Compare quality" as |titleId|>
              <CanonSwitch
                aria-labelledby={{titleId}}
                @on={{this.compareOn}}
                @onChange={{this.setCompare}}
              />
            </CanonRow>
          {{/if}}
        </CanonRows>
        <CanonCanvas
          class="ic-preview"
          @aspect={{this.previewAspect}}
          @maxHeight={{tallestPreview}}
          @boxing="unlessWide"
          @background="var(--canon-muted)"
        >
          {{#if this.comparing}}
            <CanonImageCompare
              @before={{this.selected.url}}
              @after={{this.resultUrl}}
              @beforeTitle="Original"
              @afterTitle="Compressed"
            />
          {{else if this.shownUrl}}
            <img class="ic-image" src={{this.shownUrl}} alt="" />
          {{/if}}
        </CanonCanvas>
      </:main>
    </CanonSplit>
  </template>
}

function saving(before: number, after: number) {
  if (!before) return '';
  const pct = Math.round((1 - after / before) * 100);
  return pct >= 0 ? `−${pct}%` : `+${-pct}%`;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
