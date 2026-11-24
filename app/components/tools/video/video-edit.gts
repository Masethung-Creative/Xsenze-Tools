import Component from '@glimmer/component';
import type Owner from '@ember/owner';
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
import XzSegmented from 'xsenze-tools/components/xz/segmented';
import XzSlider from 'xsenze-tools/components/xz/slider';
import XzSplit from 'xsenze-tools/components/xz/split';
import XzStatus from 'xsenze-tools/components/xz/status';
import XzSwitch from 'xsenze-tools/components/xz/switch';
import { IconSvg } from 'xsenze-tools/components/icon';
import Drop from 'xsenze-tools/components/tools/shared/media/drop';
import Transport from 'xsenze-tools/components/tools/shared/media/transport';
import {
  peaks,
  release,
  thumbnails,
} from 'xsenze-tools/components/tools/shared/media/frames';
import Timeline, {
  type Selection,
} from 'xsenze-tools/components/tools/video/video-edit/timeline';
import { formatFps } from 'xsenze-tools/lib/video/media-probe';
import { formatTimestamp } from 'xsenze-tools/lib/subtitles/subtitles';
import { AUDIO_ACCEPT, VIDEO_ACCEPT, acceptAttr } from 'xsenze-tools/lib/tools';
import {
  mediaKind,
  readAudioClip,
  readClip,
} from 'xsenze-tools/lib/video/edit/clips';
import EditPlayer from 'xsenze-tools/lib/video/edit/player';
import {
  History,
  LANES,
  audioFor,
  cutRange,
  cutRangeAudio,
  duplicate,
  editLength,
  emptyEdit,
  endOf,
  laneEnd,
  minimumPiece,
  move,
  moveAudio,
  newId,
  pieceFor,
  placeAt,
  remove,
  settle,
  split,
  splitAudio,
  starts,
  total,
  trim,
  trimAudio,
  update,
  updateAudio,
  type AudioItem,
  type Clip,
  type Edit,
  type Lane,
  type Level,
  type Mix,
  type Piece,
} from 'xsenze-tools/lib/video/edit/timeline';
import Job from 'xsenze-tools/components/tools/shared/media/job';
import { downloadBlob } from 'xsenze-tools/lib/download';
import { formatBytes } from 'xsenze-tools/lib/format';
import {
  CONTAINER_CODECS,
  exportCodecs,
  exportEdit,
  type ExportCodec,
  type ExportContainer,
  type ExportResult,
} from 'xsenze-tools/lib/video/edit/export';
import type { Fit } from 'xsenze-tools/lib/video/edit/player';
import '../shared/media/media.css';
import './video-edit/video-edit.css';

const ACCEPT = acceptAttr([...VIDEO_ACCEPT, ...AUDIO_ACCEPT]);
const DASH = '—';
const tc = (seconds: number) => formatTimestamp(seconds * 1000, '.');
const percent = (value: number) => `${Math.round(value * 100)}%`;
// height over width at most 1.25, at most 380 px tall
const tallest = 1.25;
const tallestPreview = 380;
const timelineHeight = 216;
const zoomSteps = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32];
// a waveform needs the whole file decoded: skip it for very large files
const peaksLimit = 300 * 1024 * 1024;
const laneLabels = ['Music', 'Voice'];

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
const AddIcon = icon('list-plus');
const MusicIcon = icon('music');
const VoiceIcon = icon('mic');
const ExportIcon = icon('download');

// ----- export settings -----

const CONTAINERS: ExportContainer[] = ['mp4', 'webm'];
const FORMAT_LABELS = ['MP4', 'WebM'];
const CODEC_NAMES: Record<ExportCodec, string> = {
  avc: 'H.264',
  hevc: 'H.265',
  vp9: 'VP9',
  av1: 'AV1',
};
/** Bitrate for the same look, against H.264. */
const CODEC_FACTOR: Record<ExportCodec, number> = {
  avc: 1,
  hevc: 0.6,
  vp9: 0.65,
  av1: 0.5,
};
const SHAPES: { label: string; ratio: number | null }[] = [
  { label: 'First clip', ratio: null },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '1:1', ratio: 1 },
  { label: '4:5', ratio: 4 / 5 },
];
const SHAPE_LABELS = SHAPES.map((s) => s.label);
const FITS: Fit[] = ['contain', 'cover'];
const FIT_LABELS = ['Black bars', 'Fill'];
/** The output's short side; 0 is the first clip's. */
const SIZES = [1080, 720, 480, 0];
const SIZE_LABELS = ['1080p', '720p', '480p', 'First clip'];
const RATES = [0, 24, 25, 30, 60];
const RATE_LABELS = ['First clip', '24', '25', '30', '60'];
const QUALITY_LABELS = ['Small', 'Balanced', 'High'];
/** H.264 bits per pixel per frame, per quality. */
const BITS_PER_PIXEL = [0.04, 0.07, 0.11];
const SOUND_BITS = 192_000;
const EXPORT_ERROR = "Couldn't export. Try another format or a smaller size.";
const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/** Typing in a field keeps its keys; switches and buttons do not. */
function typing(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLInputElement)
    return !['checkbox', 'radio', 'button', 'submit', 'reset'].includes(
      target.type,
    );
  return /^(TEXTAREA|SELECT)$/.test(target.tagName);
}

/** What the panel shows for the selected item. */
interface Chosen {
  kind: 'video' | 'audio';
  id: string;
  name: string;
  clip: Clip | undefined;
  in: number;
  out: number;
  volume: number;
  muted: boolean;
  fadeIn: number;
  fadeOut: number;
  /** Timeline seconds where it starts. */
  start: number;
  lane: Lane | null;
}

/**
 * Video Edit: videos on the main track, sounds on the Music and Voice
 * layers; trim, split, cut parts out, reorder, set volumes and fades, and
 * play the edit as it will export. Everything stays on the device.
 */
export default class VideoEdit extends Component {
  player = new EditPlayer();
  history = new History<Edit>();
  drop = new Drop(ACCEPT, (files) => void this.addFiles(files), true);

  @tracked clips: Clip[] = [];
  @tracked edit: Edit = emptyEdit();
  @tracked selected: Selection | null = null;
  @tracked markIn: number | null = null;
  @tracked markOut: number | null = null;
  @tracked zoomIndex = 0;
  @tracked reading = 0;
  @tracked problems: string[] = [];
  /** History flags, refreshed after every change. */
  @tracked canUndo = false;
  @tracked canRedo = false;

  #live = true;

  // export settings and run
  @tracked formatIndex = 0;
  @tracked codecChoice: ExportCodec | null = null;
  @tracked shapeIndex = 0;
  @tracked fitIndex = 0;
  /** -1 picks 1080p, or the first clip's size when it is smaller. */
  @tracked sizeIndex = -1;
  @tracked rateIndex = 0;
  @tracked qualityIndex = 1;
  @tracked keepSound = true;
  @tracked encoders: Set<ExportCodec> | null = null;
  @tracked busy = false;
  @tracked progress = 0;
  @tracked failed = false;
  @tracked result: ExportResult | null = null;
  @tracked resultUrl = '';
  #abort: AbortController | null = null;
  #job = 0;

  constructor(owner: Owner, args: object) {
    super(owner, args);
    void exportCodecs(1920, 1080).then((set) => {
      if (this.#live) this.encoders = set;
    });
  }

  willDestroy() {
    super.willDestroy();
    this.#live = false;
    this.#abort?.abort();
    if (this.resultUrl) URL.revokeObjectURL(this.resultUrl);
    this.player.destroy();
    for (const clip of this.clips) {
      URL.revokeObjectURL(clip.url);
      release(clip.frames);
    }
  }

  // ----- reading the edit -----

  get clipMap(): ReadonlyMap<string, Clip> {
    return new Map(this.clips.map((clip) => [clip.id, clip]));
  }

  get pieces() {
    return this.edit.pieces;
  }

  get hasItems() {
    return this.edit.pieces.length > 0 || this.edit.audio.length > 0;
  }

  get empty() {
    return !this.hasItems;
  }

  get length() {
    return editLength(this.edit);
  }

  get aspect() {
    const video = this.clips.filter((clip) => clip.kind === 'video');
    const first = this.clipMap.get(this.pieces[0]?.clip ?? '') ?? video[0];
    return first?.width ? first.width / first.height : 16 / 9;
  }

  get previewAspect() {
    return Math.max(this.aspect, 1 / tallest);
  }

  get zoom() {
    return zoomSteps[this.zoomIndex] ?? 1;
  }

  get chosen(): Chosen | null {
    const s = this.selected;
    if (!s) return null;
    if (s.kind === 'video') {
      const index = this.pieces.findIndex((p) => p.id === s.id);
      const piece = this.pieces[index];
      if (!piece) return null;
      const clip = this.clipMap.get(piece.clip);
      return {
        ...this.#common(piece, clip),
        kind: 'video',
        start: starts(this.pieces)[index] ?? 0,
        lane: null,
      };
    }
    const item = this.edit.audio.find((a) => a.id === s.id);
    if (!item) return null;
    const clip = this.clipMap.get(item.clip);
    return {
      ...this.#common(item, clip),
      kind: 'audio',
      start: item.start,
      lane: item.lane,
    };
  }

  #common(item: Piece | AudioItem, clip: Clip | undefined) {
    return {
      id: item.id,
      name: clip?.name ?? 'Clip',
      clip,
      in: item.in,
      out: item.out,
      volume: item.volume,
      muted: item.muted,
      fadeIn: item.fadeIn,
      fadeOut: item.fadeOut,
    };
  }

  get nothingChosen() {
    return !this.chosen;
  }

  get chosenIsVideo() {
    return this.chosen?.kind === 'video';
  }

  get chosenIsAudio() {
    return this.chosen?.kind === 'audio';
  }

  get chosenDetail() {
    const c = this.chosen;
    if (!c) return 'Click a clip or sound on the timeline';
    const where =
      c.kind === 'video' ? 'Video' : c.lane === 'voice' ? 'Voice' : 'Music';
    return `${where} · ${tc(c.start)} – ${tc(c.start + c.out - c.in)}`;
  }

  get chosenLength() {
    const c = this.chosen;
    return c ? tc(c.out - c.in) : DASH;
  }

  get inMax() {
    const c = this.chosen;
    return c ? Math.max(0, c.out - minimumPiece) : 0;
  }

  get outMin() {
    const c = this.chosen;
    return c ? c.in + minimumPiece : 0;
  }

  get outMax() {
    return this.chosen?.clip?.duration ?? 0;
  }

  get fadeMax() {
    const c = this.chosen;
    return c ? Math.max(0, (c.out - c.in) / 2) : 0;
  }

  get laneIndex() {
    const lane = this.chosen?.lane;
    return lane ? LANES.indexOf(lane) : -1;
  }

  get selectedIndex() {
    const s = this.selected;
    return s?.kind === 'video'
      ? this.pieces.findIndex((piece) => piece.id === s.id)
      : -1;
  }

  get cannotMoveLeft() {
    return this.selectedIndex <= 0;
  }

  get cannotMoveRight() {
    return (
      this.selectedIndex < 0 || this.selectedIndex >= this.pieces.length - 1
    );
  }

  /** The audio item under the playhead when one is selected, else the video. */
  get splitTarget(): Selection | null {
    const s = this.selected;
    const t = this.player.time;
    if (s?.kind === 'audio') {
      const item = this.edit.audio.find((a) => a.id === s.id);
      if (
        item &&
        t - item.start >= minimumPiece &&
        endOf(item) - t >= minimumPiece
      )
        return s;
    }
    const place = t < total(this.pieces) ? placeAt(this.pieces, t) : null;
    if (
      place &&
      place.clipTime - place.piece.in >= minimumPiece &&
      place.piece.out - place.clipTime >= minimumPiece
    )
      return { kind: 'video', id: place.piece.id };
    return null;
  }

  get cannotSplit() {
    return !this.splitTarget;
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
    return range
      ? `${tc(range[1] - range[0])} will be cut from every layer`
      : '';
  }

  get summary() {
    if (!this.hasItems) return 'Empty';
    const { pieces, audio } = this.edit;
    const parts = [
      pieces.length ? `${pieces.length} video` : null,
      audio.length
        ? `${audio.length} sound${audio.length === 1 ? '' : 's'}`
        : null,
      tc(this.length),
    ];
    return parts.filter(Boolean).join(' · ');
  }

  get clipRows() {
    return this.clips.map((clip) => ({
      clip,
      isVideo: clip.kind === 'video',
      detail: (clip.kind === 'video'
        ? [
            `${clip.width} × ${clip.height}`,
            formatFps(clip.fps),
            tc(clip.duration),
            clip.hasAudio ? null : 'no sound',
          ]
        : ['Sound', tc(clip.duration)]
      )
        .filter(Boolean)
        .join(' · '),
    }));
  }

  get mixRows() {
    const mix = this.edit.mix;
    return [
      { key: 'video' as const, title: 'Video sound', level: mix.video },
      { key: 'music' as const, title: 'Music', level: mix.music },
      { key: 'voice' as const, title: 'Voice', level: mix.voice },
    ];
  }

  get cannotUndo() {
    return !this.canUndo;
  }

  get cannotRedo() {
    return !this.canRedo;
  }

  get cannotZoomOut() {
    return this.zoomIndex <= 0 || this.empty;
  }

  get cannotZoomIn() {
    return this.zoomIndex >= zoomSteps.length - 1 || this.empty;
  }

  get readingText() {
    return this.reading === 1
      ? 'Reading a file…'
      : `Reading ${this.reading} files…`;
  }

  get problemText() {
    return this.problems.join(' ');
  }

  // ----- changes -----

  /** Every edit goes through here: history, then the player. */
  #commit(next: Edit, record = true) {
    if (record) this.history.record(this.edit);
    this.edit = next;
    const s = this.selected;
    if (
      s &&
      !(s.kind === 'video' ? next.pieces : next.audio).some(
        (i) => i.id === s.id,
      )
    )
      this.selected = null;
    this.#syncHistory();
    this.#stale();
    this.player.shape(this.outAspect, this.fit);
    this.player.load(this.clips, next);
  }

  // ----- export -----

  get container(): ExportContainer {
    return CONTAINERS[this.formatIndex] ?? 'mp4';
  }

  get fit(): Fit {
    return FITS[this.fitIndex] ?? 'contain';
  }

  get firstVideo(): Clip | undefined {
    return (
      this.clipMap.get(this.pieces[0]?.clip ?? '') ??
      this.clips.find((clip) => clip.kind === 'video')
    );
  }

  /** Width over height of the exported frame. */
  get outAspect() {
    const ratio = SHAPES[this.shapeIndex]?.ratio;
    if (ratio) return ratio;
    const first = this.firstVideo;
    return first?.width ? first.width / first.height : 16 / 9;
  }

  get sizeIndexShown() {
    if (this.sizeIndex >= 0) return this.sizeIndex;
    const first = this.firstVideo;
    const short = first?.width ? Math.min(first.width, first.height) : 1080;
    return short < 1080 ? 3 : 0;
  }

  get outSize() {
    const first = this.firstVideo;
    const firstShort = first?.width
      ? Math.min(first.width, first.height)
      : 1080;
    const short = SIZES[this.sizeIndexShown] || firstShort;
    const aspect = this.outAspect;
    return aspect >= 1
      ? { width: even(short * aspect), height: even(short) }
      : { width: even(short), height: even(short / aspect) };
  }

  get outFps() {
    const fps = RATES[this.rateIndex] || this.firstVideo?.fps || 30;
    return Math.min(60, Math.max(1, Math.round(fps * 100) / 100));
  }

  /** The codecs the chosen format holds that this browser can encode. */
  get codecs(): ExportCodec[] {
    const held = CONTAINER_CODECS[this.container].video;
    const encoders = this.encoders;
    return encoders ? held.filter((c) => encoders.has(c)) : held;
  }

  get codec(): ExportCodec | null {
    const choice = this.codecChoice;
    return choice && this.codecs.includes(choice)
      ? choice
      : (this.codecs[0] ?? null);
  }

  get codecLabels() {
    return this.codecs.map((c) => CODEC_NAMES[c]);
  }

  get codecIndex() {
    return this.codec ? this.codecs.indexOf(this.codec) : -1;
  }

  get bitrate() {
    const { width, height } = this.outSize;
    const codec = this.codec ?? 'avc';
    const bits =
      (BITS_PER_PIXEL[this.qualityIndex] ?? 0.07) *
      width *
      height *
      this.outFps *
      CODEC_FACTOR[codec];
    return Math.round(Math.min(40e6, Math.max(300e3, bits)));
  }

  get estimate() {
    if (!this.hasItems) return DASH;
    const bits =
      (this.bitrate + (this.keepSound ? SOUND_BITS : 0)) * this.length;
    const { width, height } = this.outSize;
    return `About ${formatBytes(bits / 8)} · ${width} × ${height} · ${this.outFps} fps`;
  }

  get cannotExport() {
    return this.busy || !this.hasItems || !this.codec;
  }

  get exportName() {
    const base = this.firstVideo?.name ?? this.clips[0]?.name ?? 'video';
    return `${base}-edit`;
  }

  get resultRow() {
    const r = this.result;
    if (!r) return null;
    return {
      name: `${this.exportName}.${r.ext}`,
      detail: `${r.ext.toUpperCase()} · ${formatBytes(r.blob.size)} · ${tc(this.length)}`,
    };
  }

  /** A change to the edit or the settings makes the last export stale. */
  #stale() {
    if (this.busy) this.cancelExport();
    this.failed = false;
    if (this.resultUrl) URL.revokeObjectURL(this.resultUrl);
    this.resultUrl = '';
    this.result = null;
  }

  #setting(apply: () => void) {
    apply();
    this.#stale();
    this.player.shape(this.outAspect, this.fit);
  }

  pickFormat = (i: number) => this.#setting(() => (this.formatIndex = i));
  pickCodec = (i: number) =>
    this.#setting(() => (this.codecChoice = this.codecs[i] ?? null));
  pickShape = (i: number) => this.#setting(() => (this.shapeIndex = i));
  pickFit = (i: number) => this.#setting(() => (this.fitIndex = i));
  pickSize = (i: number) => this.#setting(() => (this.sizeIndex = i));
  pickRate = (i: number) => this.#setting(() => (this.rateIndex = i));
  pickQuality = (i: number) => this.#setting(() => (this.qualityIndex = i));
  pickSound = (on: boolean) => this.#setting(() => (this.keepSound = on));

  runExport = () => void this.#export();

  async #export() {
    const codec = this.codec;
    if (this.cannotExport || !codec) return;
    const job = ++this.#job;
    this.#stale();
    this.busy = true;
    this.progress = 0;
    this.player.pause();
    const abort = new AbortController();
    this.#abort = abort;
    try {
      const result = await exportEdit(this.clips, this.edit, {
        container: this.container,
        codec,
        ...this.outSize,
        fps: this.outFps,
        fit: this.fit,
        bitrate: this.bitrate,
        sound: this.keepSound,
        signal: abort.signal,
        onProgress: (fraction) => {
          if (job === this.#job) this.progress = fraction;
        },
      });
      if (job !== this.#job) return;
      this.result = result;
      this.resultUrl = URL.createObjectURL(result.blob);
    } catch (error) {
      if (job !== this.#job || (error as Error).name === 'AbortError') return;
      console.error('Export failed:', error);
      this.failed = true;
    } finally {
      if (this.#abort === abort) this.#abort = null;
      if (job === this.#job) this.busy = false;
    }
  }

  cancelExport = () => {
    this.#job++;
    this.#abort?.abort();
    this.#abort = null;
    this.busy = false;
    this.progress = 0;
  };

  saveExport = () => {
    const r = this.result;
    if (r) downloadBlob(r.blob, `${this.exportName}.${r.ext}`);
  };

  previewExport = () => {
    if (this.resultUrl) window.open(this.resultUrl, '_blank');
  };

  #change(change: Partial<Edit>, record = true) {
    this.#commit({ ...this.edit, ...change }, record);
  }

  #syncHistory() {
    this.canUndo = this.history.canUndo;
    this.canRedo = this.history.canRedo;
  }

  addFiles = async (files: File[]) => {
    const wanted = files.filter((file) => mediaKind(file));
    if (!wanted.length) return;
    this.problems = [];
    this.reading += wanted.length;
    const added: Clip[] = [];
    const failed: string[] = [];
    for (const file of wanted) {
      try {
        const clip =
          mediaKind(file) === 'audio'
            ? await readAudioClip(file)
            : await readClip(file);
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
        `${failed.join(', ')} could not be read. Try MP4, MOV or WebM for video, MP3, M4A or WAV for sound.`,
      ];
    if (!added.length) return;
    this.clips = [...this.clips, ...added];
    let audio = this.edit.audio;
    for (const clip of added.filter((c) => c.kind === 'audio')) {
      audio = [
        ...audio,
        audioFor(clip, 'music', laneEnd(audio, 'music'), audio),
      ];
    }
    this.#change({
      pieces: [
        ...this.pieces,
        ...added.filter((c) => c.kind === 'video').map(pieceFor),
      ],
      audio,
    });
    for (const clip of added) void this.#describe(clip);
  };

  /** Thumbnails and waveform, which arrive after the clip is in use. */
  async #describe(clip: Clip) {
    const live = () => this.#live && this.clips.some((c) => c.id === clip.id);
    const patch = (change: Partial<Clip>) => {
      this.clips = this.clips.map((c) =>
        c.id === clip.id ? { ...c, ...change } : c,
      );
    };
    if (clip.kind === 'video') {
      const frames = await thumbnails(clip.file, live);
      if (!live()) return release(frames);
      patch({ frames });
    }
    if (clip.hasAudio && clip.file.size <= peaksLimit) {
      const wave = await peaks(clip.file);
      if (live() && wave) patch({ peaks: wave });
    }
  }

  removeClip = (id: string) => {
    const clip = this.clipMap.get(id);
    if (!clip) return;
    this.clips = this.clips.filter((c) => c.id !== id);
    // items of a gone file cannot come back
    this.history.clear();
    this.#change(
      {
        pieces: this.pieces.filter((piece) => piece.clip !== id),
        audio: this.edit.audio.filter((item) => item.clip !== id),
      },
      false,
    );
    URL.revokeObjectURL(clip.url);
    release(clip.frames);
  };

  addVideoAgain = (id: string) => {
    const clip = this.clipMap.get(id);
    if (clip) this.#change({ pieces: [...this.pieces, pieceFor(clip)] });
  };

  /** A sound goes onto a layer at the playhead. */
  addSound = (id: string, lane: Lane) => {
    const clip = this.clipMap.get(id);
    if (!clip) return;
    const item = audioFor(clip, lane, this.player.time, this.edit.audio);
    this.#change({ audio: [...this.edit.audio, item] });
    this.selected = { kind: 'audio', id: item.id };
  };

  addToMusic = (id: string) => this.addSound(id, 'music');
  addToVoice = (id: string) => this.addSound(id, 'voice');

  select = (selection: Selection | null) => (this.selected = selection);

  scrub = (seconds: number) => this.player.scrub(seconds);

  splitHere = () => {
    const target = this.splitTarget;
    if (!target) return;
    const t = this.player.time;
    if (target.kind === 'audio') {
      const audio = splitAudio(this.edit.audio, target.id, t);
      this.#change({ audio });
      const after = audio.find((a) => a.start === t && a.id !== target.id);
      if (after) this.selected = { kind: 'audio', id: after.id };
      return;
    }
    const pieces = split(this.pieces, t);
    this.#change({ pieces });
    // the piece after the cut is selected, ready to trim or delete
    const place = placeAt(pieces, t);
    if (place) this.selected = { kind: 'video', id: place.piece.id };
  };

  deleteSelected = () => {
    const s = this.selected;
    if (!s) return;
    if (s.kind === 'audio') {
      this.#change({ audio: this.edit.audio.filter((a) => a.id !== s.id) });
      return;
    }
    const index = this.selectedIndex;
    const pieces = remove(this.pieces, s.id);
    this.#change({ pieces });
    const next = pieces[Math.min(index, pieces.length - 1)];
    this.selected = next ? { kind: 'video', id: next.id } : null;
  };

  duplicateSelected = () => {
    const s = this.selected;
    if (s?.kind === 'video') {
      this.#change({ pieces: duplicate(this.pieces, s.id) });
    } else if (s?.kind === 'audio') {
      const item = this.edit.audio.find((a) => a.id === s.id);
      if (!item) return;
      const copy = settle(this.edit.audio, {
        ...item,
        id: newId('a'),
        start: endOf(item),
      });
      this.#change({ audio: [...this.edit.audio, copy] });
      this.selected = { kind: 'audio', id: copy.id };
    }
  };

  moveSelected = (by: number) => {
    const s = this.selected;
    if (s?.kind !== 'video') return;
    const to = this.selectedIndex + by;
    if (to < 0 || to >= this.pieces.length) return;
    this.#change({ pieces: move(this.pieces, s.id, to) });
  };

  moveLeft = () => this.moveSelected(-1);
  moveRight = () => this.moveSelected(1);

  movePiece = (id: string, index: number) => {
    this.#change({ pieces: move(this.pieces, id, index) });
    this.selected = { kind: 'video', id };
  };

  moveSound = (id: string, start: number, lane: Lane) => {
    this.#change({ audio: moveAudio(this.edit.audio, id, start, lane) });
    this.selected = { kind: 'audio', id };
  };

  trimStart = () => {
    this.history.record(this.edit);
    this.#syncHistory();
  };

  trimPiece = (id: string, inPoint: number, outPoint: number) => {
    const piece = this.pieces.find((p) => p.id === id);
    const clip = piece && this.clipMap.get(piece.clip);
    if (!clip) return;
    this.#change(
      { pieces: trim(this.pieces, id, inPoint, outPoint, clip.duration) },
      false,
    );
  };

  trimSound = (id: string, inPoint: number, outPoint: number) => {
    const item = this.edit.audio.find((a) => a.id === id);
    const clip = item && this.clipMap.get(item.clip);
    if (!clip) return;
    this.#change(
      {
        audio: trimAudio(this.edit.audio, id, inPoint, outPoint, clip.duration),
      },
      false,
    );
  };

  /** Changes a field of the selected item, with its own history step. */
  #patch(change: Partial<Omit<Piece, 'id' | 'clip'>> & Partial<AudioItem>) {
    const s = this.selected;
    if (!s) return;
    if (s.kind === 'video')
      this.#change({ pieces: update(this.pieces, s.id, change) });
    else this.#change({ audio: updateAudio(this.edit.audio, s.id, change) });
  }

  setIn = (seconds: number) => {
    const c = this.chosen;
    if (!c?.clip) return;
    if (c.kind === 'video')
      this.#change({
        pieces: trim(this.pieces, c.id, seconds, c.out, c.clip.duration),
      });
    else
      this.#change({
        audio: trimAudio(
          this.edit.audio,
          c.id,
          seconds,
          c.out,
          c.clip.duration,
        ),
      });
  };

  setOut = (seconds: number) => {
    const c = this.chosen;
    if (!c?.clip) return;
    if (c.kind === 'video')
      this.#change({
        pieces: trim(this.pieces, c.id, c.in, seconds, c.clip.duration),
      });
    else
      this.#change({
        audio: trimAudio(this.edit.audio, c.id, c.in, seconds, c.clip.duration),
      });
  };

  setStart = (seconds: number) => {
    const c = this.chosen;
    if (c?.kind === 'audio')
      this.#change({ audio: moveAudio(this.edit.audio, c.id, seconds) });
  };

  setLane = (index: number) => {
    const c = this.chosen;
    const lane = LANES[index];
    if (c?.kind === 'audio' && lane)
      this.#change({ audio: moveAudio(this.edit.audio, c.id, c.start, lane) });
  };

  /** Slider drags change the volume live; the history keeps one step a drag. */
  #dragging = false;

  setVolume = (volume: number, dragging: boolean) => {
    const record = !this.#dragging;
    this.#dragging = dragging;
    const s = this.selected;
    if (!s) return;
    const change = { volume };
    if (s.kind === 'video')
      this.#change({ pieces: update(this.pieces, s.id, change) }, record);
    else
      this.#change(
        { audio: updateAudio(this.edit.audio, s.id, change) },
        record,
      );
  };

  setMuted = (muted: boolean) => this.#patch({ muted });
  setFadeIn = (fadeIn: number) => this.#patch({ fadeIn });
  setFadeOut = (fadeOut: number) => this.#patch({ fadeOut });

  setLevel = (key: keyof Mix, change: Partial<Level>, dragging = false) => {
    const record = !this.#dragging;
    this.#dragging = dragging;
    const mix = {
      ...this.edit.mix,
      [key]: { ...this.edit.mix[key], ...change },
    };
    this.#change({ mix }, record);
  };

  levelVolume = (key: keyof Mix, volume: number, dragging: boolean) =>
    this.setLevel(key, { volume }, dragging);

  /** The switch reads "on": a layer that plays. */
  levelOn = (key: keyof Mix, on: boolean) => this.setLevel(key, { muted: !on });

  markInHere = () => (this.markIn = this.player.time);
  markOutHere = () => (this.markOut = this.player.time);

  clearMarks = () => {
    this.markIn = null;
    this.markOut = null;
  };

  cutOut = () => {
    const range = this.range;
    if (!range) return;
    this.#change({
      pieces: cutRange(this.pieces, range[0], range[1]),
      audio: cutRangeAudio(this.edit.audio, range[0], range[1]),
    });
    this.clearMarks();
    this.player.scrub(range[0]);
  };

  undo = () => {
    const previous = this.history.undo(this.edit);
    if (previous) this.#commit(previous, false);
  };

  redo = () => {
    const next = this.history.redo(this.edit);
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
      if (command || !this.hasItems) return;
      if (event.altKey && key === 'arrowleft') return run(this.moveLeft);
      if (event.altKey && key === 'arrowright') return run(this.moveRight);
      if (key === ' ' && !(event.target instanceof HTMLButtonElement))
        return run(this.player.toggle);
      if (key === 'arrowleft') return run(this.stepBack);
      if (key === 'arrowright') return run(this.stepForward);
      if (key === 's') return run(this.splitHere);
      if (key === 'i') return run(this.markInHere);
      if (key === 'o') return run(this.markOutHere);
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
      <:main>
        <XzGrid class="ve-tools">
          <XzButton
            class="ve-split"
            @text="Split"
            @icon={{SplitIcon}}
            @disabled={{this.cannotSplit}}
            @onClick={{this.splitHere}}
          />
          <XzButton
            class="ve-delete"
            @text="Delete"
            @icon={{DeleteIcon}}
            @disabled={{this.nothingChosen}}
            @onClick={{this.deleteSelected}}
          />
          <XzButton
            class="ve-duplicate"
            @text="Duplicate"
            @icon={{CopyIcon}}
            @disabled={{this.nothingChosen}}
            @onClick={{this.duplicateSelected}}
          />
          <XzButton
            class="ve-undo"
            @label="Undo"
            @icon={{UndoIcon}}
            @disabled={{this.cannotUndo}}
            @onClick={{this.undo}}
          />
          <XzButton
            class="ve-redo"
            @label="Redo"
            @icon={{RedoIcon}}
            @disabled={{this.cannotRedo}}
            @onClick={{this.redo}}
          />
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
        <XzCanvas
          class="ve-timeline-canvas"
          @height={{timelineHeight}}
          @background="var(--xz-surface-2)"
        >
          {{#if this.hasItems}}
            <Timeline
              @clips={{this.clipMap}}
              @edit={{this.edit}}
              @selected={{this.selected}}
              @time={{this.player.time}}
              @range={{this.range}}
              @zoom={{this.zoom}}
              @playing={{this.player.playing}}
              @onSelect={{this.select}}
              @onScrub={{this.scrub}}
              @onTrimStart={{this.trimStart}}
              @onTrim={{this.trimPiece}}
              @onMove={{this.movePiece}}
              @onAudioTrim={{this.trimSound}}
              @onAudioMove={{this.moveSound}}
            />
          {{else}}
            <p class="ve-timeline-empty">Add videos and sounds and they line up
              here.</p>
          {{/if}}
        </XzCanvas>

        <XzRows @framed={{true}}>
          <XzHeading @text="Selected" />
          <XzRow
            class="ve-chosen"
            @title={{if this.chosen this.chosen.name "Nothing selected"}}
            @detail={{this.chosenDetail}}
          />
          {{#if this.chosen}}
            {{#if this.chosenIsAudio}}
              <XzSegmented
                class="ve-lane-pick"
                @items={{laneLabels}}
                @selected={{this.laneIndex}}
                @onChange={{this.setLane}}
              />
              <XzRow
                @title="On the timeline at"
                @detail="Seconds"
                @form="flush"
                as |titleId|
              >
                <XzDecimalField
                  class="ve-start"
                  @value={{this.chosen.start}}
                  @labelledBy={{titleId}}
                  @onChange={{this.setStart}}
                />
              </XzRow>
            {{/if}}
            <XzRow
              @title="From"
              @detail="Seconds into the file"
              @form="flush"
              as |titleId|
            >
              <XzDecimalField
                class="ve-in"
                @value={{this.chosen.in}}
                @max={{this.inMax}}
                @labelledBy={{titleId}}
                @onChange={{this.setIn}}
              />
            </XzRow>
            <XzRow
              @title="To"
              @detail="Seconds into the file"
              @form="flush"
              as |titleId|
            >
              <XzDecimalField
                class="ve-out"
                @value={{this.chosen.out}}
                @min={{this.outMin}}
                @max={{this.outMax}}
                @labelledBy={{titleId}}
                @onChange={{this.setOut}}
              />
            </XzRow>
            <XzRow @title="Length" @detail={{this.chosenLength}} />
            <XzRow @title="Volume" @form="flush" as |titleId|>
              <XzSlider
                class="ve-volume"
                @value={{this.chosen.volume}}
                @max={{2}}
                @step={{0.01}}
                @readout={{percent}}
                @labelledBy={{titleId}}
                @onChange={{this.setVolume}}
              />
            </XzRow>
            <XzRow @title="Mute">
              <XzSwitch
                class="ve-mute"
                @on={{this.chosen.muted}}
                @onChange={{this.setMuted}}
                aria-label="Mute"
              />
            </XzRow>
            <XzRow
              @title="Fade in"
              @detail={{if
                this.chosenIsVideo
                "From black and silence"
                "From silence"
              }}
              @form="flush"
              as |titleId|
            >
              <XzDecimalField
                class="ve-fade-in"
                @value={{this.chosen.fadeIn}}
                @max={{this.fadeMax}}
                @labelledBy={{titleId}}
                @onChange={{this.setFadeIn}}
              />
            </XzRow>
            <XzRow
              @title="Fade out"
              @detail={{if
                this.chosenIsVideo
                "To black and silence"
                "To silence"
              }}
              @form="flush"
              as |titleId|
            >
              <XzDecimalField
                class="ve-fade-out"
                @value={{this.chosen.fadeOut}}
                @max={{this.fadeMax}}
                @labelledBy={{titleId}}
                @onChange={{this.setFadeOut}}
              />
            </XzRow>
            {{#if this.chosenIsVideo}}
              <XzGrid>
                <XzButton
                  class="ve-move-left"
                  @text="Earlier"
                  @icon={{LeftIcon}}
                  @disabled={{this.cannotMoveLeft}}
                  @onClick={{this.moveLeft}}
                />
                <XzButton
                  class="ve-move-right"
                  @text="Later"
                  @icon={{RightIcon}}
                  @disabled={{this.cannotMoveRight}}
                  @onClick={{this.moveRight}}
                />
              </XzGrid>
            {{/if}}
          {{/if}}
        </XzRows>
        <p class="ve-keys">
          Keys: Space play · S split · I / O mark · X cut out · Delete · Alt+← →
          move · ← → frame · Ctrl Z / Y undo, redo
        </p>
      </:main>
      <:sidebar>
        <XzRows @framed={{true}}>
          <XzHeading @text="Files" />
          <XzDropZone
            class="ve-drop-zone"
            @prompt="Drop videos and sounds here, or press Files"
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
              @form="stacked"
            >
              <XzGrid>
                {{#if row.isVideo}}
                  <XzButton
                    @text="Add again"
                    @icon={{AddIcon}}
                    @onClick={{fn this.addVideoAgain row.clip.id}}
                  />
                {{else}}
                  <XzButton
                    class="ve-to-music"
                    @label="Add {{row.clip.name}} to Music at the playhead"
                    @icon={{MusicIcon}}
                    @onClick={{fn this.addToMusic row.clip.id}}
                  />
                  <XzButton
                    class="ve-to-voice"
                    @label="Add {{row.clip.name}} to Voice at the playhead"
                    @icon={{VoiceIcon}}
                    @onClick={{fn this.addToVoice row.clip.id}}
                  />
                {{/if}}
                <XzButton
                  @label="Remove {{row.clip.name}}"
                  @icon={{DeleteIcon}}
                  @onClick={{fn this.removeClip row.clip.id}}
                />
              </XzGrid>
            </XzRow>
          {{else}}
            <XzEmptyRow
              @text="Nothing yet. Videos join in the order you add them; sounds go on the Music layer."
            />
          {{/each}}

          <XzHeading @text="Layers" />
          {{#each this.mixRows as |row|}}
            <XzRow
              class="ve-level ve-level--{{row.key}}"
              @title={{row.title}}
              @form="stacked"
              as |titleId|
            >
              <XzSlider
                @value={{row.level.volume}}
                @max={{2}}
                @step={{0.01}}
                @readout={{percent}}
                @labelledBy={{titleId}}
                @onChange={{fn this.levelVolume row.key}}
              />
              <XzSwitch
                @on={{if row.level.muted false true}}
                @onChange={{fn this.levelOn row.key}}
                aria-label="{{row.title}} on"
              />
            </XzRow>
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
              @disabled={{this.empty}}
              @onClick={{this.markInHere}}
            />
            <XzButton
              class="ve-set-out"
              @text="Set out"
              @icon={{SetOutIcon}}
              @disabled={{this.empty}}
              @onClick={{this.markOutHere}}
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
          <XzSegmented
            class="ve-format"
            @items={{FORMAT_LABELS}}
            @selected={{this.formatIndex}}
            @onChange={{this.pickFormat}}
          />
          <XzSegmented
            class="ve-codec"
            @items={{this.codecLabels}}
            @selected={{this.codecIndex}}
            @onChange={{this.pickCodec}}
          />
          <XzHeading @text="Shape" />
          <XzSegmented
            class="ve-shape"
            @items={{SHAPE_LABELS}}
            @selected={{this.shapeIndex}}
            @columns={{3}}
            @onChange={{this.pickShape}}
          />
          <XzSegmented
            class="ve-fit"
            @items={{FIT_LABELS}}
            @selected={{this.fitIndex}}
            @onChange={{this.pickFit}}
          />
          <XzHeading @text="Size" />
          <XzSegmented
            class="ve-size"
            @items={{SIZE_LABELS}}
            @selected={{this.sizeIndexShown}}
            @columns={{2}}
            @onChange={{this.pickSize}}
          />
          <XzHeading @text="Frame rate" />
          <XzSegmented
            class="ve-rate"
            @items={{RATE_LABELS}}
            @selected={{this.rateIndex}}
            @onChange={{this.pickRate}}
          />
          <XzHeading @text="Quality" />
          <XzSegmented
            class="ve-quality"
            @items={{QUALITY_LABELS}}
            @selected={{this.qualityIndex}}
            @onChange={{this.pickQuality}}
          />
          <XzRow @title="Sound" @detail="The video's sound, Music and Voice">
            <XzSwitch
              class="ve-sound-on"
              @on={{this.keepSound}}
              @onChange={{this.pickSound}}
              aria-label="Keep sound"
            />
          </XzRow>
          <XzRow class="ve-estimate" @title="File" @detail={{this.estimate}} />
          <Job
            @title="Export"
            @icon={{ExportIcon}}
            @failure={{EXPORT_ERROR}}
            @disabled={{this.cannotExport}}
            @busy={{this.busy}}
            @progress={{this.progress}}
            @failed={{this.failed}}
            @result={{this.resultRow}}
            @onRun={{this.runExport}}
            @onCancel={{this.cancelExport}}
            @onSave={{this.saveExport}}
            @onPreview={{this.previewExport}}
          />
        </XzRows>
      </:sidebar>
      <:footer>
        <Transport @playback={{this.player}} @ready={{this.hasItems}}>
          <:before>
            <XzButton
              class="ve-back"
              @label="Back one frame"
              @icon={{BackIcon}}
              @repeats={{true}}
              @disabled={{this.empty}}
              @onClick={{this.stepBack}}
            />
          </:before>
          <:default>
            <XzButton
              class="ve-forward"
              @label="Forward one frame"
              @icon={{ForwardIcon}}
              @repeats={{true}}
              @disabled={{this.empty}}
              @onClick={{this.stepForward}}
            />
          </:default>
        </Transport>
      </:footer>
    </XzSplit>
  </template>
}
