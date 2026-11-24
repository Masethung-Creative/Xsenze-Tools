import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import XzButton from 'xsenze-tools/components/xz/button';
import XzCanvas from 'xsenze-tools/components/xz/canvas';
import XzEmptyRow from 'xsenze-tools/components/xz/empty-row';
import XzGrid from 'xsenze-tools/components/xz/grid';
import XzHeading from 'xsenze-tools/components/xz/heading';
import type { XzLamp } from 'xsenze-tools/components/xz/lamps';
import XzReadoutBand from 'xsenze-tools/components/xz/readout-band';
import XzRow from 'xsenze-tools/components/xz/row';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSlider from 'xsenze-tools/components/xz/slider';
import XzSplit from 'xsenze-tools/components/xz/split';
import XzStatus from 'xsenze-tools/components/xz/status';
import { IconSvg } from 'xsenze-tools/components/icon';
import filePaste from 'xsenze-tools/modifiers/file-paste';
import { downloadBlob } from 'xsenze-tools/lib/download';
import { formatBytes } from 'xsenze-tools/lib/format';
import { formatFps } from 'xsenze-tools/lib/video/media-probe';
import { formatTimestamp } from 'xsenze-tools/lib/subtitles/subtitles';
import { seekTo, VideoIntake } from 'xsenze-tools/lib/video/video';
import { VIDEO_ACCEPT, acceptAttr } from 'xsenze-tools/lib/tools';
import DownloadAll from 'xsenze-tools/components/tools/shared/media/download-all';
import Drop from 'xsenze-tools/components/tools/shared/media/drop';
import Job from 'xsenze-tools/components/tools/shared/media/job';
import Marks from 'xsenze-tools/components/tools/shared/media/marks';
import Playback from 'xsenze-tools/components/tools/shared/media/playback';
import Slot from 'xsenze-tools/components/tools/shared/media/slot';
import Strips, {
  bandHeight,
} from 'xsenze-tools/components/tools/shared/media/strips';
import {
  release,
  thumbnails,
} from 'xsenze-tools/components/tools/shared/media/frames';
import Stills, {
  type Still,
} from 'xsenze-tools/components/tools/video/frame-extractor/stills';
import {
  contactSheet,
  sheetGrid,
  sheetTimes,
  stamp,
} from 'xsenze-tools/components/tools/video/frame-extractor/sheet';
import '../shared/media/media.css';
import './frame-extractor/frame-extractor.css';

const ACCEPT = acceptAttr(VIDEO_ACCEPT);
const GRAB_ERROR = "Couldn't save that frame.";
const SHEET_ERROR = "Couldn't build the contact sheet.";
const tc = (seconds: number) => formatTimestamp(seconds * 1000, '.');

// preview size cap
const tallest = 1.25;
const tallestPreview = 340;
const lamps: XzLamp[] = ['play', 'pause'];
const sheetMin = 2;
const sheetMax = 48;
// seconds the sheet times stay on the strip after the slider moves
const sheetMarksLinger = 1.5;
const whole = (value: number) => String(Math.round(value));

/** Debug query flags: ?fxGrab=1.5,3 ?fxStep=5 ?fxSheet=yes. */
function flags() {
  if (typeof window === 'undefined') return null;
  const query = new URLSearchParams(window.location.search);
  return {
    grab: (query.get('fxGrab') ?? '')
      .split(',')
      .filter(Boolean)
      .map(Number)
      .filter(Number.isFinite),
    step: Number(query.get('fxStep')) || 0,
    sheet: query.get('fxSheet') === 'yes',
  };
}

const Trash = <template><IconSvg @name="trash-2" /></template>;
const Camera = <template><IconSvg @name="camera" /></template>;
const Sheet = <template><IconSvg @name="grid-3x3" /></template>;
const Back = <template><IconSvg @name="chevron-left" /></template>;
const Forward = <template><IconSvg @name="chevron-right" /></template>;
const PlayIcon = <template><IconSvg @name="play" /></template>;
const PauseIcon = <template><IconSvg @name="pause" /></template>;

/** The port of FrameExtractorViewController, on the web tool's canvas grabs. */
export default class FrameExtractor extends Component {
  intake = new VideoIntake({
    onLoad: (file) => this.#load(file),
    onReady: () => this.#ready(),
    probe: true,
  });
  drop = new Drop(ACCEPT, (file) => this.intake.load(file));
  playback = new Playback();

  @tracked frames: string[] = [];
  @tracked stills: Still[] = [];
  @tracked grabbing = false;
  @tracked grabFailed = false;
  @tracked sheetCount = 12;
  @tracked sheetBusy = false;
  @tracked sheetProgress = 0;
  @tracked sheetFailed = false;
  @tracked sheet: { blob: Blob; url: string } | null = null;
  @tracked showsSheetMarks = false;

  #token = 0;
  #job = 0;
  #nextId = 0;
  #linger?: ReturnType<typeof setTimeout>;

  willDestroy() {
    super.willDestroy();
    this.#token++;
    this.#job++;
    clearTimeout(this.#linger);
    this.intake.release();
    this.#releaseStills();
    this.#releaseSheet();
    release(this.frames);
  }

  get loaded() {
    return this.intake.url !== null;
  }

  get duration() {
    return this.intake.duration;
  }

  get ready() {
    return this.duration > 0;
  }

  get unready() {
    return !this.ready;
  }

  get aspect() {
    const { width, height } = this.intake;
    return width && height ? width / height : 16 / 9;
  }

  get previewAspect() {
    return Math.max(this.aspect, 1 / tallest);
  }

  get meta() {
    const { duration, width, height, fps } = this.intake;
    if (!duration) return '';
    return `${width} × ${height} · ${formatFps(fps)} · ${tc(duration)}`;
  }

  get warning() {
    return this.intake.error;
  }

  get baseName() {
    return this.intake.baseName || 'video';
  }

  get stillsHeading() {
    const count = this.stills.length;
    return count === 1 ? '1 frame' : `${count} frames`;
  }

  get litMarks() {
    return this.stills.map((still) => still.seconds);
  }

  get dimMarks() {
    const shows = this.showsSheetMarks || this.sheetBusy || this.sheet !== null;
    return shows ? sheetTimes(this.duration, this.sheetCount) : [];
  }

  get sheetName() {
    return `${this.baseName}-contact-sheet.png`;
  }

  get sheetRow() {
    const sheet = this.sheet;
    if (!sheet) return null;
    const [columns, rows] = sheetGrid(this.sheetCount);
    return {
      name: this.sheetName,
      detail: `png · ${formatBytes(sheet.blob.size)} · ${columns} × ${rows}`,
    };
  }

  get grabDisabled() {
    return !this.ready || this.grabbing;
  }

  get sheetDisabled() {
    return !this.ready;
  }

  get #frameSeconds() {
    return 1 / (this.intake.fps || 30);
  }

  back = () => this.playback.stepBy(-1);
  forward = () => this.playback.stepBy(1);
  stepBack = () => this.playback.stepBy(-this.#frameSeconds);
  stepForward = () => this.playback.stepBy(this.#frameSeconds);

  #load(file: File) {
    this.#reset();
    const token = this.#token;
    const live = () => token === this.#token;
    void thumbnails(file, live).then((urls) => {
      if (!live()) return release(urls);
      this.frames = urls;
    });
  }

  #ready() {
    const run = flags();
    if (!run) return;
    void (async () => {
      const token = this.#token;
      for (const seconds of run.grab) {
        if (token !== this.#token) return;
        await this.#grab(seconds);
      }
      for (let i = 0; i < run.step; i++) this.stepForward();
      if (run.sheet) this.buildSheet();
    })();
  }

  grab = () => void this.#grab();

  /** The frame on screen, or the one at `seconds`, as a PNG still. */
  async #grab(seconds?: number) {
    const video = this.intake.video;
    if (!video || !this.ready || this.grabbing) return;
    const token = this.#token;
    this.playback.pause();
    this.grabbing = true;
    this.grabFailed = false;
    if (seconds !== undefined) await seekTo(video, seconds);
    const time = video.currentTime;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (token !== this.#token || this.isDestroyed) return;
    this.grabbing = false;
    if (!blob) {
      this.grabFailed = true;
      return;
    }
    const label = tc(time);
    this.stills = [
      ...this.stills,
      {
        id: this.#nextId++,
        url: URL.createObjectURL(blob),
        label,
        seconds: time,
        fileName: `${this.baseName}-${stamp(label)}.png`,
        blob,
      },
    ];
  }

  saveStill = (still: Still) => downloadBlob(still.blob, still.fileName);

  removeStill = (still: Still) => {
    URL.revokeObjectURL(still.url);
    this.stills = this.stills.filter((s) => s !== still);
  };

  stillFiles = () =>
    this.stills.map((still) => ({
      name: still.fileName,
      blob: still.blob,
    }));

  get zipName() {
    return `${this.baseName}-frames.zip`;
  }

  setSheetCount = (value: number) => {
    const count = Math.min(sheetMax, Math.max(sheetMin, Math.round(value)));
    if (count === this.sheetCount) return;
    this.sheetCount = count;
    this.#resetSheet();
    this.showsSheetMarks = true;
    clearTimeout(this.#linger);
    this.#linger = setTimeout(() => {
      if (!this.isDestroyed) this.showsSheetMarks = false;
    }, sheetMarksLinger * 1000);
  };

  buildSheet = () => void this.#buildSheet();

  async #buildSheet() {
    const file = this.intake.file;
    if (!file || !this.ready || this.sheetBusy) return;
    this.#resetSheet();
    const job = ++this.#job;
    const live = () => job === this.#job && !this.isDestroyed;
    this.playback.pause();
    this.sheetBusy = true;
    const blob = await contactSheet(file, this.sheetCount, live, (share) => {
      if (live()) this.sheetProgress = share;
    });
    if (!live()) return;
    this.sheetBusy = false;
    if (blob) this.sheet = { blob, url: URL.createObjectURL(blob) };
    else this.sheetFailed = true;
  }

  cancelSheet = () => this.#resetSheet();

  saveSheet = () => {
    if (this.sheet) downloadBlob(this.sheet.blob, this.sheetName);
  };

  /** Drops the contact sheet run and its result. */
  #resetSheet() {
    this.#job++;
    this.sheetBusy = false;
    this.sheetProgress = 0;
    this.sheetFailed = false;
    this.#releaseSheet();
  }

  #releaseSheet() {
    if (this.sheet) URL.revokeObjectURL(this.sheet.url);
    this.sheet = null;
  }

  #releaseStills() {
    for (const still of this.stills) URL.revokeObjectURL(still.url);
  }

  #reset() {
    this.#token++;
    this.#resetSheet();
    this.#releaseStills();
    this.stills = [];
    this.grabbing = false;
    this.grabFailed = false;
    release(this.frames);
    this.frames = [];
  }

  clear = () => {
    this.playback.unload();
    this.#reset();
    this.intake.clear();
  };

  <template>
    <XzSplit
      class="frame-extractor"
      @sidebarWidth={{480}}
      @bannerSticks={{true}}
      @mainLeadsStacked={{true}}
      {{filePaste this.intake.load accept=ACCEPT}}
      {{on "dragover" this.drop.enter}}
      {{on "dragleave" this.drop.leave}}
      {{on "drop" this.drop.drop}}
    >
      <:banner>
        <XzCanvas @height={{bandHeight}}>
          <XzReadoutBand
            @transport={{this.playback.transport}}
            @idle={{if this.ready this.duration null}}
            @readout="below"
            @lamps={{lamps}}
          >
            <div class="fx-lane">
              <Strips
                @thumbnails={{this.frames}}
                @aspect={{this.aspect}}
                @duration={{this.duration}}
                @playhead={{this.playback.playhead}}
                @onScrub={{this.playback.scrub}}
                @blank={{if this.loaded false true}}
              />
              <Marks
                @lit={{this.litMarks}}
                @dim={{this.dimMarks}}
                @duration={{this.duration}}
              />
            </div>
          </XzReadoutBand>
        </XzCanvas>
      </:banner>
      <:sidebar>
        <XzRows class="fx-stills-rows" @framed={{true}}>
          <XzHeading @text={{this.stillsHeading}} />
          {{#if this.stills.length}}
            <Stills
              @stills={{this.stills}}
              @aspect={{this.aspect}}
              @onSave={{this.saveStill}}
              @onRemove={{this.removeStill}}
            />
            <DownloadAll
              class="fx-save-all"
              @kind="secondary"
              @files={{this.stillFiles}}
              @zipName={{this.zipName}}
            />
          {{else}}
            <XzEmptyRow @text="None" />
          {{/if}}
        </XzRows>
        <XzRows class="fx-sheet-rows" @framed={{true}}>
          <XzHeading @text="Contact sheet" />
          <XzRow
            class="fx-sheet-count"
            @title="Frames"
            @form="flush"
            as |titleId|
          >
            <XzSlider
              @value={{this.sheetCount}}
              @min={{sheetMin}}
              @max={{sheetMax}}
              @step={{1}}
              @readout={{whole}}
              @labelledBy={{titleId}}
              @onChange={{this.setSheetCount}}
            />
          </XzRow>
          <Job
            @title="Contact sheet"
            @icon={{Sheet}}
            @failure={{SHEET_ERROR}}
            @disabled={{this.sheetDisabled}}
            @busy={{this.sheetBusy}}
            @progress={{this.sheetProgress}}
            @failed={{this.sheetFailed}}
            @result={{this.sheetRow}}
            @onRun={{this.buildSheet}}
            @onCancel={{this.cancelSheet}}
            @onSave={{this.saveSheet}}
          />
          {{#if this.sheet}}
            <img class="fx-sheet" src={{this.sheet.url}} alt="Contact sheet" />
          {{/if}}
        </XzRows>
      </:sidebar>
      <:main>
        <XzRows @framed={{true}}>
          <XzHeading @text="Source" />
          {{#if this.loaded}}
            <XzRow
              class="fx-source"
              @title={{this.intake.fileName}}
              @detail={{if this.warning this.warning this.meta}}
              @form="flush"
            >
              <XzButton
                @kind="cell"
                @text="Clear"
                @icon={{Trash}}
                @onClick={{this.clear}}
              />
            </XzRow>
          {{else}}
            <Slot
              class="fx-slot"
              @prompt="Choose video file"
              @icon="film"
              @row={{true}}
              @accept={{ACCEPT}}
              @over={{this.drop.over}}
              @onFile={{this.intake.load}}
            />
            {{#if this.warning}}
              <XzStatus @text={{this.warning}} @tone="warn" @row={{true}} />
            {{/if}}
          {{/if}}
        </XzRows>
        <XzCanvas
          class="fx-preview"
          @aspect={{this.previewAspect}}
          @maxHeight={{tallestPreview}}
          @boxing="unlessWide"
          @background={{if this.loaded "#000"}}
        >
          {{#if this.loaded}}
            {{! the transport is its control; user media lacks captions }}
            {{! template-lint-disable require-media-caption }}
            <video
              class="fx-video"
              src={{this.intake.url}}
              playsinline
              preload="auto"
              aria-label="Preview"
              {{this.intake.register}}
              {{this.playback.register}}
              {{on "loadedmetadata" this.intake.ready}}
              {{on "error" this.intake.failed}}
            ></video>
          {{else}}
            <svg class="fx-blank" viewBox="0 0 16 9" aria-hidden="true"><rect
                width="16"
                height="9"
              /></svg>
          {{/if}}
        </XzCanvas>
        <XzRows @framed={{true}}>
          <XzButton
            class="fx-grab"
            @kind="primary"
            @text="Grab frame"
            @icon={{Camera}}
            @iconStyle="oversized"
            @disabled={{this.grabDisabled}}
            @onClick={{this.grab}}
          />
          {{#if this.grabFailed}}
            <XzStatus @text={{GRAB_ERROR}} @tone="warn" @row={{true}} />
          {{/if}}
        </XzRows>
      </:main>
      <:footer>
        <XzGrid class="fx-transport">
          <XzButton
            class="fx-back"
            @text="−1 s"
            aria-label="Back 1 second"
            @repeats={{true}}
            @disabled={{this.unready}}
            @onClick={{this.back}}
          />
          <XzButton
            class="fx-step-back"
            @label="Back one frame"
            @icon={{Back}}
            @repeats={{true}}
            @disabled={{this.unready}}
            @onClick={{this.stepBack}}
          />
          <XzButton
            class="fx-play"
            @kind="primary"
            @text={{if this.playback.playing "Pause" "Play"}}
            @icon={{if this.playback.playing PauseIcon PlayIcon}}
            @disabled={{this.unready}}
            @onClick={{this.playback.toggle}}
          />
          <XzButton
            class="fx-step-forward"
            @label="Forward one frame"
            @icon={{Forward}}
            @repeats={{true}}
            @disabled={{this.unready}}
            @onClick={{this.stepForward}}
          />
          <XzButton
            class="fx-forward"
            @text="+1 s"
            aria-label="Forward 1 second"
            @repeats={{true}}
            @disabled={{this.unready}}
            @onClick={{this.forward}}
          />
        </XzGrid>
      </:footer>
    </XzSplit>
  </template>
}
