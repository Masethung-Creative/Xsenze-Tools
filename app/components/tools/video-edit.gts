import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { modifier } from 'ember-modifier';
import XzButton from 'xsenze-tools/components/xz/button';
import XzCanvas from 'xsenze-tools/components/xz/canvas';
import XzDecimalField from 'xsenze-tools/components/xz/decimal-field';
import XzDropZone from 'xsenze-tools/components/xz/drop-zone';
import XzEmptyRow from 'xsenze-tools/components/xz/empty-row';
import XzGrid from 'xsenze-tools/components/xz/grid';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzReadoutBand from 'xsenze-tools/components/xz/readout-band';
import XzRow from 'xsenze-tools/components/xz/row';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSplit from 'xsenze-tools/components/xz/split';
import XzStatus from 'xsenze-tools/components/xz/status';
import { IconSvg } from 'xsenze-tools/components/icon';
import Drop from 'xsenze-tools/components/tools/media/drop';
import Transport from 'xsenze-tools/components/tools/media/transport';
import {
  release,
  thumbnails,
} from 'xsenze-tools/components/tools/media/frames';
import Timeline from 'xsenze-tools/components/tools/video-edit/timeline';
import { formatFps } from 'xsenze-tools/lib/media-probe';
import { formatTimestamp } from 'xsenze-tools/lib/subtitles';
import { VIDEO_ACCEPT, acceptAttr } from 'xsenze-tools/lib/tools';
import { readClip } from 'xsenze-tools/lib/video-edit/clips';
import EditPlayer from 'xsenze-tools/lib/video-edit/player';
import {
  History,
  cutRange,
  duplicate,
  lengthOf,
  move,
  pieceFor,
  placeAt,
  remove,
  split,
  starts,
  total,
  trim,
  type Clip,
  type Piece,
} from 'xsenze-tools/lib/video-edit/timeline';
import './media/media.css';
import './video-edit/video-edit.css';

const ACCEPT = acceptAttr(VIDEO_ACCEPT);
const DASH = '—';
const tc = (seconds: number) => formatTimestamp(seconds * 1000, '.');
// height over width at most 1.25, at most 380 px tall
const tallest = 1.25;
const tallestPreview = 380;
const timelineHeight = 132;
const zoomSteps = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32];

const icon = (name: string) => <template><IconSvg @name={{name}} /></template>;
const SplitIcon = icon('scissors');
const CutIcon = icon('scissors-line-dashed');
const DeleteIcon = icon('trash-2');
const CopyIcon = icon('copy-plus');
const LeftIcon = icon('arrow-left');
const RightIcon = icon('arrow-right');
const UndoIcon = icon('undo-2');
const RedoIcon = icon('redo-2');
const ZoomOutIcon = icon('zoom-out');
const ZoomInIcon = icon('zoom-in');
const FitIcon = icon('maximize-2');
const SetInIcon = icon('arrow-right-to-line');
const SetOutIcon = icon('arrow-left-to-line');
const ClearIcon = icon('x');
const BackIcon = icon('chevron-left');
const ForwardIcon = icon('chevron-right');
const FilmIcon = icon('film');

/** Typing in a field keeps its keys. */
function typing(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  );
}

/**
 * Video Edit: join clips on one track, trim, split, cut parts out, reorder,
 * and play the edit as it will export. Everything stays on the device.
 */
export default class VideoEdit extends Component {
  player = new EditPlayer();
  history = new History<Piece[]>();
  drop = new Drop(ACCEPT, (files) => void this.addFiles(files), true);

  @tracked clips: Clip[] = [];
  @tracked pieces: Piece[] = [];
  @tracked selectedId: string | null = null;
  @tracked markIn: number | null = null;
  @tracked markOut: number | null = null;
  @tracked zoomIndex = 0;
  @tracked reading = 0;
  @tracked problems: string[] = [];
  /** History flags, refreshed after every change. */
  @tracked canUndo = false;
  @tracked canRedo = false;

  #live = true;

  willDestroy() {
    super.willDestroy();
    this.#live = false;
    this.player.destroy();
    for (const clip of this.clips) {
      URL.revokeObjectURL(clip.url);
      release(clip.frames);
    }
  }

  get clipMap(): ReadonlyMap<string, Clip> {
    return new Map(this.clips.map((clip) => [clip.id, clip]));
  }

  get hasPieces() {
    return this.pieces.length > 0;
  }

  get noPieces() {
    return !this.hasPieces;
  }

  get total() {
    return total(this.pieces);
  }

  get aspect() {
    const first = this.clipMap.get(this.pieces[0]?.clip ?? '') ?? this.clips[0];
    return first ? first.width / first.height : 16 / 9;
  }

  get previewAspect() {
    return Math.max(this.aspect, 1 / tallest);
  }

  get zoom() {
    return zoomSteps[this.zoomIndex] ?? 1;
  }

  get selected(): Piece | null {
    return this.pieces.find((piece) => piece.id === this.selectedId) ?? null;
  }

  get selectedClip(): Clip | null {
    const piece = this.selected;
    return piece ? (this.clipMap.get(piece.clip) ?? null) : null;
  }

  get noSelection() {
    return !this.selected;
  }

  get range(): [number, number] | null {
    if (this.markIn === null || this.markOut === null) return null;
    const a = Math.min(this.markIn, this.markOut);
    const b = Math.max(this.markIn, this.markOut);
    return b - a > 0 ? [a, b] : null;
  }

  get noRange() {
    return !this.range;
  }

  get noMarks() {
    return this.markIn === null && this.markOut === null;
  }

  get markInText() {
    return this.markIn === null ? 'Not set' : tc(this.markIn);
  }

  get markOutText() {
    return this.markOut === null ? 'Not set' : tc(this.markOut);
  }

  get rangeText() {
    const range = this.range;
    return range ? `${tc(range[1] - range[0])} will be cut out` : '';
  }

  get summary() {
    if (!this.hasPieces) return '';
    const count = this.pieces.length;
    return `${count} ${count === 1 ? 'piece' : 'pieces'} · ${tc(this.total)}`;
  }

  get clipRows() {
    return this.clips.map((clip) => ({
      clip,
      detail: [
        `${clip.width} × ${clip.height}`,
        formatFps(clip.fps),
        tc(clip.duration),
        clip.hasAudio ? null : 'no sound',
      ]
        .filter(Boolean)
        .join(' · '),
    }));
  }

  get selectedIndex() {
    return this.pieces.findIndex((piece) => piece.id === this.selectedId);
  }

  get cannotMoveLeft() {
    return this.selectedIndex <= 0;
  }

  get cannotMoveRight() {
    return (
      this.selectedIndex < 0 || this.selectedIndex >= this.pieces.length - 1
    );
  }

  get cannotSplit() {
    if (!this.hasPieces) return true;
    const place = placeAt(this.pieces, this.player.time);
    if (!place) return true;
    return (
      place.clipTime - place.piece.in < 0.1 ||
      place.piece.out - place.clipTime < 0.1
    );
  }

  get cannotUndo() {
    return !this.canUndo;
  }

  get cannotRedo() {
    return !this.canRedo;
  }

  get cannotZoomOut() {
    return this.zoomIndex <= 0 || this.noPieces;
  }

  get cannotZoomIn() {
    return this.zoomIndex >= zoomSteps.length - 1 || this.noPieces;
  }

  get selectedLength() {
    const piece = this.selected;
    return piece ? tc(lengthOf(piece)) : DASH;
  }

  get selectedDetail() {
    const piece = this.selected;
    if (!piece) return 'Click a piece on the timeline';
    const at = starts(this.pieces)[this.selectedIndex] ?? 0;
    return `${tc(at)} – ${tc(at + lengthOf(piece))} on the timeline`;
  }

  get inMax() {
    const piece = this.selected;
    return piece ? Math.max(0, piece.out - 0.1) : 0;
  }

  get outMin() {
    const piece = this.selected;
    return piece ? piece.in + 0.1 : 0;
  }

  get outMax() {
    return this.selectedClip?.duration ?? 0;
  }

  get readingText() {
    return this.reading === 1
      ? 'Reading a video…'
      : `Reading ${this.reading} videos…`;
  }

  get problemText() {
    return this.problems.join(' ');
  }

  // ----- changes -----

  /** Every edit goes through here: history, then the player. */
  #commit(next: Piece[], record = true) {
    if (record) this.history.record(this.pieces);
    this.pieces = next;
    if (this.selectedId && !next.some((piece) => piece.id === this.selectedId))
      this.selectedId = null;
    this.#syncHistory();
    this.player.shape(this.aspect, 'contain');
    this.player.load(this.clips, next);
  }

  #syncHistory() {
    this.canUndo = this.history.canUndo;
    this.canRedo = this.history.canRedo;
  }

  addFiles = async (files: File[]) => {
    const videos = files.filter(
      (file) =>
        file.type.startsWith('video/') ||
        /\.(mp4|m4v|mov|webm|mkv|avi)$/i.test(file.name),
    );
    if (!videos.length) return;
    this.problems = [];
    this.reading += videos.length;
    const added: Clip[] = [];
    const failed: string[] = [];
    for (const file of videos) {
      try {
        const clip = await readClip(file);
        if (!this.#live) return URL.revokeObjectURL(clip.url);
        added.push(clip);
      } catch {
        failed.push(file.name);
      } finally {
        this.reading -= 1;
      }
    }
    if (failed.length)
      this.problems = [
        `${failed.join(', ')} could not be read. Try MP4, MOV or WebM.`,
      ];
    if (!added.length) return;
    this.clips = [...this.clips, ...added];
    this.#commit([...this.pieces, ...added.map(pieceFor)]);
    for (const clip of added) void this.#filmstrip(clip);
  };

  async #filmstrip(clip: Clip) {
    const live = () => this.#live && this.clips.some((c) => c.id === clip.id);
    const frames = await thumbnails(clip.file, live);
    if (!live()) return release(frames);
    this.clips = this.clips.map((c) =>
      c.id === clip.id ? { ...c, frames } : c,
    );
  }

  removeClip = (id: string) => {
    const clip = this.clipMap.get(id);
    if (!clip) return;
    this.clips = this.clips.filter((c) => c.id !== id);
    // pieces of a gone clip cannot come back
    this.history.clear();
    this.#commit(
      this.pieces.filter((piece) => piece.clip !== id),
      false,
    );
    URL.revokeObjectURL(clip.url);
    release(clip.frames);
  };

  addAgain = (id: string) => {
    const clip = this.clipMap.get(id);
    if (clip) this.#commit([...this.pieces, pieceFor(clip)]);
  };

  select = (id: string | null) => (this.selectedId = id);

  scrub = (seconds: number) => this.player.scrub(seconds);

  splitHere = () => {
    if (this.cannotSplit) return;
    const next = split(this.pieces, this.player.time);
    this.#commit(next);
    // the piece after the cut is selected, ready to trim or delete
    const place = placeAt(next, this.player.time);
    if (place) this.selectedId = place.piece.id;
  };

  deleteSelected = () => {
    const piece = this.selected;
    if (!piece) return;
    const index = this.selectedIndex;
    const next = remove(this.pieces, piece.id);
    this.#commit(next);
    this.selectedId = next[Math.min(index, next.length - 1)]?.id ?? null;
  };

  duplicateSelected = () => {
    if (this.selected) this.#commit(duplicate(this.pieces, this.selected.id));
  };

  moveSelected = (by: number) => {
    const piece = this.selected;
    if (!piece) return;
    const to = this.selectedIndex + by;
    if (to < 0 || to >= this.pieces.length) return;
    this.#commit(move(this.pieces, piece.id, to));
  };

  moveLeft = () => this.moveSelected(-1);
  moveRight = () => this.moveSelected(1);

  movePiece = (id: string, index: number) => {
    this.#commit(move(this.pieces, id, index));
    this.selectedId = id;
  };

  trimStart = () => {
    this.history.record(this.pieces);
    this.#syncHistory();
  };

  trimPiece = (id: string, inPoint: number, outPoint: number) => {
    const piece = this.pieces.find((p) => p.id === id);
    const clip = piece && this.clipMap.get(piece.clip);
    if (!clip) return;
    this.#commit(
      trim(this.pieces, id, inPoint, outPoint, clip.duration),
      false,
    );
  };

  setPieceIn = (seconds: number) => {
    const piece = this.selected;
    const clip = this.selectedClip;
    if (piece && clip)
      this.#commit(
        trim(this.pieces, piece.id, seconds, piece.out, clip.duration),
      );
  };

  setPieceOut = (seconds: number) => {
    const piece = this.selected;
    const clip = this.selectedClip;
    if (piece && clip)
      this.#commit(
        trim(this.pieces, piece.id, piece.in, seconds, clip.duration),
      );
  };

  setIn = () => (this.markIn = this.player.time);
  setOut = () => (this.markOut = this.player.time);

  clearMarks = () => {
    this.markIn = null;
    this.markOut = null;
  };

  cutOut = () => {
    const range = this.range;
    if (!range) return;
    this.#commit(cutRange(this.pieces, range[0], range[1]));
    this.clearMarks();
    this.player.scrub(range[0]);
  };

  undo = () => {
    const previous = this.history.undo(this.pieces);
    if (previous) this.#commit(previous, false);
  };

  redo = () => {
    const next = this.history.redo(this.pieces);
    if (next) this.#commit(next, false);
  };

  zoomIn = () =>
    (this.zoomIndex = Math.min(this.zoomIndex + 1, zoomSteps.length - 1));
  zoomOut = () => (this.zoomIndex = Math.max(this.zoomIndex - 1, 0));
  zoomFit = () => (this.zoomIndex = 0);

  stepBack = () => this.player.stepBy(-1 / this.player.fps);
  stepForward = () => this.player.stepBy(1 / this.player.fps);

  /** Editing keys, while the tool is open and no field has focus. */
  keys = modifier(() => {
    const onKey = (event: KeyboardEvent) => {
      if (typing(event.target) || document.querySelector('dialog[open]'))
        return;
      const key = event.key.toLowerCase();
      const command = event.ctrlKey || event.metaKey;
      const run = (action: () => unknown) => {
        event.preventDefault();
        action();
      };
      if (command && key === 'z' && !event.shiftKey) return run(this.undo);
      if (command && (key === 'y' || (key === 'z' && event.shiftKey)))
        return run(this.redo);
      if (command || !this.hasPieces) return;
      if (event.altKey && key === 'arrowleft') return run(this.moveLeft);
      if (event.altKey && key === 'arrowright') return run(this.moveRight);
      if (key === ' ' && !(event.target instanceof HTMLButtonElement))
        return run(this.player.toggle);
      if (key === 'arrowleft') return run(this.stepBack);
      if (key === 'arrowright') return run(this.stepForward);
      if (key === 's') return run(this.splitHere);
      if (key === 'i') return run(this.setIn);
      if (key === 'o') return run(this.setOut);
      if (key === 'x' && this.range) return run(this.cutOut);
      if (key === 'delete' || key === 'backspace')
        return run(this.deleteSelected);
      if (key === 'escape') return run(this.clearMarks);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  <template>
    <XzSplit
      class="video-edit"
      @bannerSticks={{true}}
      @mainLeadsStacked={{true}}
      {{this.keys}}
      {{on "dragover" this.drop.enter}}
      {{on "dragleave" this.drop.leave}}
      {{on "drop" this.drop.drop}}
    >
      <:banner>
        <XzCanvas
          class="ve-preview"
          @aspect={{this.previewAspect}}
          @maxHeight={{tallestPreview}}
          @background="#000"
        >
          <XzReadoutBand @transport={{this.player.transport}} @readout="over">
            <canvas
              class="ve-canvas"
              aria-label="Preview of the edit"
              {{this.player.register}}
            ></canvas>
          </XzReadoutBand>
        </XzCanvas>
      </:banner>
      <:sidebar>
        <XzRows @framed={{true}}>
          <XzHeading @text="Clips" />
          <XzDropZone
            class="ve-drop-zone"
            @prompt="Drop videos here, or press Files"
            @icon={{FilmIcon}}
            @accept={{ACCEPT}}
            @multiple={{true}}
            @onFiles={{this.addFiles}}
          />
          {{#if this.reading}}
            <XzStatus @text={{this.readingText}} @tone="muted" @row={{true}} />
          {{/if}}
          {{#if this.problems.length}}
            <XzStatus @text={{this.problemText}} @tone="warn" @row={{true}} />
          {{/if}}
          {{#each this.clipRows as |row|}}
            <XzRow
              class="ve-clip"
              @title={{row.clip.name}}
              @detail={{row.detail}}
              @form="flush"
            >
              <XzGrid>
                <XzButton
                  @label="Add {{row.clip.name}} to the end again"
                  @icon={{CopyIcon}}
                  @onClick={{fn this.addAgain row.clip.id}}
                />
                <XzButton
                  @label="Remove {{row.clip.name}}"
                  @icon={{DeleteIcon}}
                  @onClick={{fn this.removeClip row.clip.id}}
                />
              </XzGrid>
            </XzRow>
          {{else}}
            <XzEmptyRow
              @text="No clips yet. They join in the order you add them."
            />
          {{/each}}

          <XzHeading @text="Cut out a part" />
          <XzRow @title="In" @detail={{this.markInText}} />
          <XzRow @title="Out" @detail={{this.markOutText}} />
          {{#if this.range}}
            <XzStatus @text={{this.rangeText}} @tone="muted" @row={{true}} />
          {{/if}}
          <XzGrid @columns={{2}}>
            <XzButton
              class="ve-set-in"
              @text="Set in"
              @icon={{SetInIcon}}
              @disabled={{this.noPieces}}
              @onClick={{this.setIn}}
            />
            <XzButton
              class="ve-set-out"
              @text="Set out"
              @icon={{SetOutIcon}}
              @disabled={{this.noPieces}}
              @onClick={{this.setOut}}
            />
            <XzButton
              class="ve-clear-marks"
              @text="Clear"
              @icon={{ClearIcon}}
              @disabled={{this.noMarks}}
              @onClick={{this.clearMarks}}
            />
            <XzButton
              class="ve-cut-out"
              @kind="primary"
              @text="Cut out"
              @icon={{CutIcon}}
              @disabled={{this.noRange}}
              @onClick={{this.cutOut}}
            />
          </XzGrid>

          <XzHeading @text="Export" />
          <XzStatus
            @text="Export to MP4 comes in the next step."
            @tone="muted"
            @row={{true}}
          />
        </XzRows>
      </:sidebar>
      <:main>
        <XzCanvas
          class="ve-timeline-canvas"
          @height={{timelineHeight}}
          @background="var(--xz-surface-2)"
        >
          {{#if this.hasPieces}}
            <Timeline
              @clips={{this.clipMap}}
              @pieces={{this.pieces}}
              @selectedId={{this.selectedId}}
              @time={{this.player.time}}
              @range={{this.range}}
              @zoom={{this.zoom}}
              @playing={{this.player.playing}}
              @onSelect={{this.select}}
              @onScrub={{this.scrub}}
              @onTrimStart={{this.trimStart}}
              @onTrim={{this.trimPiece}}
              @onMove={{this.movePiece}}
            />
          {{else}}
            <p class="ve-timeline-empty">Add clips and they line up here.</p>
          {{/if}}
        </XzCanvas>
        <XzRows @framed={{true}}>
          <XzRow
            @title="Timeline"
            @detail={{if this.hasPieces this.summary "Empty"}}
            @form="flush"
          >
            <XzGrid>
              <XzButton
                class="ve-zoom-out"
                @label="Zoom out"
                @icon={{ZoomOutIcon}}
                @disabled={{this.cannotZoomOut}}
                @onClick={{this.zoomOut}}
              />
              <XzButton
                class="ve-zoom-in"
                @label="Zoom in"
                @icon={{ZoomInIcon}}
                @disabled={{this.cannotZoomIn}}
                @onClick={{this.zoomIn}}
              />
              <XzButton
                class="ve-zoom-fit"
                @label="Fit the whole edit"
                @icon={{FitIcon}}
                @disabled={{this.cannotZoomOut}}
                @onClick={{this.zoomFit}}
              />
            </XzGrid>
          </XzRow>
          <XzGrid>
            <XzButton
              class="ve-split"
              @text="Split"
              @icon={{SplitIcon}}
              @disabled={{this.cannotSplit}}
              @onClick={{this.splitHere}}
            />
            <XzButton
              class="ve-undo"
              @text="Undo"
              @icon={{UndoIcon}}
              @disabled={{this.cannotUndo}}
              @onClick={{this.undo}}
            />
            <XzButton
              class="ve-redo"
              @text="Redo"
              @icon={{RedoIcon}}
              @disabled={{this.cannotRedo}}
              @onClick={{this.redo}}
            />
          </XzGrid>

          <XzHeading @text="Selected piece" />
          <XzRow
            class="ve-selected"
            @title={{if this.selectedClip this.selectedClip.name "None"}}
            @detail={{this.selectedDetail}}
          />
          <XzRow
            @title="Starts at"
            @detail="Seconds into the clip"
            @form="flush"
            as |titleId|
          >
            <XzDecimalField
              class="ve-piece-in"
              @value={{if this.selected this.selected.in 0}}
              @max={{this.inMax}}
              @labelledBy={{titleId}}
              @disabled={{this.noSelection}}
              @onChange={{this.setPieceIn}}
            />
          </XzRow>
          <XzRow
            @title="Ends at"
            @detail="Seconds into the clip"
            @form="flush"
            as |titleId|
          >
            <XzDecimalField
              class="ve-piece-out"
              @value={{if this.selected this.selected.out 0}}
              @min={{this.outMin}}
              @max={{this.outMax}}
              @labelledBy={{titleId}}
              @disabled={{this.noSelection}}
              @onChange={{this.setPieceOut}}
            />
          </XzRow>
          <XzRow @title="Length" @detail={{this.selectedLength}} />
          <XzGrid>
            <XzButton
              class="ve-move-left"
              @label="Move earlier"
              @icon={{LeftIcon}}
              @disabled={{this.cannotMoveLeft}}
              @onClick={{this.moveLeft}}
            />
            <XzButton
              class="ve-move-right"
              @label="Move later"
              @icon={{RightIcon}}
              @disabled={{this.cannotMoveRight}}
              @onClick={{this.moveRight}}
            />
            <XzButton
              class="ve-duplicate"
              @text="Duplicate"
              @icon={{CopyIcon}}
              @disabled={{this.noSelection}}
              @onClick={{this.duplicateSelected}}
            />
            <XzButton
              class="ve-delete"
              @text="Delete"
              @icon={{DeleteIcon}}
              @disabled={{this.noSelection}}
              @onClick={{this.deleteSelected}}
            />
          </XzGrid>
        </XzRows>
        <p class="ve-keys">
          Keys: Space play · S split · I / O mark · X cut out · Delete · Alt+← →
          move · ← → frame · Ctrl Z / Y undo, redo
        </p>
      </:main>
      <:footer>
        <Transport @playback={{this.player}} @ready={{this.hasPieces}}>
          <:before>
            <XzButton
              class="ve-back"
              @label="Back one frame"
              @icon={{BackIcon}}
              @repeats={{true}}
              @disabled={{this.noPieces}}
              @onClick={{this.stepBack}}
            />
          </:before>
          <:default>
            <XzButton
              class="ve-forward"
              @label="Forward one frame"
              @icon={{ForwardIcon}}
              @repeats={{true}}
              @disabled={{this.noPieces}}
              @onClick={{this.stepForward}}
            />
          </:default>
        </Transport>
      </:footer>
    </XzSplit>
  </template>
}
