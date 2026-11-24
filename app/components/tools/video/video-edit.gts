import Component from '@glimmer/component';
import type Owner from '@ember/owner';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { modifier } from 'ember-modifier';
import XzButton from 'xsenze-tools/components/xz/button';
import XzDialog from 'xsenze-tools/components/xz/dialog';
import PageTools from 'xsenze-tools/components/page-tools';
import { htmlSafe } from '@ember/template';
import XzDecimalField from 'xsenze-tools/components/xz/decimal-field';
import XzDropZone from 'xsenze-tools/components/xz/drop-zone';
import XzGrid from 'xsenze-tools/components/xz/grid';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzRow from 'xsenze-tools/components/xz/row';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSegmented from 'xsenze-tools/components/xz/segmented';
import XzStatus from 'xsenze-tools/components/xz/status';
import XzSwitch from 'xsenze-tools/components/xz/switch';
import { IconSvg } from 'xsenze-tools/components/icon';
import Drop from 'xsenze-tools/components/tools/shared/media/drop';
import {
  peaks,
  release,
  thumbnails,
} from 'xsenze-tools/components/tools/shared/media/frames';
import PropSlider from 'xsenze-tools/components/tools/video/video-edit/prop-slider';
import AnimPicker, {
  type AnimSide,
} from 'xsenze-tools/components/tools/video/video-edit/anim-picker';
import FrameBox from 'xsenze-tools/components/tools/video/video-edit/frame-box';
import LayerProps, {
  type LayerTab,
} from 'xsenze-tools/components/tools/video/video-edit/layer-props';
import Timeline, {
  type Selection,
} from 'xsenze-tools/components/tools/video/video-edit/timeline';
import {
  EMOJI,
  SHAPES as SHAPE_NAMES,
} from 'xsenze-tools/lib/video/edit/layers';
import { formatFps } from 'xsenze-tools/lib/video/media-probe';
import { formatTimestamp } from 'xsenze-tools/lib/subtitles/subtitles';
import {
  AUDIO_ACCEPT,
  IMAGE_ACCEPT,
  SUBTITLE_ACCEPT,
  VIDEO_ACCEPT,
  acceptAttr,
} from 'xsenze-tools/lib/tools';
import XzColourWell from 'xsenze-tools/components/xz/colour-well';
import {
  FILTERS,
  MOTIONS,
  TRANSITIONS,
} from 'xsenze-tools/lib/video/edit/draw';
import {
  clipStill,
  reverseClip,
  reverseLimit,
} from 'xsenze-tools/lib/video/edit/clip-tools';
import { hex, parseHex, type Rgb } from 'xsenze-tools/lib/xz/colour';
import {
  mediaKind,
  readAudioClip,
  readClip,
  readImageClip,
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
  type Piece,
  plainLook,
  photoLimit,
  type Background,
  type Filter,
  type Look,
  cutRangeLayers,
  duplicateLayer,
  emojiLayer,
  layerEnd,
  mediaLayer,
  moveLayer,
  overlapOf,
  restack,
  shapeLayer,
  splitLayer,
  textLayer,
  trimLayer,
  updateLayer,
  type Layer,
  type ShapeKind,
  type TextPreset,
  type TransitionKind,
  type MotionKind,
  type Anim,
  laneFree,
  lengthOf,
  plainMotion,
} from 'xsenze-tools/lib/video/edit/timeline';
import Job from 'xsenze-tools/components/tools/shared/media/job';
import type { StreamTargetChunk } from 'mediabunny';
import { downloadBlob } from 'xsenze-tools/lib/download';
import { channelsOf, encodeWav } from 'xsenze-tools/lib/audio/audio';
import { denoise } from 'xsenze-tools/lib/audio/denoise';
import {
  LANGUAGES,
  MODELS,
  type Mode,
} from 'xsenze-tools/lib/ai/whisper-models';
import type { Cue } from 'xsenze-tools/lib/subtitles/subtitles';
import { service } from '@ember/service';
import type XzToastService from 'xsenze-tools/services/xz-toast';
import OpenIn from 'xsenze-tools/components/tools/shared/media/open-in';
import { parseSubtitles } from 'xsenze-tools/lib/subtitles/subtitles';
import {
  clearProject,
  dropFile,
  keepClip,
  loadProject,
  packProject,
  saveFile,
  saveState,
  unpackProject,
  type Saved,
} from 'xsenze-tools/lib/video/edit/store';
import { CLIP_DRAG } from 'xsenze-tools/components/tools/video/video-edit/timeline';
import { formatBytes } from 'xsenze-tools/lib/format';
import {
  CONTAINER_CODECS,
  exportCodecs,
  exportEdit,
  exportFrame,
  exportGif,
  exportSound,
  mixSpeech,
  type SoundFormat,
  type ExportCodec,
  type ExportContainer,
  type ExportResult,
} from 'xsenze-tools/lib/video/edit/export';
import type { Fit } from 'xsenze-tools/lib/video/edit/draw';
import '../shared/media/media.css';
import './video-edit/video-edit.css';

const ACCEPT = acceptAttr([...VIDEO_ACCEPT, ...AUDIO_ACCEPT, ...IMAGE_ACCEPT]);
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const SPEED_LABELS = SPEEDS.map((s) => `${s}×`);
const FILTER_IDS = Object.keys(FILTERS) as Filter[];
const FILTER_LABELS = FILTER_IDS.map((id) => FILTERS[id].label);
const BACKGROUNDS: Background['kind'][] = ['black', 'colour', 'blur'];
const BACKGROUND_LABELS = ['Black', 'Colour', 'Blur'];
const cropReadout = (value: number) => `${Math.round(value * 100)}%`;
const DASH = '—';
const tc = (seconds: number) => formatTimestamp(seconds * 1000, '.');
const percent = (value: number) => `${Math.round(value * 100)}%`;
// height over width at most 1.25, at most 380 px tall
const tallest = 1.25;
const zoomSteps = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32];
// a waveform needs the whole file decoded: skip it for very large files
const peaksLimit = 300 * 1024 * 1024;
const laneLabels = ['Music', 'Voice'];

const icon = (name: string) => <template><IconSvg @name={{name}} /></template>;
const LeftIcon = icon('arrow-left');
const RightIcon = icon('arrow-right');
const FilmIcon = icon('film');
const ExportIcon = icon('download');
const RotateLeftIcon = icon('rotate-ccw');
const RotateRightIcon = icon('rotate-cw');
const FlipHIcon = icon('flip-horizontal-2');
const FlipVIcon = icon('flip-vertical-2');
const ResetIcon = icon('rotate-ccw-square');
const ReverseIcon = icon('rewind');
const FreezeIcon = icon('snowflake');
const LayersIcon = icon('layers');
const SHAPE_ICON_PARTS = {
  rect: icon('square'),
  circle: icon('circle'),
  arrow: icon('arrow-right'),
  star: icon('star'),
};
const shapeIcon = (shape: ShapeKind) => SHAPE_ICON_PARTS[shape];

// ----- export settings -----

const CONTAINERS: ExportContainer[] = ['mp4', 'webm'];
const FORMAT_LABELS = ['MP4', 'WebM', 'GIF', 'Sound'];
type ExportKind = 'video' | 'gif' | 'sound';
const GIF_SIZES = [240, 360, 480];
const GIF_SIZE_LABELS = ['Small', 'Medium', 'Large'];
const GIF_RATES = [10, 15, 20];
const GIF_RATE_LABELS = ['10', '15', '20'];
/** GIF bytes per pixel per frame, roughly, for the estimate. */
const GIF_BYTES = 0.35;
const SOUND_FORMATS: SoundFormat[] = ['mp3', 'wav'];
const SOUND_FORMAT_LABELS = ['MP3', 'WAV'];
const MOTION_IDS: MotionKind[] = (Object.keys(MOTIONS) as MotionKind[]).filter(
  (kind) => kind !== 'none',
);
const MOTION_LABELS = MOTION_IDS.map((id) => MOTIONS[id]);
/** Seconds a freeze frame holds. */
const freezeSeconds = 3;
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
/** The output's short side; 0 is the first clip's. 4K joins where it can be made. */
const SIZES = [1080, 720, 480, 0];
const sizeLabel = (short: number) =>
  short === 2160 ? '4K' : short ? `${short}p` : 'First clip';
const RATES = [0, 24, 25, 30, 60];
const RATE_LABELS = ['First clip', '24', '25', '30', '60'];
const QUALITY_LABELS = ['Small', 'Balanced', 'High'];
/** H.264 bits per pixel per frame, per quality. */
const BITS_PER_PIXEL = [0.04, 0.07, 0.11];
const SOUND_BITS = 192_000;
const EXPORT_ERROR = "Couldn't export. Try another format or a smaller size.";
const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

type ToolId = 'media' | 'text' | 'overlay' | 'audio' | 'canvas';
/** The layers with a level of their own. */
type Layered = 'video' | 'music' | 'voice';
type TabId = 'edit' | 'adjust' | 'audio' | 'transition' | 'style' | 'anim';

/** The editor's tool rail. */
const TOOLS: { id: ToolId; label: string; icon: string }[] = [
  { id: 'media', label: 'Media', icon: 'film' },
  { id: 'text', label: 'Text', icon: 'type' },
  { id: 'overlay', label: 'Overlay', icon: 'layers' },
  { id: 'audio', label: 'Audio', icon: 'audio-lines' },
  { id: 'canvas', label: 'Canvas', icon: 'frame' },
];
const TAB_LABELS: Record<TabId, string> = {
  edit: 'Edit',
  adjust: 'Adjust',
  audio: 'Audio',
  transition: 'Transition',
  style: 'Style',
  anim: 'Animate',
};

const TEXT_PRESETS: { id: TextPreset; label: string; icon: string }[] = [
  { id: 'title', label: 'Title', icon: 'heading' },
  { id: 'subtitle', label: 'Subtitle', icon: 'text-cursor-input' },
  { id: 'caption', label: 'Caption', icon: 'captions' },
  { id: 'lower', label: 'Name and role', icon: 'subtitles' },
];
const SHAPE_KINDS = Object.keys(SHAPE_NAMES) as ShapeKind[];
const OVERLAY_ACCEPT = acceptAttr([...IMAGE_ACCEPT, ...VIDEO_ACCEPT]);
const TRANSITION_IDS = Object.keys(TRANSITIONS) as TransitionKind[];
const TRANSITION_LABELS = TRANSITION_IDS.map((id) => TRANSITIONS[id]);
const secondsReadout = (value: number) => `${value.toFixed(1)} s`;

/** Frame shapes for where the video will be posted; each sets 1080p. */
const PRESETS: { label: string; shape: number }[] = [
  { label: 'YouTube', shape: 1 },
  { label: 'Shorts', shape: 2 },
  { label: 'Reels', shape: 2 },
  { label: 'TikTok', shape: 2 },
  { label: 'Insta post', shape: 3 },
  { label: 'Insta story', shape: 2 },
  { label: 'Facebook', shape: 3 },
  { label: 'X', shape: 1 },
];
const PRESET_LABELS = PRESETS.map((p) => p.label);
const CAPTION_ACCEPT = acceptAttr([...SUBTITLE_ACCEPT]);

// ----- speech -----
const HEAR_MODES: Mode[] = ['fast', 'reasonable', 'accurate'];
const HEAR_LABELS = ['Rough', 'Decent', 'Experimental'];
const hasGpu = () => typeof navigator !== 'undefined' && 'gpu' in navigator;
const CLEAN_LABELS = ['Off', 'Light', 'Strong'];
const CLEAN_LEVELS = [0, 0.5, 1];
/** Files larger than this are not decoded whole for noise reduction. */
const cleanLimit = 300 * 1024 * 1024;
const MicIcon = <template><IconSvg @name="mic" /></template>;
const StopIcon = <template><IconSvg @name="square" /></template>;
const SubtitleIcon = <template><IconSvg @name="captions" /></template>;
const DetachIcon = <template><IconSvg @name="unlink" /></template>;
/**
 * Whisper's words without its notes on sounds, such as "(crickets
 * chirping)" or "[Music]": a word inside brackets is not speech.
 */
function spokenWords<T extends { text: string }>(words: T[]): T[] {
  let depth = 0;
  return words.filter((word) => {
    const opens = (word.text.match(/[([]/g) ?? []).length;
    const closes = (word.text.match(/[)\]]/g) ?? []).length;
    const inside = depth > 0 || opens > 0;
    depth = Math.max(0, depth + opens - closes);
    return !inside;
  });
}

/** Captions kept inside the speech heard, so a stray time cannot lengthen the edit. */
function spokenCues(cues: Cue[], seconds: number): Cue[] {
  const limit = seconds * 1000;
  return cues
    .filter((cue) => cue.start < limit - 50)
    .map((cue) => ({ ...cue, end: Math.min(cue.end, limit) }));
}

const recordClock = (seconds: number) => {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const CaptionsIcon = <template><IconSvg @name="captions" /></template>;
/** Above this, an export is written to a file as it renders, where the browser can. */
const diskBytes = 500e6;
/** Milliseconds after a change before the edit is kept in the browser. */
const keepDelay = 500;

type SaveFilePicker = (options: {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{
  createWritable(): Promise<WritableStream<StreamTargetChunk>>;
  getFile(): Promise<File>;
}>;

/** 0:05.20, 1:02:03.40: minutes, seconds and hundredths. */
function clock(seconds: number): string {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = (s % 60).toFixed(2).padStart(5, '0');
  const mm = String(m).padStart(2, '0');
  return h ? `${h}:${mm}:${rest}` : `${m}:${rest}`;
}

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
  /** The short side picked; -1 picks 1080p, or the first clip's size when it is smaller. */
  @tracked sizeShort = -1;
  @tracked gifSizeIndex = 1;
  @tracked gifRateIndex = 1;
  @tracked soundFormatIndex = 0;
  @tracked rateIndex = 0;
  @tracked qualityIndex = 1;
  @tracked keepSound = true;
  @tracked encoders: Set<ExportCodec> | null = null;
  /** The codecs this browser can encode at 4K. */
  @tracked encoders4k: Set<ExportCodec> | null = null;
  @tracked busy = false;
  @tracked progress = 0;
  @tracked failed = false;
  @tracked result: ExportResult | null = null;
  @tracked resultUrl = '';
  #abort: AbortController | null = null;
  #job = 0;

  @service('xz-toast') declare toast: XzToastService;

  constructor(owner: Owner, args: object) {
    super(owner, args);
    void exportCodecs(1920, 1080).then((set) => {
      if (this.#live) this.encoders = set;
    });
    void exportCodecs(3840, 2160).then((set) => {
      if (this.#live) this.encoders4k = set;
    });
    void this.#restore();
  }

  // ----- kept in the browser -----

  /** False until the kept edit has been read, so nothing overwrites it first. */
  #restored = false;
  #keepTimer = 0;
  /** Set when the browser had no room for a file. */
  #full = false;
  @tracked newOpen = false;

  /** The settings kept with the edit. */
  get #settings(): Saved['settings'] {
    return {
      formatIndex: this.formatIndex,
      shapeIndex: this.shapeIndex,
      fitIndex: this.fitIndex,
      sizeShort: this.sizeShort,
      gifSizeIndex: this.gifSizeIndex,
      gifRateIndex: this.gifRateIndex,
      soundFormatIndex: this.soundFormatIndex,
      rateIndex: this.rateIndex,
      qualityIndex: this.qualityIndex,
      keepSound: this.keepSound,
      presetIndex: this.presetIndex,
    };
  }

  async #restore() {
    const kept = await loadProject().catch(() => null);
    if (!this.#live) return;
    // files added while it was reading win; the kept edit waits for next time
    if (!kept || this.clips.length) {
      this.#restored = true;
      return;
    }
    this.#load(kept.saved, kept.files);
    this.toast.notify('Your last edit is back');
  }

  /** Puts a kept or opened edit in place of an empty editor. */
  #load(saved: Saved, files: ReadonlyMap<string, File>) {
    const clips: Clip[] = saved.clips.map((clip) => {
      const file = files.get(clip.id)!;
      const url = URL.createObjectURL(file);
      return {
        ...clip,
        file,
        url,
        frames: clip.kind === 'image' ? [url] : [],
        peaks: null,
      };
    });
    const set = saved.settings;
    const num = (key: string, fallback: number) =>
      typeof set[key] === 'number' ? set[key] : fallback;
    this.formatIndex = num('formatIndex', 0);
    this.shapeIndex = num('shapeIndex', 0);
    this.fitIndex = num('fitIndex', 0);
    this.sizeShort = num('sizeShort', -1);
    this.gifSizeIndex = num('gifSizeIndex', 1);
    this.gifRateIndex = num('gifRateIndex', 1);
    this.soundFormatIndex = num('soundFormatIndex', 0);
    this.rateIndex = num('rateIndex', 0);
    this.qualityIndex = num('qualityIndex', 1);
    this.presetIndex = num('presetIndex', -1);
    this.keepSound = set['keepSound'] !== false;
    this.clips = clips;
    this.#restored = true;
    this.#commit(saved.edit, false);
    for (const clip of clips) void this.#describe(clip);
  }

  // ----- project file -----

  @tracked openOpen = false;
  @tracked packing = false;
  #pendingProject: File | null = null;

  get #record(): Saved {
    return {
      version: 1,
      clips: this.clips.map(keepClip),
      edit: this.edit,
      settings: this.#settings,
      savedAt: Date.now(),
    };
  }

  /** The whole edit and its files as one .zip, to open on another device. */
  saveProject = async () => {
    if (this.packing || !this.clips.length) return;
    this.packing = true;
    try {
      const blob = await packProject(
        this.#record,
        new Map(this.clips.map((clip) => [clip.id, clip.file])),
      );
      downloadBlob(blob, `${this.exportName} project.zip`);
    } catch (error) {
      console.error('Saving the project failed:', error);
      this.toast.notify("Couldn't save the project file.");
    } finally {
      if (this.#live) this.packing = false;
    }
  };

  pickProjectFile = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (this.clips.length) {
      this.#pendingProject = file;
      this.openOpen = true;
    } else void this.#openProject(file);
  };

  closeOpen = () => {
    this.openOpen = false;
    this.#pendingProject = null;
  };

  confirmOpen = () => {
    const file = this.#pendingProject;
    this.closeOpen();
    if (file) void this.#openProject(file);
  };

  async #openProject(file: File) {
    this.packing = true;
    try {
      const { saved, files } = await unpackProject(file);
      if (!this.#live) return;
      if (!saved.clips.length) {
        this.toast.notify('This project file has no media in it.');
        return;
      }
      this.startOver();
      this.#load(saved, files);
      for (const clip of this.clips) this.#keepFile(clip);
      this.#keep();
      this.toast.notify(`Opened ${file.name}`);
    } catch (error) {
      console.error('Opening the project failed:', error);
      this.toast.notify("That isn't a Video Edit project file.");
    } finally {
      if (this.#live) this.packing = false;
    }
  }

  // ----- the frame as a picture -----

  @tracked savingFrame = false;

  /** The frame at the playhead, at the export's size, as a PNG. */
  saveFrame = async () => {
    if (this.savingFrame || !this.hasItems) return;
    this.savingFrame = true;
    const t = this.player.time;
    try {
      const { width, height } = this.outSize;
      const blob = await exportFrame(
        this.clips,
        this.edit,
        t,
        width,
        height,
        this.fit,
      );
      downloadBlob(
        blob,
        `${this.exportName} ${clock(t).replace(/:/g, '-')}.png`,
      );
    } catch (error) {
      console.error('Saving the frame failed:', error);
      this.toast.notify("Couldn't save this frame.");
    } finally {
      if (this.#live) this.savingFrame = false;
    }
  };

  /** Keeps the edit and settings soon after a change. */
  #keep() {
    if (!this.#restored) return;
    window.clearTimeout(this.#keepTimer);
    this.#keepTimer = window.setTimeout(() => {
      if (!this.#live) return;
      if (!this.clips.length) {
        void clearProject();
        return;
      }
      void saveState({
        version: 1,
        clips: this.clips.map(keepClip),
        edit: this.edit,
        settings: this.#settings,
        savedAt: Date.now(),
      }).catch(() => this.#noRoom());
    }, keepDelay);
  }

  #keepFile(clip: Clip) {
    saveFile(clip.id, clip.file).catch(() => this.#noRoom());
  }

  #noRoom() {
    if (this.#full) return;
    this.#full = true;
    this.toast.notify(
      'This browser has no room to keep the edit. Export it before you close the tab.',
    );
  }

  openNew = () => (this.newOpen = true);
  closeNew = () => (this.newOpen = false);

  /** Starts over: every file and the kept edit go. */
  startOver = () => {
    this.newOpen = false;
    this.player.stop();
    for (const clip of this.clips) {
      URL.revokeObjectURL(clip.url);
      release(clip.frames);
    }
    this.clips = [];
    this.selected = null;
    this.clearMarks();
    this.history.clear();
    this.#commit(emptyEdit(), false);
    void clearProject();
    this.#full = false;
  };

  willDestroy() {
    super.willDestroy();
    if (this.#rec) {
      cancelAnimationFrame(this.#rec.frame);
      this.#rec.recorder.stop();
      this.#rec.stream.getTracks().forEach((track) => track.stop());
      void this.#rec.context.close();
      this.#rec = null;
    }
    // what changed in the last moment is kept now
    if (this.#restored && this.clips.length) {
      window.clearTimeout(this.#keepTimer);
      void saveState({
        version: 1,
        clips: this.clips.map(keepClip),
        edit: this.edit,
        settings: this.#settings,
        savedAt: Date.now(),
      }).catch(() => undefined);
    }
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
    return (
      this.edit.pieces.length > 0 ||
      this.edit.audio.length > 0 ||
      this.edit.layers.length > 0
    );
  }

  get empty() {
    return !this.hasItems;
  }

  get length() {
    return editLength(this.edit);
  }

  get aspect() {
    const video = this.clips.filter((clip) => clip.kind !== 'audio');
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
    if (!s || s.kind === 'layer') return null;
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
    return !this.chosen && !this.chosenLayer;
  }

  /** Something is selected: a clip, a sound or a layer. */
  get anyChosen() {
    return !this.nothingChosen;
  }

  // ----- the selected text or overlay -----

  get chosenLayer(): Layer | null {
    const s = this.selected;
    return s?.kind === 'layer'
      ? (this.edit.layers.find((l) => l.id === s.id) ?? null)
      : null;
  }

  get chosenLayerClip(): Clip | undefined {
    return this.clipMap.get(this.chosenLayer?.clip ?? '');
  }

  get layerStackIndex() {
    const layer = this.chosenLayer;
    return layer ? this.edit.layers.indexOf(layer) : -1;
  }

  get layerTab(): LayerTab {
    const tab = this.tabShown;
    return tab === 'style' || tab === 'anim' || tab === 'audio' ? tab : 'edit';
  }

  #layerName(layer: Layer) {
    switch (layer.kind) {
      case 'text':
        return layer.text.split('\n')[0] || 'Text';
      case 'emoji':
        return `Emoji ${layer.emoji}`;
      case 'shape':
        return SHAPE_NAMES[layer.shape];
      default:
        return this.clipMap.get(layer.clip ?? '')?.name ?? 'Picture';
    }
  }

  get headName() {
    const layer = this.chosenLayer;
    if (layer) return this.#layerName(layer);
    return this.chosen?.name ?? 'Project';
  }

  get headDetail() {
    const layer = this.chosenLayer;
    if (layer) {
      const where = layer.lane === 'text' ? 'Text' : 'Overlay';
      return `${where} · ${clock(layer.start)} – ${clock(layerEnd(layer))}`;
    }
    return this.chosen ? this.chosenDetail : this.summary;
  }

  /** Changes the selected layer; `live` keeps one history step for a drag or typing. */
  patchLayer = (change: Partial<Layer>, live: boolean) => {
    const layer = this.chosenLayer;
    if (!layer) return;
    this.#change(
      { layers: updateLayer(this.edit.layers, layer.id, change) },
      this.#liveRecord(live),
    );
  };

  /** Typing or a drag on a layer has ended: the next change is a step of its own. */
  endLive = () => (this.#dragging = false);

  restackLayer = (by: number) => {
    const layer = this.chosenLayer;
    if (layer)
      this.#change({ layers: restack(this.edit.layers, layer.id, by) });
  };

  /** A new layer, selected, with the playhead inside it. */
  #addLayer(layer: Layer, tab: TabId = 'edit') {
    this.#change({ layers: [...this.edit.layers, layer] });
    this.selected = { kind: 'layer', id: layer.id };
    this.tab = tab;
    if (this.player.time < layer.start || this.player.time >= layerEnd(layer))
      this.player.scrub(layer.start);
  }

  /** Where a new layer starts: the playhead, or the start once past the end. */
  get #layerStart() {
    const t = this.player.time;
    return t >= this.length - 0.05 ? 0 : t;
  }

  addText = (preset: TextPreset) =>
    this.#addLayer(textLayer(preset, this.#layerStart));

  addShape = (shape: ShapeKind) =>
    this.#addLayer(shapeLayer(shape, this.#layerStart), 'style');

  addEmoji = (emoji: string) =>
    this.#addLayer(emojiLayer(emoji, this.#layerStart), 'style');

  /** A photo or video from Media goes over the picture at the playhead. */
  addAsOverlay = (id: string) => {
    const clip = this.clipMap.get(id);
    if (clip && clip.kind !== 'audio')
      this.#addLayer(mediaLayer(clip, this.#layerStart), 'style');
  };

  /** Files dropped on the Overlay panel: read, then put over the picture. */
  addOverlayFiles = async (files: File[]) => {
    const before = new Set(this.clips.map((clip) => clip.id));
    await this.addFiles(files, true);
    const added = this.clips.filter(
      (clip) => !before.has(clip.id) && clip.kind !== 'audio',
    );
    const start = this.#layerStart;
    const layers = added.map((clip) => mediaLayer(clip, start));
    if (!layers.length) return;
    this.#change({ layers: [...this.edit.layers, ...layers] });
    this.selected = { kind: 'layer', id: layers[layers.length - 1]!.id };
    this.tab = 'style';
  };

  get textRows() {
    return this.edit.layers
      .filter((layer) => layer.lane === 'text')
      .map((layer) => this.#layerRow(layer));
  }

  get overlayRows() {
    return this.edit.layers
      .filter((layer) => layer.lane === 'overlay')
      .map((layer) => this.#layerRow(layer));
  }

  #layerRow(layer: Layer) {
    const s = this.selected;
    return {
      id: layer.id,
      name: this.#layerName(layer),
      detail: `${clock(layer.start)} – ${clock(layerEnd(layer))}`,
      on: s?.kind === 'layer' && s.id === layer.id,
    };
  }

  get overlayClips() {
    return this.clipRows.filter((row) => row.isVideo);
  }

  pickLayer = (id: string) => {
    const layer = this.edit.layers.find((l) => l.id === id);
    if (!layer) return;
    this.selected = { kind: 'layer', id };
    if (this.player.time < layer.start || this.player.time >= layerEnd(layer))
      this.player.scrub(layer.start);
  };

  /** A layer picked on the preview; null picks nothing. */
  pickOnFrame = (id: string | null) => {
    if (id) this.selected = { kind: 'layer', id };
    else if (this.selected?.kind === 'layer') this.selected = null;
  };

  frameBegin = () => {
    this.history.record(this.edit);
    this.#syncHistory();
  };

  frameChange = (id: string, change: Partial<Layer>) =>
    this.#change({ layers: updateLayer(this.edit.layers, id, change) }, false);

  frameEnd = () => undefined;

  moveLayerTo = (id: string, start: number) => {
    this.#change({ layers: moveLayer(this.edit.layers, id, start) });
    this.selected = { kind: 'layer', id };
  };

  trimLayerTo = (id: string, start: number, end: number) => {
    const layer = this.edit.layers.find((l) => l.id === id);
    if (!layer) return;
    const clip = this.clipMap.get(layer.clip ?? '');
    this.#change(
      {
        layers: trimLayer(
          this.edit.layers,
          id,
          start,
          end,
          layer.kind === 'video' ? (clip?.duration ?? null) : null,
        ),
      },
      false,
    );
  };

  // ----- transitions -----

  /** The selected piece's place, when it has one before it to come in from. */
  get transitionIndex() {
    return this.selectedIndex > 0 ? this.selectedIndex : -1;
  }

  get transition() {
    return this.chosenPiece?.transition ?? { kind: 'none', seconds: 1 };
  }

  get transitionKindIndex() {
    return TRANSITION_IDS.indexOf(this.transition.kind);
  }

  get transitionOff() {
    return this.transition.kind === 'none';
  }

  /** The longest the selected piece's transition can be. */
  get transitionMax() {
    const index = this.transitionIndex;
    if (index < 0) return 0.1;
    const lengths = [index - 1, index].map((i) => {
      const piece = this.pieces[i]!;
      return (piece.out - piece.in) / (piece.speed || 1);
    });
    return Math.max(0.1, Math.min(...lengths) / 2);
  }

  get transitionShown() {
    const index = this.transitionIndex;
    return index > 0 ? overlapOf(this.pieces, index) : 0;
  }

  pickTransition = (index: number) => {
    const kind = TRANSITION_IDS[index];
    if (kind) this.#setPiece({ transition: { ...this.transition, kind } });
  };

  setTransitionSeconds = (seconds: number, dragging: boolean) =>
    this.#setPiece(
      { transition: { ...this.transition, seconds } },
      this.#liveRecord(dragging),
    );

  /**
   * The bar's Transition button: the selected clip's join, or the next join
   * after the playhead; a dissolve goes on when it has none.
   */
  get transitionTarget(): number {
    if (this.transitionIndex > 0) return this.transitionIndex;
    const t = this.player.time;
    const begins = starts(this.pieces);
    const next = begins.findIndex((start, i) => i > 0 && start >= t - 0.01);
    if (next > 0) return next;
    return this.pieces.length > 1 ? this.pieces.length - 1 : -1;
  }

  get cannotTransition() {
    return this.transitionTarget < 0;
  }

  addTransition = () => {
    const index = this.transitionTarget;
    const piece = this.pieces[index];
    if (!piece) return;
    if (piece.transition.kind === 'none')
      this.#change({
        pieces: update(this.pieces, piece.id, {
          transition: { kind: 'dissolve', seconds: 1 },
        }),
      });
    this.selected = { kind: 'video', id: piece.id };
    this.tab = 'transition';
  };

  /** A join's mark on the timeline: its transition opens. */
  openJoin = (id: string) => {
    this.selected = { kind: 'video', id };
    this.tab = 'transition';
  };

  get chosenLayerId() {
    return this.chosenLayer?.id ?? null;
  }

  // ----- social presets -----

  @tracked presetIndex = -1;

  get presetIndexShown() {
    return this.presetIndex >= 0 ? this.presetIndex : null;
  }

  pickPreset = (index: number) => {
    const preset = PRESETS[index];
    if (!preset) return;
    this.#setting(() => {
      this.presetIndex = index;
      this.shapeIndex = preset.shape;
      this.sizeShort = 1080;
    });
  };

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
    if (s?.kind === 'layer') {
      const layer = this.chosenLayer;
      if (
        layer &&
        t - layer.start >= minimumPiece &&
        layerEnd(layer) - t >= minimumPiece
      )
        return s;
    }
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
    const { pieces, audio, layers } = this.edit;
    const parts = [
      pieces.length ? `${pieces.length} video` : null,
      audio.length
        ? `${audio.length} sound${audio.length === 1 ? '' : 's'}`
        : null,
      layers.length
        ? `${layers.length} text and overlay${layers.length === 1 ? '' : 's'}`
        : null,
      tc(this.length),
    ];
    return parts.filter(Boolean).join(' · ');
  }

  get clipRows() {
    // cleaned copies stay out of sight: they follow their original
    return this.clips
      .filter((clip) => !clip.cleanOf && !clip.reverseOf)
      .map((clip) => ({
        clip,
        isVideo: clip.kind !== 'audio',
        thumb: clip.frames[0] ?? null,
        detail: (clip.kind === 'video'
          ? [
              `${clip.width} × ${clip.height}`,
              formatFps(clip.fps),
              tc(clip.duration),
              clip.hasAudio ? null : 'no sound',
            ]
          : clip.kind === 'image'
            ? ['Photo', `${clip.width} × ${clip.height}`]
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
    const items: { id: string }[] =
      s?.kind === 'video'
        ? next.pieces
        : s?.kind === 'layer'
          ? next.layers
          : next.audio;
    if (s && !items.some((i) => i.id === s.id)) this.selected = null;
    this.#syncHistory();
    this.#stale();
    this.player.shape(this.outAspect, this.fit);
    this.player.load(this.clips, next);
    this.#keep();
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
      this.clips.find((clip) => clip.kind !== 'audio')
    );
  }

  /** Width over height of the exported frame. */
  get outAspect() {
    const ratio = SHAPES[this.shapeIndex]?.ratio;
    if (ratio) return ratio;
    const first = this.firstVideo;
    return first?.width ? first.width / first.height : 16 / 9;
  }

  get exportKind(): ExportKind {
    return this.formatIndex === 2
      ? 'gif'
      : this.formatIndex === 3
        ? 'sound'
        : 'video';
  }

  get exportIsVideo() {
    return this.exportKind === 'video';
  }

  get exportIsGif() {
    return this.exportKind === 'gif';
  }

  get exportIsSound() {
    return this.exportKind === 'sound';
  }

  get showToDisk() {
    return this.canWriteToDisk && this.exportIsVideo;
  }

  get cannotPack() {
    return this.packing || this.empty;
  }

  get cannotSaveFrame() {
    return this.savingFrame || this.empty;
  }

  get can4k() {
    return !!this.encoders4k?.size;
  }

  /** The sizes on offer: 4K first where this browser can make it. */
  get sizeChoices(): number[] {
    return this.can4k ? [2160, ...SIZES] : SIZES;
  }

  get sizeLabels() {
    return this.sizeChoices.map(sizeLabel);
  }

  get sizeShortShown() {
    if (this.sizeChoices.includes(this.sizeShort)) return this.sizeShort;
    const first = this.firstVideo;
    const short = first?.width ? Math.min(first.width, first.height) : 1080;
    return short < 1080 ? 0 : 1080;
  }

  get sizeIndexShown() {
    return this.sizeChoices.indexOf(this.sizeShortShown);
  }

  #sized(short: number) {
    const aspect = this.outAspect;
    return aspect >= 1
      ? { width: even(short * aspect), height: even(short) }
      : { width: even(short), height: even(short / aspect) };
  }

  get gifSize() {
    return this.#sized(GIF_SIZES[this.gifSizeIndex] ?? 360);
  }

  get gifFps() {
    return GIF_RATES[this.gifRateIndex] ?? 15;
  }

  get soundFormat(): SoundFormat {
    return SOUND_FORMATS[this.soundFormatIndex] ?? 'mp3';
  }

  get outSize() {
    const first = this.firstVideo;
    const firstShort = first?.width
      ? Math.min(first.width, first.height)
      : 1080;
    const short = this.sizeShortShown || firstShort;
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
    const { width, height } = this.outSize;
    const encoders =
      Math.min(width, height) > 1440 ? this.encoders4k : this.encoders;
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

  get estimateBytes() {
    return (
      ((this.bitrate + (this.keepSound ? SOUND_BITS : 0)) * this.length) / 8
    );
  }

  get estimate() {
    if (!this.hasItems) return DASH;
    if (this.exportKind === 'gif') {
      const { width, height } = this.gifSize;
      const bytes = width * height * GIF_BYTES * this.gifFps * this.length;
      return `Roughly ${formatBytes(bytes)} · ${width} × ${height} · ${this.gifFps} fps · no sound`;
    }
    if (this.exportKind === 'sound') {
      const bytes =
        this.soundFormat === 'wav'
          ? 48000 * 4 * this.length
          : (SOUND_BITS * this.length) / 8;
      return `About ${formatBytes(bytes)} · ${tc(this.length)} · 48 kHz stereo`;
    }
    const { width, height } = this.outSize;
    return `About ${formatBytes(this.estimateBytes)} · ${width} × ${height} · ${this.outFps} fps`;
  }

  /** Whether this browser can write a file as it renders (Chrome, Edge). */
  get canWriteToDisk() {
    return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
  }

  /** The user's pick; null leaves it to the size. */
  @tracked toDiskChoice: boolean | null = null;

  get toDisk() {
    return (
      this.canWriteToDisk &&
      this.exportIsVideo &&
      (this.toDiskChoice ?? this.estimateBytes > diskBytes)
    );
  }

  pickToDisk = (on: boolean) => (this.toDiskChoice = on);

  /** The exported file: in memory, or read back from where it was written. */
  @tracked resultFile: File | null = null;
  /** The export went straight to a file the user picked. */
  @tracked savedToDisk = false;

  get cannotExport() {
    return this.busy || !this.hasItems || (this.exportIsVideo && !this.codec);
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
      detail: `${r.ext.toUpperCase()} · ${formatBytes(this.resultFile?.size ?? 0)} · ${tc(this.length)}${this.savedToDisk ? ' · saved' : ''}`,
    };
  }

  /** A change to the edit or the settings makes the last export stale. */
  #stale() {
    if (this.busy) this.cancelExport();
    this.failed = false;
    if (this.resultUrl) URL.revokeObjectURL(this.resultUrl);
    this.resultUrl = '';
    this.result = null;
    this.resultFile = null;
    this.savedToDisk = false;
  }

  #setting(apply: () => void) {
    apply();
    this.#keep();
    this.#stale();
    this.player.shape(this.outAspect, this.fit);
  }

  pickFormat = (i: number) => this.#setting(() => (this.formatIndex = i));
  pickCodec = (i: number) =>
    this.#setting(() => (this.codecChoice = this.codecs[i] ?? null));
  pickShape = (i: number) =>
    this.#setting(() => {
      this.shapeIndex = i;
      this.presetIndex = -1;
    });
  pickFit = (i: number) => this.#setting(() => (this.fitIndex = i));
  pickSize = (i: number) =>
    this.#setting(() => (this.sizeShort = this.sizeChoices[i] ?? -1));
  pickGifSize = (i: number) => this.#setting(() => (this.gifSizeIndex = i));
  pickGifRate = (i: number) => this.#setting(() => (this.gifRateIndex = i));
  pickSoundFormat = (i: number) =>
    this.#setting(() => (this.soundFormatIndex = i));
  pickRate = (i: number) => this.#setting(() => (this.rateIndex = i));
  pickQuality = (i: number) => this.#setting(() => (this.qualityIndex = i));
  pickSound = (on: boolean) => this.#setting(() => (this.keepSound = on));

  runExport = () => void this.#export();

  async #export() {
    const codec = this.codec ?? 'avc';
    if (this.cannotExport) return;
    const kind = this.exportKind;
    const job = ++this.#job;
    this.#stale();
    this.busy = true;
    this.progress = 0;
    this.player.pause();
    const abort = new AbortController();
    this.#abort = abort;
    const ext = this.container === 'webm' ? 'webm' : 'mp4';
    const name = `${this.exportName}.${ext}`;
    const onProgress = (fraction: number) => {
      if (job === this.#job) this.progress = fraction;
    };
    try {
      if (kind !== 'video') {
        const blob =
          kind === 'gif'
            ? await exportGif(this.clips, this.edit, {
                ...this.gifSize,
                fps: this.gifFps,
                fit: this.fit,
                signal: abort.signal,
                onProgress,
              })
            : await exportSound(this.clips, this.edit, {
                format: this.soundFormat,
                signal: abort.signal,
                onProgress,
              });
        if (job !== this.#job) return;
        const other = kind === 'gif' ? 'gif' : this.soundFormat;
        const file = new File([blob], `${this.exportName}.${other}`, {
          type: blob.type,
        });
        this.result = { blob, ext: other };
        this.resultFile = file;
        this.savedToDisk = false;
        this.resultUrl = URL.createObjectURL(file);
        return;
      }
      // the file is picked first, while the click still counts
      const handle = this.toDisk
        ? await (
            window as unknown as { showSaveFilePicker: SaveFilePicker }
          ).showSaveFilePicker({
            suggestedName: name,
            types: [
              {
                description: ext.toUpperCase(),
                accept: { [`video/${ext}`]: [`.${ext}`] },
              },
            ],
          })
        : null;
      const writable = handle ? await handle.createWritable() : undefined;
      const result = await exportEdit(this.clips, this.edit, {
        writable,
        container: this.container,
        codec,
        ...this.outSize,
        fps: this.outFps,
        fit: this.fit,
        bitrate: this.bitrate,
        sound: this.keepSound,
        signal: abort.signal,
        onProgress,
      });
      if (job !== this.#job) return;
      const file =
        handle && !result.blob
          ? await handle.getFile()
          : new File([result.blob!], name, { type: `video/${ext}` });
      if (job !== this.#job) return;
      this.result = result;
      this.resultFile = file;
      this.savedToDisk = !!handle;
      this.resultUrl = URL.createObjectURL(file);
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
    const file = this.resultFile;
    if (!file) return;
    if (this.savedToDisk) this.toast.notify(`Already saved as ${file.name}`);
    else downloadBlob(file, file.name);
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

  /** Reads files in; videos and photos join the track, unless they go over it. */
  addFiles = async (files: File[], asOverlay = false) => {
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
            : mediaKind(file) === 'image'
              ? await readImageClip(file)
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
    for (const clip of added) this.#keepFile(clip);
    let audio = this.edit.audio;
    for (const clip of added.filter((c) => c.kind === 'audio')) {
      audio = [
        ...audio,
        audioFor(clip, 'music', laneEnd(audio, 'music'), audio),
      ];
    }
    this.#change({
      pieces: asOverlay
        ? this.pieces
        : [
            ...this.pieces,
            ...added.filter((c) => c.kind !== 'audio').map(pieceFor),
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
    const gone = this.clips.filter(
      (c) => c.id === id || c.cleanOf === id || c.reverseOf === id,
    );
    const ids = new Set(gone.map((c) => c.id));
    for (const c of gone) void dropFile(c.id);
    this.clips = this.clips.filter((c) => !ids.has(c.id));
    // items of a gone file cannot come back
    this.history.clear();
    this.#change(
      {
        pieces: this.pieces.filter((piece) => !ids.has(piece.clip)),
        audio: this.edit.audio.filter((item) => !ids.has(item.clip)),
        layers: this.edit.layers.filter(
          (layer) => !layer.clip || !ids.has(layer.clip),
        ),
      },
      false,
    );
    for (const c of gone) {
      URL.revokeObjectURL(c.url);
      release(c.frames);
    }
  };

  addVideoAgain = (id: string) => {
    const clip = this.clipMap.get(id);
    if (clip) this.#change({ pieces: [...this.pieces, pieceFor(clip)] });
  };

  /** A Media row starts a drag onto the timeline. */
  dragClip = (clip: Clip, event: DragEvent) => {
    event.dataTransfer?.setData(`${CLIP_DRAG}${clip.kind}`, clip.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  };

  /** A Media file dropped on the timeline: where it lands is what it becomes. */
  dropClip = (id: string, lane: string, at: number, index: number) => {
    const clip = this.clipMap.get(id);
    if (!clip) return;
    if (lane === 'video' && clip.kind !== 'audio') {
      const piece = pieceFor(clip);
      const pieces = [...this.pieces];
      pieces.splice(Math.min(index, pieces.length), 0, piece);
      this.#change({ pieces });
      this.selected = { kind: 'video', id: piece.id };
    } else if (lane === 'overlay' && clip.kind !== 'audio') {
      this.#addLayer(mediaLayer(clip, at), 'style');
    } else if (
      (lane === 'music' || lane === 'voice') &&
      clip.kind === 'audio'
    ) {
      const item = audioFor(clip, lane, at, this.edit.audio);
      this.#change({ audio: [...this.edit.audio, item] });
      this.selected = { kind: 'audio', id: item.id };
    }
  };

  /** Each line of a subtitle file becomes a caption on the Text layer. */
  addCaptions = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const cues = parseSubtitles(await file.text()).filter(
      (cue) => cue.end > cue.start && cue.text.trim(),
    );
    if (!this.#live) return;
    if (!cues.length) {
      this.toast.notify(`No captions found in ${file.name}`);
      return;
    }
    this.#addCaptionLayers(cues);
  };

  /** Lines with their times become captions on the Text layer. */
  #addCaptionLayers(cues: Cue[]) {
    const layers = cues.map((cue) => ({
      ...textLayer('caption', cue.start / 1000),
      text: cue.text.trim(),
      length: Math.max(minimumPiece, (cue.end - cue.start) / 1000),
    }));
    if (!layers.length) return;
    this.#change({ layers: [...this.edit.layers, ...layers] });
    this.selected = { kind: 'layer', id: layers[0]!.id };
    this.tab = 'style';
    this.player.scrub(layers[0]!.start);
    this.toast.notify(
      `${layers.length} caption${layers.length === 1 ? '' : 's'} added`,
    );
  }

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
    if (target.kind === 'layer') {
      const layers = splitLayer(this.edit.layers, target.id, t);
      this.#change({ layers });
      const after = layers.find((l) => l.start === t && l.id !== target.id);
      if (after) this.selected = { kind: 'layer', id: after.id };
      return;
    }
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
    if (s.kind === 'layer') {
      this.#change({ layers: this.edit.layers.filter((l) => l.id !== s.id) });
      return;
    }
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
    } else if (s?.kind === 'layer') {
      const layers = duplicateLayer(this.edit.layers, s.id);
      this.#change({ layers });
      const copy = layers[layers.length - 1];
      if (copy) this.selected = { kind: 'layer', id: copy.id };
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

  /** The selected item's sound switch: on is not muted. */
  get chosenSoundOn() {
    return !this.chosen?.muted;
  }

  setSoundOn = (on: boolean) => this.#patch({ muted: !on });
  setFadeIn = (fadeIn: number) => this.#patch({ fadeIn });
  setFadeOut = (fadeOut: number) => this.#patch({ fadeOut });

  // ----- the selected clip's picture -----

  get chosenPiece(): Piece | null {
    const s = this.selected;
    return s?.kind === 'video'
      ? (this.pieces.find((p) => p.id === s.id) ?? null)
      : null;
  }

  get chosenIsPhoto() {
    const piece = this.chosenPiece;
    return !!piece && this.clipMap.get(piece.clip)?.kind === 'image';
  }

  get chosenHasTimes() {
    return !this.chosenIsPhoto;
  }

  get look(): Look {
    return this.chosenPiece?.look ?? plainLook();
  }

  get photoSeconds() {
    const piece = this.chosenPiece;
    return piece ? piece.out - piece.in : 0;
  }

  get speedIndex() {
    const speed = this.chosenPiece?.speed ?? 1;
    return SPEEDS.findIndex((s) => Math.abs(s - speed) < 0.001);
  }

  get filterIndex() {
    return FILTER_IDS.indexOf(this.look.filter);
  }

  get lookChanged() {
    return JSON.stringify(this.look) !== JSON.stringify(plainLook());
  }

  get lookPlain() {
    return !this.lookChanged;
  }

  /** One history step a slider drag; a tap or key is a step of its own. */
  #liveRecord(dragging: boolean) {
    const record = !this.#dragging;
    this.#dragging = dragging;
    return record;
  }

  #setPiece(change: Partial<Omit<Piece, 'id' | 'clip'>>, record = true) {
    const piece = this.chosenPiece;
    if (piece)
      this.#change({ pieces: update(this.pieces, piece.id, change) }, record);
  }

  #setLook(change: Partial<Look>, record = true) {
    this.#setPiece({ look: { ...this.look, ...change } }, record);
  }

  setPhotoSeconds = (seconds: number) => {
    const piece = this.chosenPiece;
    if (!piece) return;
    const length = Math.min(photoLimit, Math.max(minimumPiece, seconds));
    this.#setPiece({ out: piece.in + length });
  };

  pickSpeed = (index: number) => {
    const speed = SPEEDS[index];
    if (speed) this.#setPiece({ speed });
  };

  rotateLeft = () =>
    this.#setLook({
      rotate: ((this.look.rotate + 270) % 360) as Look['rotate'],
    });
  rotateRight = () =>
    this.#setLook({
      rotate: ((this.look.rotate + 90) % 360) as Look['rotate'],
    });
  flipH = () => this.#setLook({ flipH: !this.look.flipH });
  flipV = () => this.#setLook({ flipV: !this.look.flipV });

  setCrop = (side: keyof Look['crop'], value: number, dragging: boolean) =>
    this.#setLook(
      { crop: { ...this.look.crop, [side]: value } },
      this.#liveRecord(dragging),
    );

  setAdjust = (
    key: 'brightness' | 'contrast' | 'saturation',
    value: number,
    dragging: boolean,
  ) => this.#setLook({ [key]: value }, this.#liveRecord(dragging));

  pickFilter = (index: number) => {
    const filter = FILTER_IDS[index];
    if (filter) this.#setLook({ filter });
  };

  resetLook = () => this.#setPiece({ look: plainLook() });

  pickPieceAnim = (side: AnimSide, anim: Anim) =>
    this.#setPiece(side === 'in' ? { animIn: anim } : { animOut: anim });

  setPieceAnimSeconds = (animSeconds: number, dragging: boolean) =>
    this.#setPiece({ animSeconds }, this.#liveRecord(dragging));

  setEffect = (key: 'vignette' | 'blur', value: number, dragging: boolean) =>
    this.#setLook({ [key]: value }, this.#liveRecord(dragging));

  get motionIndex() {
    return MOTION_IDS.indexOf(this.look.motion.kind);
  }

  get motionOn() {
    return this.look.motion.kind !== 'none';
  }

  setMotionOn = (on: boolean) =>
    this.#setLook({
      motion: { ...this.look.motion, kind: on ? 'in' : 'none' },
    });

  pickMotion = (index: number) => {
    const kind = MOTION_IDS[index];
    if (kind) this.#setLook({ motion: { ...this.look.motion, kind } });
  };

  setMotionAmount = (amount: number, dragging: boolean) =>
    this.#setLook(
      { motion: { ...this.look.motion, amount } },
      this.#liveRecord(dragging),
    );

  @tracked reversing = false;
  @tracked reverseProgress = 0;
  @tracked freezing = false;
  #reverseAbort: AbortController | null = null;

  get chosenClip(): Clip | undefined {
    return this.clipMap.get(this.chosenPiece?.clip ?? '');
  }

  get chosenIsReversed() {
    return !!this.chosenClip?.reverseOf;
  }

  get reverseText() {
    return `Reversing… ${Math.round(this.reverseProgress * 100)}%`;
  }

  /** Swaps a piece to the same stretch of another copy of its clip. */
  #swapClip(piece: Piece, to: Clip, from: Clip) {
    const length = Math.min(to.duration, from.duration);
    const inAt = Math.max(0, Math.min(length, from.duration - piece.out));
    const outAt = Math.max(inAt + minimumPiece, from.duration - piece.in);
    this.#change({
      pieces: this.pieces.map((p) =>
        p.id === piece.id
          ? { ...p, clip: to.id, in: inAt, out: Math.min(to.duration, outAt) }
          : p,
      ),
    });
  }

  /** Plays the piece backwards: its clip is swapped for a reversed copy. */
  toggleReverse = async () => {
    const piece = this.chosenPiece;
    const clip = this.chosenClip;
    if (!piece || !clip || clip.kind !== 'video' || this.reversing) return;
    if (clip.reverseOf) {
      const original = this.clipMap.get(clip.reverseOf);
      if (original) this.#swapClip(piece, original, clip);
      return;
    }
    let reversed = this.clips.find((c) => c.reverseOf === clip.id);
    if (!reversed) {
      if (clip.duration > reverseLimit) {
        this.toast.notify('Clips up to 10 minutes can be reversed.');
        return;
      }
      this.reversing = true;
      this.reverseProgress = 0;
      const abort = new AbortController();
      this.#reverseAbort = abort;
      try {
        const file = await reverseClip(
          clip,
          (fraction) => (this.reverseProgress = fraction),
          abort.signal,
        );
        const read = await readClip(file);
        if (!this.#live) return URL.revokeObjectURL(read.url);
        reversed = {
          ...read,
          name: `${clip.name} (reversed)`,
          reverseOf: clip.id,
        };
        this.clips = [...this.clips, reversed];
        this.#keepFile(reversed);
        void this.#describe(reversed);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Reversing failed:', error);
          this.toast.notify("Couldn't reverse this clip.");
        }
        return;
      } finally {
        if (this.#reverseAbort === abort) this.#reverseAbort = null;
        if (this.#live) this.reversing = false;
      }
    }
    const now = this.pieces.find((p) => p.id === piece.id);
    if (now && now.clip === clip.id) this.#swapClip(now, reversed, clip);
  };

  cancelReverse = () => this.#reverseAbort?.abort();

  /** Holds the frame at the playhead as a still, in the middle of the piece. */
  freezeFrame = async () => {
    const piece = this.chosenPiece;
    const clip = this.chosenClip;
    if (!piece || !clip || clip.kind !== 'video' || this.freezing) return;
    const t = this.player.time;
    const place = placeAt(this.pieces, t);
    if (place?.piece.id !== piece.id) {
      this.toast.notify('Put the playhead on this clip first.');
      return;
    }
    this.freezing = true;
    try {
      const file = await clipStill(clip, place.clipTime);
      const still = await readImageClip(file);
      if (!this.#live) return URL.revokeObjectURL(still.url);
      this.clips = [...this.clips, still];
      this.#keepFile(still);
      const parts = split(this.pieces, t);
      // a playhead too near an edge does not cut: the still goes before or after
      const cut = parts.length > this.pieces.length;
      const nearEnd = piece.out - place.clipTime < place.clipTime - piece.in;
      const at = place.index + (cut || nearEnd ? 1 : 0);
      const frozen: Piece = {
        ...pieceFor(still),
        out: freezeSeconds,
        look: { ...piece.look, motion: plainMotion() },
      };
      this.#change({
        pieces: [...parts.slice(0, at), frozen, ...parts.slice(at)],
      });
      this.selected = { kind: 'video', id: frozen.id };
    } catch (error) {
      console.error('Freeze frame failed:', error);
      this.toast.notify("Couldn't take this frame.");
    } finally {
      if (this.#live) this.freezing = false;
    }
  };

  // ----- background -----

  get backgroundIndex() {
    return BACKGROUNDS.indexOf(this.edit.background.kind);
  }

  get backgroundIsColour() {
    return this.edit.background.kind === 'colour';
  }

  pickBackground = (index: number) => {
    const kind = BACKGROUNDS[index];
    if (kind) this.#change({ background: { ...this.edit.background, kind } });
  };

  get backgroundRgb(): Rgb {
    return parseHex(this.edit.background.colour) ?? [0, 0, 0];
  }

  setBackgroundColour = (colour: Rgb) =>
    this.#change({
      background: { ...this.edit.background, colour: hex(colour) },
    });

  setLevel = (key: Layered, change: Partial<Level>, dragging = false) => {
    const record = !this.#dragging;
    this.#dragging = dragging;
    const mix = {
      ...this.edit.mix,
      [key]: { ...this.edit.mix[key], ...change },
    };
    this.#change({ mix }, record);
  };

  levelVolume = (key: Layered, volume: number, dragging: boolean) =>
    this.setLevel(key, { volume }, dragging);

  /** The switch reads "on": a layer that plays. */
  levelOn = (key: Layered, on: boolean) => this.setLevel(key, { muted: !on });

  // ----- ducking -----

  get duck() {
    return this.edit.mix.duck;
  }

  setDuckLevel = (level: number, dragging: boolean) => {
    const record = !this.#dragging;
    this.#dragging = dragging;
    this.#change(
      { mix: { ...this.edit.mix, duck: { ...this.duck, level } } },
      record,
    );
  };

  setDuckOn = (on: boolean) =>
    this.#change({ mix: { ...this.edit.mix, duck: { ...this.duck, on } } });

  // ----- recording a voice-over -----

  @tracked recording = false;
  @tracked recordLevel = 0;
  @tracked recordSeconds = 0;
  @tracked playWhileRecording = true;
  #rec: {
    recorder: MediaRecorder;
    stream: MediaStream;
    chunks: Blob[];
    start: number;
    context: AudioContext;
    frame: number;
  } | null = null;

  get recordText() {
    return recordClock(this.recordSeconds);
  }

  get recordMeterStyle() {
    return htmlSafe(`inline-size: ${Math.round(this.recordLevel * 100)}%`);
  }

  pickPlayWhileRecording = (on: boolean) => (this.playWhileRecording = on);

  startRecording = async () => {
    if (this.recording || this.#rec) return;
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      this.toast.notify('This browser cannot record sound.');
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch {
      this.toast.notify(
        'The microphone is blocked. Allow it in the address bar, then try again.',
      );
      return;
    }
    if (!this.#live) return stream.getTracks().forEach((t) => t.stop());
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(
      (type) => MediaRecorder.isTypeSupported(type),
    );
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      this.toast.notify('This browser cannot record sound.');
      return;
    }
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    // a level meter, so the user sees the microphone hears them
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    context.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    const start = this.player.time;
    const began = performance.now();
    const rec = { recorder, stream, chunks, start, context, frame: 0 };
    const tick = () => {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const v of samples) sum += v * v;
      this.recordLevel = Math.min(1, Math.sqrt(sum / samples.length) * 5);
      this.recordSeconds = (performance.now() - began) / 1000;
      rec.frame = requestAnimationFrame(tick);
    };
    this.#rec = rec;
    this.recording = true;
    recorder.start(250);
    tick();
    if (this.playWhileRecording && this.hasItems && start < this.length) {
      this.player.scrub(start);
      this.player.play();
    }
  };

  stopRecording = async () => {
    const rec = this.#rec;
    if (!rec) return;
    this.#rec = null;
    cancelAnimationFrame(rec.frame);
    const stopped = new Promise((resolve) => (rec.recorder.onstop = resolve));
    rec.recorder.stop();
    await stopped;
    rec.stream.getTracks().forEach((track) => track.stop());
    void rec.context.close();
    this.player.pause();
    this.recording = false;
    this.recordLevel = 0;
    if (!this.#live) return;
    const blob = new Blob(rec.chunks, {
      type: rec.recorder.mimeType || 'audio/webm',
    });
    try {
      // kept as WAV, which every part of the editor reads exactly
      const decoder = new AudioContext();
      const buffer = await decoder
        .decodeAudioData(await blob.arrayBuffer())
        .finally(() => void decoder.close());
      const take =
        this.clips.filter((clip) => /^Voice \d+$/.test(clip.name)).length + 1;
      const file = new File(
        [encodeWav(channelsOf(buffer), buffer.sampleRate)],
        `Voice ${take}.wav`,
        { type: 'audio/wav' },
      );
      const clip = await readAudioClip(file);
      if (!this.#live) return URL.revokeObjectURL(clip.url);
      this.clips = [...this.clips, clip];
      this.#keepFile(clip);
      const item = audioFor(clip, 'voice', rec.start, this.edit.audio);
      this.#change({ audio: [...this.edit.audio, item] });
      this.selected = { kind: 'audio', id: item.id };
      void this.#describe(clip);
    } catch (error) {
      console.error('Recording failed:', error);
      this.toast.notify("Couldn't keep that recording. Try again.");
    }
  };

  // ----- subtitles from speech -----

  @tracked hearing = false;
  @tracked hearText = '';
  @tracked hearModeIndex = 0;
  @tracked hearLanguage = '';

  get hearModel() {
    const spec = MODELS[HEAR_MODES[this.hearModeIndex] ?? 'fast'];
    const mb = spec.sizeMb[hasGpu() ? 'webgpu' : 'wasm'];
    return `${spec.name} · downloads once, ${mb} MB`;
  }

  get hearLanguages() {
    return LANGUAGES.map((l) => ({
      ...l,
      on: l.code === this.hearLanguage,
    }));
  }

  get cannotHear() {
    return this.hearing || !this.hasItems;
  }

  pickHearMode = (index: number) => (this.hearModeIndex = index);

  pickHearLanguage = (event: Event) =>
    (this.hearLanguage = (event.target as HTMLSelectElement).value);

  /** Whisper hears the edit's speech; each line becomes a caption. */
  writeSubtitles = async () => {
    if (this.cannotHear) return;
    this.hearing = true;
    this.hearText = 'Gathering the speech…';
    try {
      const pcm = await mixSpeech(this.clips, this.edit, (fraction) => {
        this.hearText = `Gathering the speech… ${Math.round(fraction * 100)}%`;
      });
      if (!this.#live) return;
      this.hearText = 'Loading Whisper…';
      const { transcribeWords, wordsToCues } =
        await import('xsenze-tools/lib/ai/transcribe');
      const words = await transcribeWords(pcm, {
        mode: HEAR_MODES[this.hearModeIndex] ?? 'fast',
        language: this.hearLanguage || undefined,
        onProgress: (percent) => {
          if (this.#live) this.hearText = `Listening… ${Math.round(percent)}%`;
        },
      });
      if (!this.#live) return;
      const cues = spokenCues(
        wordsToCues(spokenWords(words)),
        pcm.length / 16000,
      );
      if (!cues.length) this.toast.notify('No speech found in the edit');
      else this.#addCaptionLayers(cues);
    } catch (error) {
      console.error('Subtitles failed:', error);
      if (this.#live)
        this.toast.notify(
          "Couldn't write subtitles. Try Rough, or Chrome or Edge.",
        );
    } finally {
      if (this.#live) {
        this.hearing = false;
        this.hearText = '';
      }
    }
  };

  // ----- detaching a video's sound -----

  get canDetach() {
    const piece = this.chosenPiece;
    const clip = piece && this.clipMap.get(piece.clip);
    return !!clip && clip.kind === 'video' && clip.hasAudio;
  }

  get cannotDetach() {
    return !this.canDetach;
  }

  /** The selected clip's sound moves onto Voice (or Music) as its own item. */
  detachSound = () => {
    const piece = this.chosenPiece;
    if (!piece || !this.canDetach) return;
    if (Math.abs((piece.speed || 1) - 1) > 0.001) {
      this.toast.notify('Set the speed to 1× first, then detach the sound.');
      return;
    }
    const index = this.pieces.indexOf(piece);
    const start = starts(this.pieces)[index] ?? 0;
    const length = lengthOf(piece);
    const audio = this.edit.audio;
    const lane: Lane | null = laneFree(audio, 'voice', start, length)
      ? 'voice'
      : laneFree(audio, 'music', start, length)
        ? 'music'
        : null;
    if (!lane) {
      this.toast.notify('Make room on Voice or Music under this clip first.');
      return;
    }
    const item: AudioItem = {
      id: newId('a'),
      clip: piece.clip,
      lane,
      start,
      in: piece.in,
      out: piece.out,
      volume: piece.muted ? 1 : piece.volume,
      muted: false,
      fadeIn: piece.fadeIn,
      fadeOut: piece.fadeOut,
    };
    this.#change({
      pieces: update(this.pieces, piece.id, { muted: true }),
      audio: [...audio, item],
    });
    this.selected = { kind: 'audio', id: item.id };
    this.tab = 'audio';
    this.toast.notify(
      `The sound is now on ${lane === 'voice' ? 'Voice' : 'Music'}`,
    );
  };

  // ----- noise reduction -----

  @tracked cleaning = false;

  get chosenItem(): AudioItem | null {
    const s = this.selected;
    return s?.kind === 'audio'
      ? (this.edit.audio.find((a) => a.id === s.id) ?? null)
      : null;
  }

  get cleanIndex() {
    const clip = this.clipMap.get(this.chosenItem?.clip ?? '');
    if (!clip?.cleanOf) return 0;
    return (clip.cleanLevel ?? 1) >= 1 ? 2 : 1;
  }

  pickClean = async (index: number) => {
    const item = this.chosenItem;
    const current = item && this.clipMap.get(item.clip);
    if (!item || !current || this.cleaning) return;
    const original = current.cleanOf
      ? this.clipMap.get(current.cleanOf)
      : current;
    if (!original) return;
    const level = CLEAN_LEVELS[index] ?? 0;
    const use = (clipId: string) =>
      this.#change({
        audio: this.edit.audio.map((a) =>
          a.id === item.id ? { ...a, clip: clipId } : a,
        ),
      });
    if (!level) return use(original.id);
    let cleaned = this.clips.find(
      (c) => c.cleanOf === original.id && c.cleanLevel === level,
    );
    if (!cleaned) {
      if (original.file.size > cleanLimit) {
        this.toast.notify('This file is too large to clean here.');
        return;
      }
      this.cleaning = true;
      try {
        const decoder = new AudioContext();
        const buffer = await decoder
          .decodeAudioData(await original.file.arrayBuffer())
          .finally(() => void decoder.close());
        const out = await denoise(buffer, level);
        const name = `${original.name} (clean)`;
        const file = new File(
          [encodeWav(channelsOf(out), out.sampleRate)],
          `${name}.wav`,
          { type: 'audio/wav' },
        );
        const clip = await readAudioClip(file);
        if (!this.#live) return URL.revokeObjectURL(clip.url);
        cleaned = { ...clip, name, cleanOf: original.id, cleanLevel: level };
        this.clips = [...this.clips, cleaned];
        this.#keepFile(cleaned);
        void this.#describe(cleaned);
      } catch (error) {
        console.error('Noise reduction failed:', error);
        this.toast.notify("Couldn't clean this sound.");
        return;
      } finally {
        if (this.#live) this.cleaning = false;
      }
    }
    if (this.edit.audio.some((a) => a.id === item.id)) use(cleaned.id);
  };

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
      layers: cutRangeLayers(this.edit.layers, range[0], range[1]),
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

  // ----- layout: tool rail, panel, tabs, export dialog -----

  @tracked tool: ToolId = 'media';
  @tracked panelOpen = true;
  @tracked tab: TabId = 'edit';
  @tracked exportOpen = false;
  /** The preview area's size in px, for the canvas at the frame's shape. */
  @tracked stageW = 0;
  @tracked stageH = 0;

  get toolButtons() {
    return TOOLS.map((t) => ({
      ...t,
      on: this.panelOpen && t.id === this.tool,
    }));
  }

  get #tool() {
    return TOOLS.find((t) => t.id === this.tool) ?? TOOLS[0]!;
  }

  get toolLabel() {
    return this.#tool.label;
  }

  get toolIsText() {
    return this.tool === 'text';
  }

  get toolIsOverlay() {
    return this.tool === 'overlay';
  }

  get toolIsMedia() {
    return this.tool === 'media';
  }

  get toolIsAudio() {
    return this.tool === 'audio';
  }

  get toolIsCanvas() {
    return this.tool === 'canvas';
  }

  /** A rail icon opens its panel; the open one's icon closes it. */
  pickTool = (id: ToolId) => {
    if (id === this.tool && this.panelOpen) {
      this.panelOpen = false;
      return;
    }
    this.tool = id;
    this.panelOpen = true;
  };

  closePanel = () => (this.panelOpen = false);

  /** The tabs the selected item has. */
  get tabs(): TabId[] {
    const layer = this.chosenLayer;
    if (layer) {
      const sound =
        layer.kind === 'video' && this.chosenLayerClip?.hasAudio !== false;
      return sound
        ? ['edit', 'style', 'anim', 'audio']
        : ['edit', 'style', 'anim'];
    }
    const c = this.chosen;
    if (!c) return [];
    if (c.kind === 'audio') return ['edit', 'audio'];
    const tabs: TabId[] = this.chosenIsPhoto
      ? ['edit', 'adjust', 'anim']
      : ['edit', 'adjust', 'anim', 'audio'];
    return this.transitionIndex > 0 ? [...tabs, 'transition'] : tabs;
  }

  get tabIsTransition() {
    return this.tabShown === 'transition';
  }

  /** The tab on show: the chosen one when the item has it. */
  get tabShown(): TabId {
    return this.tabs.includes(this.tab) ? this.tab : 'edit';
  }

  get tabButtons() {
    return this.tabs.map((id) => ({
      id,
      label: TAB_LABELS[id],
      on: id === this.tabShown,
    }));
  }

  get tabIsEdit() {
    return this.tabShown === 'edit';
  }

  get tabIsAdjust() {
    return this.tabShown === 'adjust';
  }

  get tabIsAnim() {
    return this.tabShown === 'anim';
  }

  pickTab = (id: TabId) => (this.tab = id);

  openExport = () => (this.exportOpen = true);
  closeExport = () => (this.exportOpen = false);

  get shapeLabel() {
    const preset = PRESETS[this.presetIndex];
    const shape = SHAPE_LABELS[this.shapeIndex] ?? '';
    return preset ? `${preset.label} · ${shape}` : shape;
  }

  get fitLabel() {
    return FIT_LABELS[this.fitIndex] ?? '';
  }

  get sizeText() {
    const { width, height } = this.outSize;
    return `${width} × ${height} · ${this.outFps} fps`;
  }

  get timeText() {
    return clock(this.player.time);
  }

  get lengthText() {
    return clock(this.length);
  }

  get notActive() {
    return !this.player.active;
  }

  get markInShort() {
    return this.markIn === null ? '' : clock(this.markIn);
  }

  get markOutShort() {
    return this.markOut === null ? '' : clock(this.markOut);
  }

  get cropRows() {
    const crop = this.look.crop;
    return (['left', 'right', 'top', 'bottom'] as const).map((side) => ({
      side,
      label: side[0]!.toUpperCase() + side.slice(1),
      value: crop[side],
    }));
  }

  get adjustRows() {
    const look = this.look;
    return (
      [
        ['brightness', 'Brightness'],
        ['contrast', 'Contrast'],
        ['saturation', 'Saturation'],
      ] as const
    ).map(([key, label]) => ({ key, label, value: look[key] }));
  }

  /** The canvas at the frame's shape, as large as the preview area allows. */
  get canvasStyle() {
    const W = this.stageW;
    const H = this.stageH;
    if (!W || !H) return htmlSafe('');
    const aspect = this.outAspect;
    const width = Math.min(W, H * aspect);
    return htmlSafe(
      `width: ${Math.floor(width)}px; height: ${Math.floor(width / aspect)}px`,
    );
  }

  measureStage = modifier((box: HTMLElement) => {
    const observer = new ResizeObserver(() => {
      const style = getComputedStyle(box);
      this.stageW =
        box.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      this.stageH =
        box.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
    });
    observer.observe(box);
    return () => observer.disconnect();
  });

  <template>
    <PageTools>
      <button
        type="button"
        class="xz-btn xz-btn--ghost xz-btn--icon ve-new"
        aria-label="Start a new edit"
        title="Start a new edit"
        disabled={{this.empty}}
        {{on "click" this.openNew}}
      ><IconSvg @name="file-plus" /></button>
      <label
        class="xz-btn xz-btn--ghost xz-btn--icon ve-project-open"
        title="Open a project file"
      >
        <IconSvg @name="folder-open" />
        <span class="sr-only">Open a project file</span>
        <input
          type="file"
          class="sr-only"
          accept=".zip,application/zip"
          disabled={{this.packing}}
          {{on "change" this.pickProjectFile}}
        />
      </label>
      <button
        type="button"
        class="xz-btn xz-btn--ghost xz-btn--icon ve-project-save"
        aria-label="Save a project file"
        title="Save a project file: the edit and its media, to open on any device"
        disabled={{this.cannotPack}}
        {{on "click" this.saveProject}}
      ><IconSvg @name="save" /></button>
      <button
        type="button"
        class="xz-btn xz-btn--ghost xz-btn--icon"
        aria-label="Undo"
        title="Undo (Ctrl Z)"
        disabled={{this.cannotUndo}}
        {{on "click" this.undo}}
      ><IconSvg @name="undo-2" /></button>
      <button
        type="button"
        class="xz-btn xz-btn--ghost xz-btn--icon"
        aria-label="Redo"
        title="Redo (Ctrl Y)"
        disabled={{this.cannotRedo}}
        {{on "click" this.redo}}
      ><IconSvg @name="redo-2" /></button>
      <button
        type="button"
        class="xz-btn xz-btn--primary ve-export-open"
        aria-label="Export"
        disabled={{this.empty}}
        {{on "click" this.openExport}}
      >
        <IconSvg @name="download" />
        <span class="ve-export-open__text">Export</span>
      </button>
    </PageTools>

    <div
      class="ve {{if this.panelOpen 've--panel'}}"
      {{this.keys}}
      {{on "dragover" this.drop.enter}}
      {{on "dragleave" this.drop.leave}}
      {{on "drop" this.drop.drop}}
    >
      {{! ----- tool rail ----- }}
      <nav class="ve-rail" aria-label="Editor tools">
        {{#each this.toolButtons as |tool|}}
          <button
            type="button"
            class="ve-rail__tool {{if tool.on 'is-on'}}"
            aria-pressed={{if tool.on "true" "false"}}
            {{on "click" (fn this.pickTool tool.id)}}
          >
            <IconSvg @name={{tool.icon}} />
            <span>{{tool.label}}</span>
          </button>
        {{/each}}
      </nav>

      {{! ----- tool panel ----- }}
      {{#if this.panelOpen}}
        <section class="ve-panel" aria-label={{this.toolLabel}}>
          <header class="ve-head">
            <h2>{{this.toolLabel}}</h2>
            <button
              type="button"
              class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm"
              aria-label="Close the panel"
              title="Close the panel"
              {{on "click" this.closePanel}}
            ><IconSvg @name="x" /></button>
          </header>
          <div class="ve-panel__body">
            {{#if this.toolIsMedia}}
              <XzDropZone
                class="ve-drop-zone"
                @prompt="Drop videos, photos and sounds here, or press Files"
                @icon={{FilmIcon}}
                @accept={{ACCEPT}}
                @multiple={{true}}
                @onFiles={{this.addFiles}}
              />
              {{#if this.reading}}
                <XzStatus @text={{this.readingText}} @tone="muted" />
              {{/if}}
              {{#if this.problems.length}}
                <XzStatus @text={{this.problemText}} @tone="warn" />
              {{/if}}
              {{#if this.clipRows.length}}
                <ul class="ve-media">
                  {{#each this.clipRows as |row|}}
                    <li
                      class="ve-clip"
                      draggable="true"
                      title="Drag onto the timeline"
                      {{on "dragstart" (fn this.dragClip row.clip)}}
                    >
                      <div
                        class="ve-clip__thumb
                          {{if row.isVideo '' 've-clip__thumb--sound'}}"
                      >
                        {{#if row.thumb}}
                          <img src={{row.thumb}} alt="" />
                        {{else}}
                          <IconSvg @name={{if row.isVideo "film" "music"}} />
                        {{/if}}
                      </div>
                      <div class="ve-clip__text">
                        <strong
                          title={{row.clip.name}}
                        >{{row.clip.name}}</strong>
                        <small>{{row.detail}}</small>
                      </div>
                      <div class="ve-clip__actions">
                        {{#if row.isVideo}}
                          <button
                            type="button"
                            class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm"
                            aria-label="Add {{row.clip.name}} to the end"
                            title="Add to the end"
                            {{on "click" (fn this.addVideoAgain row.clip.id)}}
                          ><IconSvg @name="list-plus" /></button>
                          <button
                            type="button"
                            class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm ve-to-overlay"
                            aria-label="Put {{row.clip.name}} over the picture at the playhead"
                            title="Put over the picture at the playhead"
                            {{on "click" (fn this.addAsOverlay row.clip.id)}}
                          ><IconSvg @name="layers" /></button>
                        {{else}}
                          <button
                            type="button"
                            class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm ve-to-music"
                            aria-label="Add {{row.clip.name}} to Music at the playhead"
                            title="Add to Music at the playhead"
                            {{on "click" (fn this.addToMusic row.clip.id)}}
                          ><IconSvg @name="music" /></button>
                          <button
                            type="button"
                            class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm ve-to-voice"
                            aria-label="Add {{row.clip.name}} to Voice at the playhead"
                            title="Add to Voice at the playhead"
                            {{on "click" (fn this.addToVoice row.clip.id)}}
                          ><IconSvg @name="mic" /></button>
                        {{/if}}
                        <button
                          type="button"
                          class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm"
                          aria-label="Remove {{row.clip.name}}"
                          title="Remove"
                          {{on "click" (fn this.removeClip row.clip.id)}}
                        ><IconSvg @name="trash-2" /></button>
                      </div>
                    </li>
                  {{/each}}
                </ul>
              {{else}}
                <p class="ve-hint">Videos and photos join in the order you add
                  them; sounds go on the Music layer.</p>
              {{/if}}
            {{else if this.toolIsText}}
              <p class="ve-hint">A title goes in at the playhead. Change its
                words, look and animation under Selected.</p>
              <XzRows @framed={{true}} class="ve-hear">
                <XzHeading @text="Subtitles from speech" />
                <XzSegmented
                  class="ve-hear-mode"
                  @items={{HEAR_LABELS}}
                  @selected={{this.hearModeIndex}}
                  @onChange={{this.pickHearMode}}
                />
                <XzRow @title="Language" @form="flush" as |titleId|>
                  <select
                    class="xz-select ve-hear-language"
                    aria-labelledby={{titleId}}
                    {{on "change" this.pickHearLanguage}}
                  >
                    <option
                      value=""
                      selected={{if this.hearLanguage false true}}
                    >Find it</option>
                    {{#each this.hearLanguages as |language|}}
                      <option
                        value={{language.code}}
                        selected={{language.on}}
                      >{{language.name}}</option>
                    {{/each}}
                  </select>
                </XzRow>
                <XzRow @title="Model" @detail={{this.hearModel}} />
                <XzGrid>
                  <XzButton
                    class="ve-hear-run"
                    @text={{if this.hearing this.hearText "Write subtitles"}}
                    @icon={{SubtitleIcon}}
                    @kind="primary"
                    @disabled={{this.cannotHear}}
                    @onClick={{this.writeSubtitles}}
                  />
                </XzGrid>
              </XzRows>
              <p class="ve-hint">Whisper listens to the videos and the Voice
                layer, on this device. Each line becomes a caption.</p>
              <XzDropZone
                class="ve-drop-zone ve-captions-drop"
                @prompt="Drop an SRT or VTT file: each line becomes a caption"
                @icon={{CaptionsIcon}}
                @accept={{CAPTION_ACCEPT}}
                @onFiles={{this.addCaptions}}
              />
              <XzGrid @columns={{2}}>
                {{#each TEXT_PRESETS as |preset|}}
                  <button
                    type="button"
                    class="ve-add-tile ve-add-text--{{preset.id}}"
                    {{on "click" (fn this.addText preset.id)}}
                  >
                    <IconSvg @name={{preset.icon}} />
                    <span>{{preset.label}}</span>
                  </button>
                {{/each}}
              </XzGrid>
              {{#if this.textRows.length}}
                <XzHeading @text="In this edit" />
                <ul class="ve-layer-list">
                  {{#each this.textRows as |row|}}
                    <li>
                      <button
                        type="button"
                        class="ve-layer-pick {{if row.on 'is-on'}}"
                        {{on "click" (fn this.pickLayer row.id)}}
                      >
                        <IconSvg @name="type" />
                        <span>{{row.name}}</span>
                        <small>{{row.detail}}</small>
                      </button>
                    </li>
                  {{/each}}
                </ul>
              {{/if}}
            {{else if this.toolIsOverlay}}
              <XzDropZone
                class="ve-drop-zone ve-overlay-drop"
                @prompt="Drop a logo, picture or small video, or press Files"
                @icon={{LayersIcon}}
                @accept={{OVERLAY_ACCEPT}}
                @multiple={{true}}
                @onFiles={{this.addOverlayFiles}}
              />
              {{#if this.overlayClips.length}}
                <XzHeading @text="From Media" />
                <ul class="ve-layer-list">
                  {{#each this.overlayClips as |row|}}
                    <li>
                      <button
                        type="button"
                        class="ve-layer-pick ve-overlay-clip"
                        title="Put over the picture at the playhead"
                        {{on "click" (fn this.addAsOverlay row.clip.id)}}
                      >
                        {{#if row.thumb}}
                          <img src={{row.thumb}} alt="" />
                        {{else}}
                          <IconSvg @name="image" />
                        {{/if}}
                        <span>{{row.clip.name}}</span>
                        <IconSvg @name="plus" />
                      </button>
                    </li>
                  {{/each}}
                </ul>
              {{/if}}
              <XzHeading @text="Shapes" />
              <XzGrid @columns={{4}}>
                {{#each SHAPE_KINDS as |shape|}}
                  <XzButton
                    class="ve-add-shape--{{shape}}"
                    @label="Add a {{shape}}"
                    @icon={{shapeIcon shape}}
                    @onClick={{fn this.addShape shape}}
                  />
                {{/each}}
              </XzGrid>
              <XzHeading @text="Emoji" />
              <div class="ve-emoji">
                {{#each EMOJI as |emoji|}}
                  <button
                    type="button"
                    class="ve-emoji__pick"
                    aria-label="Add {{emoji}}"
                    {{on "click" (fn this.addEmoji emoji)}}
                  >{{emoji}}</button>
                {{/each}}
              </div>
              {{#if this.overlayRows.length}}
                <XzHeading @text="In this edit" />
                <ul class="ve-layer-list">
                  {{#each this.overlayRows as |row|}}
                    <li>
                      <button
                        type="button"
                        class="ve-layer-pick {{if row.on 'is-on'}}"
                        {{on "click" (fn this.pickLayer row.id)}}
                      >
                        <IconSvg @name="layers" />
                        <span>{{row.name}}</span>
                        <small>{{row.detail}}</small>
                      </button>
                    </li>
                  {{/each}}
                </ul>
              {{/if}}
            {{else if this.toolIsAudio}}
              <XzRows @framed={{true}} class="ve-record">
                <XzHeading @text="Record a voice-over" />
                {{#if this.recording}}
                  <div class="ve-record__live" role="status">
                    <span class="ve-record__dot" aria-hidden="true"></span>
                    <b>{{this.recordText}}</b>
                    <span class="ve-record__meter" aria-hidden="true"><span
                        style={{this.recordMeterStyle}}
                      ></span></span>
                  </div>
                  <XzGrid>
                    <XzButton
                      class="ve-record-stop"
                      @text="Stop and keep"
                      @icon={{StopIcon}}
                      @kind="primary"
                      @onClick={{this.stopRecording}}
                    />
                  </XzGrid>
                {{else}}
                  <XzRow
                    @title="Play the edit while recording"
                    @detail="Use headphones, so the mic hears only you"
                  >
                    <XzSwitch
                      class="ve-record-play"
                      @on={{this.playWhileRecording}}
                      @onChange={{this.pickPlayWhileRecording}}
                      aria-label="Play the edit while recording"
                    />
                  </XzRow>
                  <XzGrid>
                    <XzButton
                      class="ve-record-start"
                      @text="Record at the playhead"
                      @icon={{MicIcon}}
                      @kind="primary"
                      @onClick={{this.startRecording}}
                    />
                  </XzGrid>
                {{/if}}
              </XzRows>
              <p class="ve-hint">It goes on the Voice layer where the playhead
                was. Music drops under it when Ducking is on.</p>
              <XzRows @framed={{true}}>
                <XzHeading @text="Ducking" />
                <PropSlider
                  class="ve-duck"
                  @label="Music under the voice"
                  @value={{this.duck.level}}
                  @step={{0.01}}
                  @nudge={{0.05}}
                  @readout={{percent}}
                  @onChange={{this.setDuckLevel}}
                  @on={{this.duck.on}}
                  @onToggle={{this.setDuckOn}}
                  @toggleLabel="Lower the music under the voice"
                />
              </XzRows>
              <p class="ve-hint">How loud each layer plays. Each clip has its
                own volume too, under Selected › Audio.</p>
              <XzRows @framed={{true}}>
                {{#each this.mixRows as |row|}}
                  <PropSlider
                    class="ve-level ve-level--{{row.key}}"
                    @label={{row.title}}
                    @value={{row.level.volume}}
                    @max={{2}}
                    @step={{0.01}}
                    @nudge={{0.05}}
                    @readout={{percent}}
                    @onChange={{fn this.levelVolume row.key}}
                    @on={{if row.level.muted false true}}
                    @onToggle={{fn this.levelOn row.key}}
                    @toggleLabel="{{row.title}} on"
                  />
                {{/each}}
              </XzRows>
            {{else if this.toolIsCanvas}}
              <XzRows @framed={{true}}>
                <XzHeading @text="Made for" />
                <XzSegmented
                  class="ve-preset"
                  @items={{PRESET_LABELS}}
                  @selected={{this.presetIndexShown}}
                  @columns={{2}}
                  @onChange={{this.pickPreset}}
                />
                <XzHeading @text="Shape" />
                <XzSegmented
                  class="ve-shape"
                  @items={{SHAPE_LABELS}}
                  @selected={{this.shapeIndex}}
                  @columns={{3}}
                  @onChange={{this.pickShape}}
                />
                <XzHeading @text="Fit" />
                <XzSegmented
                  class="ve-fit"
                  @items={{FIT_LABELS}}
                  @selected={{this.fitIndex}}
                  @onChange={{this.pickFit}}
                />
                <XzHeading @text="Background" />
                <XzSegmented
                  class="ve-background"
                  @items={{BACKGROUND_LABELS}}
                  @selected={{this.backgroundIndex}}
                  @onChange={{this.pickBackground}}
                />
                {{#if this.backgroundIsColour}}
                  <XzColourWell
                    class="ve-background-colour"
                    @label="Colour"
                    @colour={{this.backgroundRgb}}
                    @onChange={{this.setBackgroundColour}}
                  />
                {{/if}}
              </XzRows>
              <p class="ve-hint">The background shows around a clip whose shape
                differs from the frame's.</p>
            {{/if}}
          </div>
        </section>
      {{/if}}

      {{! ----- preview ----- }}
      <section class="ve-stage" aria-label="Preview">
        <div class="ve-stage__bar">
          <button
            type="button"
            class="ve-chip"
            title="Shape, fit and background"
            {{on "click" (fn this.pickTool "canvas")}}
          >{{this.shapeLabel}}</button>
          <button
            type="button"
            class="ve-chip"
            title="Shape, fit and background"
            {{on "click" (fn this.pickTool "canvas")}}
          >{{this.fitLabel}}</button>
          <span class="ve-stage__size">{{this.sizeText}}</span>
        </div>
        <div class="ve-stage__canvas" {{this.measureStage}}>
          <div class="ve-frame" style={{this.canvasStyle}}>
            <canvas
              class="ve-canvas"
              aria-label="Preview of the edit"
              {{this.player.register}}
            ></canvas>
            {{#if this.edit.layers.length}}
              <FrameBox
                @layers={{this.edit.layers}}
                @time={{this.player.time}}
                @clips={{this.clipMap}}
                @selectedId={{this.chosenLayerId}}
                @onSelect={{this.pickOnFrame}}
                @onBegin={{this.frameBegin}}
                @onChange={{this.frameChange}}
                @onEnd={{this.frameEnd}}
              />
            {{/if}}
          </div>
        </div>
        <div class="ve-transport">
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--icon ve-back"
            aria-label="Back one frame"
            disabled={{this.empty}}
            {{on "click" this.stepBack}}
          ><IconSvg @name="chevron-left" /></button>
          <button
            type="button"
            class="ve-play"
            aria-label={{if this.player.playing "Pause" "Play"}}
            title="Play or pause (Space)"
            disabled={{this.empty}}
            {{on "click" this.player.toggle}}
          ><IconSvg @name={{if this.player.playing "pause" "play"}} /></button>
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--icon ve-forward"
            aria-label="Forward one frame"
            disabled={{this.empty}}
            {{on "click" this.stepForward}}
          ><IconSvg @name="chevron-right" /></button>
          <span class="ve-time"><b>{{this.timeText}}</b>
            /
            {{this.lengthText}}</span>
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--icon ve-loop
              {{if this.player.looping 'is-on'}}"
            aria-label="Loop"
            aria-pressed={{if this.player.looping "true" "false"}}
            disabled={{this.empty}}
            {{on "click" this.player.toggleLoop}}
          ><IconSvg @name="repeat" /></button>
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--icon ve-stop"
            aria-label="Stop"
            disabled={{this.notActive}}
            {{on "click" this.player.stop}}
          ><IconSvg @name="square" /></button>
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--icon ve-save-frame"
            aria-label="Save this frame as a picture"
            title="Save this frame as PNG"
            disabled={{this.cannotSaveFrame}}
            {{on "click" this.saveFrame}}
          ><IconSvg @name="camera" /></button>
        </div>
      </section>

      {{! ----- selected item ----- }}
      <aside class="ve-props" aria-label="Selected">
        <header class="ve-props__head">
          <strong>{{this.headName}}</strong>
          <small>{{this.headDetail}}</small>
        </header>
        {{#if this.anyChosen}}
          <div class="ve-tabs" role="tablist">
            {{#each this.tabButtons as |tab|}}
              <button
                type="button"
                role="tab"
                class="ve-tab {{if tab.on 'is-on'}}"
                aria-selected={{if tab.on "true" "false"}}
                {{on "click" (fn this.pickTab tab.id)}}
              >{{tab.label}}</button>
            {{/each}}
          </div>
          <div class="ve-props__body">
            {{#if this.chosenLayer}}
              <LayerProps
                @layer={{this.chosenLayer}}
                @clip={{this.chosenLayerClip}}
                @tab={{this.layerTab}}
                @frameAspect={{this.outAspect}}
                @stackIndex={{this.layerStackIndex}}
                @stackCount={{this.edit.layers.length}}
                @onChange={{this.patchLayer}}
                @onEndLive={{this.endLive}}
                @onStack={{this.restackLayer}}
              />
            {{else if this.chosen}}
              {{#if this.tabIsTransition}}
                <XzRows @framed={{true}}>
                  <XzHeading @text="From the clip before" />
                  <XzSegmented
                    class="ve-transition"
                    @items={{TRANSITION_LABELS}}
                    @selected={{this.transitionKindIndex}}
                    @columns={{3}}
                    @onChange={{this.pickTransition}}
                  />
                  {{#unless this.transitionOff}}
                    <PropSlider
                      class="ve-transition-seconds"
                      @label="Takes"
                      @value={{this.transition.seconds}}
                      @min={{0.1}}
                      @max={{this.transitionMax}}
                      @step={{0.05}}
                      @nudge={{0.1}}
                      @readout={{secondsReadout}}
                      @onChange={{this.setTransitionSeconds}}
                    />
                  {{/unless}}
                </XzRows>
                <p class="ve-hint">The two clips overlap while it plays, so the
                  edit gets that much shorter. It lasts at most half of either
                  clip.</p>
              {{else if this.tabIsEdit}}
                <XzRows @framed={{true}}>
                  {{#if this.chosenIsAudio}}
                    <XzSegmented
                      class="ve-lane-pick"
                      @items={{laneLabels}}
                      @selected={{this.laneIndex}}
                      @onChange={{this.setLane}}
                    />
                    <XzRow @title="Starts at" @form="flush" as |titleId|>
                      <XzDecimalField
                        class="ve-start"
                        @value={{this.chosen.start}}
                        @unit="s"
                        @labelledBy={{titleId}}
                        @onChange={{this.setStart}}
                      />
                    </XzRow>
                  {{/if}}
                  {{#if this.chosenIsPhoto}}
                    <XzRow @title="Shows for" @form="flush" as |titleId|>
                      <XzDecimalField
                        class="ve-photo-seconds"
                        @value={{this.photoSeconds}}
                        @min={{0.1}}
                        @max={{photoLimit}}
                        @unit="s"
                        @labelledBy={{titleId}}
                        @onChange={{this.setPhotoSeconds}}
                      />
                    </XzRow>
                  {{else}}
                    <XzRow @title="From" @form="flush" as |titleId|>
                      <XzDecimalField
                        class="ve-in"
                        @value={{this.chosen.in}}
                        @max={{this.inMax}}
                        @unit="s"
                        @labelledBy={{titleId}}
                        @onChange={{this.setIn}}
                      />
                    </XzRow>
                    <XzRow @title="To" @form="flush" as |titleId|>
                      <XzDecimalField
                        class="ve-out"
                        @value={{this.chosen.out}}
                        @min={{this.outMin}}
                        @max={{this.outMax}}
                        @unit="s"
                        @labelledBy={{titleId}}
                        @onChange={{this.setOut}}
                      />
                    </XzRow>
                  {{/if}}
                  <XzRow @title="Length" @detail={{this.chosenLength}} />
                  {{#if this.chosenIsVideo}}
                    {{#if this.chosenHasTimes}}
                      <XzHeading @text="Speed" />
                      <XzSegmented
                        class="ve-speed"
                        @items={{SPEED_LABELS}}
                        @selected={{this.speedIndex}}
                        @columns={{3}}
                        @onChange={{this.pickSpeed}}
                      />
                      <XzHeading @text="Clip tools" />
                      <XzGrid>
                        <XzButton
                          class="ve-reverse"
                          @text="Reverse"
                          @icon={{ReverseIcon}}
                          @selected={{this.chosenIsReversed}}
                          @disabled={{this.reversing}}
                          @onClick={{this.toggleReverse}}
                        />
                        <XzButton
                          class="ve-freeze"
                          @text="Freeze frame"
                          @icon={{FreezeIcon}}
                          @disabled={{this.freezing}}
                          @onClick={{this.freezeFrame}}
                        />
                      </XzGrid>
                      {{#if this.reversing}}
                        <XzRow @title={{this.reverseText}}>
                          <XzButton
                            class="ve-reverse-stop"
                            @text="Stop"
                            @onClick={{this.cancelReverse}}
                          />
                        </XzRow>
                      {{/if}}
                    {{/if}}
                    <XzHeading @text="Rotate and flip" />
                    <XzGrid>
                      <XzButton
                        class="ve-rotate-left"
                        @label="Rotate left"
                        @icon={{RotateLeftIcon}}
                        @onClick={{this.rotateLeft}}
                      />
                      <XzButton
                        class="ve-rotate-right"
                        @label="Rotate right"
                        @icon={{RotateRightIcon}}
                        @onClick={{this.rotateRight}}
                      />
                      <XzButton
                        class="ve-flip-h"
                        @label="Flip left to right"
                        @icon={{FlipHIcon}}
                        @selected={{this.look.flipH}}
                        @onClick={{this.flipH}}
                      />
                      <XzButton
                        class="ve-flip-v"
                        @label="Flip upside down"
                        @icon={{FlipVIcon}}
                        @selected={{this.look.flipV}}
                        @onClick={{this.flipV}}
                      />
                    </XzGrid>
                    <XzHeading @text="Crop" />
                    {{#each this.cropRows as |row|}}
                      <PropSlider
                        class="ve-crop-{{row.side}}"
                        @label={{row.label}}
                        @value={{row.value}}
                        @max={{0.45}}
                        @step={{0.01}}
                        @nudge={{0.01}}
                        @readout={{cropReadout}}
                        @onChange={{fn this.setCrop row.side}}
                      />
                    {{/each}}
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
                </XzRows>
              {{else if this.tabIsAdjust}}
                <XzRows @framed={{true}}>
                  {{#each this.adjustRows as |row|}}
                    <PropSlider
                      class="ve-{{row.key}}"
                      @label={{row.label}}
                      @value={{row.value}}
                      @max={{2}}
                      @step={{0.01}}
                      @nudge={{0.05}}
                      @readout={{percent}}
                      @onChange={{fn this.setAdjust row.key}}
                    />
                  {{/each}}
                  <XzHeading @text="Filter" />
                  <XzSegmented
                    class="ve-filter"
                    @items={{FILTER_LABELS}}
                    @selected={{this.filterIndex}}
                    @columns={{3}}
                    @onChange={{this.pickFilter}}
                  />
                  <XzHeading @text="Effects" />
                  <PropSlider
                    class="ve-vignette"
                    @label="Vignette"
                    @value={{this.look.vignette}}
                    @step={{0.01}}
                    @nudge={{0.05}}
                    @readout={{percent}}
                    @onChange={{fn this.setEffect "vignette"}}
                  />
                  <PropSlider
                    class="ve-blur"
                    @label="Blur"
                    @value={{this.look.blur}}
                    @step={{0.01}}
                    @nudge={{0.05}}
                    @readout={{percent}}
                    @onChange={{fn this.setEffect "blur"}}
                  />
                  <XzRow
                    @title="Zoom and pan"
                    @detail="Over the whole clip; best on photos"
                  >
                    <XzSwitch
                      class="ve-motion-on"
                      @on={{this.motionOn}}
                      @onChange={{this.setMotionOn}}
                      aria-label="Zoom and pan"
                    />
                  </XzRow>
                  {{#if this.motionOn}}
                    <XzSegmented
                      class="ve-motion"
                      @items={{MOTION_LABELS}}
                      @selected={{this.motionIndex}}
                      @columns={{3}}
                      @onChange={{this.pickMotion}}
                    />
                    <PropSlider
                      class="ve-motion-amount"
                      @label="How far"
                      @value={{this.look.motion.amount}}
                      @min={{0.05}}
                      @max={{0.5}}
                      @step={{0.01}}
                      @nudge={{0.05}}
                      @readout={{percent}}
                      @onChange={{this.setMotionAmount}}
                    />
                  {{/if}}
                  <XzGrid>
                    <XzButton
                      class="ve-reset-look"
                      @text="Reset picture"
                      @icon={{ResetIcon}}
                      @disabled={{this.lookPlain}}
                      @onClick={{this.resetLook}}
                    />
                  </XzGrid>
                </XzRows>
              {{else if this.tabIsAnim}}
                {{#if this.chosenPiece}}
                  <AnimPicker
                    @animIn={{this.chosenPiece.animIn}}
                    @animOut={{this.chosenPiece.animOut}}
                    @seconds={{this.chosenPiece.animSeconds}}
                    @onPick={{this.pickPieceAnim}}
                    @onSeconds={{this.setPieceAnimSeconds}}
                  />
                  <p class="ve-hint">The clip comes in over black and goes out
                    to black. Each lasts at most half the clip; a transition
                    from the clip before plays as well.</p>
                {{/if}}
              {{else}}
                <XzRows @framed={{true}}>
                  {{#if this.chosenIsAudio}}
                    <XzHeading @text="Noise reduction" />
                    <XzSegmented
                      class="ve-clean"
                      @items={{CLEAN_LABELS}}
                      @selected={{this.cleanIndex}}
                      @disabled={{this.cleaning}}
                      @onChange={{this.pickClean}}
                    />
                    {{#if this.cleaning}}
                      <XzStatus @text="Cleaning the sound…" @tone="muted" />
                    {{/if}}
                  {{/if}}
                  {{#if this.canDetach}}
                    <XzGrid>
                      <XzButton
                        class="ve-detach"
                        @text="Detach sound"
                        @icon={{DetachIcon}}
                        @disabled={{this.cannotDetach}}
                        @onClick={{this.detachSound}}
                      />
                    </XzGrid>
                  {{/if}}
                  <PropSlider
                    class="ve-volume"
                    @label="Volume"
                    @value={{this.chosen.volume}}
                    @max={{2}}
                    @step={{0.01}}
                    @nudge={{0.05}}
                    @readout={{percent}}
                    @onChange={{this.setVolume}}
                    @on={{this.chosenSoundOn}}
                    @onToggle={{this.setSoundOn}}
                    @toggleLabel="Sound on"
                  />
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
                      @unit="s"
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
                      @unit="s"
                      @labelledBy={{titleId}}
                      @onChange={{this.setFadeOut}}
                    />
                  </XzRow>
                </XzRows>
              {{/if}}
            {{/if}}
          </div>
        {{else}}
          <div class="ve-props__body">
            <div class="ve-empty">
              <IconSvg @name="mouse-pointer-click" />
              <p>Click a clip, sound, title or overlay on the timeline or the
                preview to change it here.</p>
            </div>
            <XzRows @framed={{true}}>
              <XzRow @title="Frame" @detail={{this.sizeText}} />
              <XzRow @title="Length" @detail={{this.lengthText}} />
            </XzRows>
            <p class="ve-keys">
              Space play · S split · I / O mark · X cut out · Delete · Alt+← →
              move · ← → frame · Ctrl Z / Y undo, redo · Ctrl B sidebar
            </p>
          </div>
        {{/if}}
      </aside>

      {{! ----- timeline ----- }}
      <section class="ve-timeline-area" aria-label="Timeline">
        <div class="ve-tl-bar">
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--sm ve-split"
            title="Split at the playhead (S)"
            disabled={{this.cannotSplit}}
            {{on "click" this.splitHere}}
          ><IconSvg @name="scissors" /> Split</button>
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--sm ve-delete"
            title="Delete (Delete)"
            disabled={{this.nothingChosen}}
            {{on "click" this.deleteSelected}}
          ><IconSvg @name="trash-2" /> Delete</button>
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--sm ve-duplicate"
            title="Duplicate"
            disabled={{this.nothingChosen}}
            {{on "click" this.duplicateSelected}}
          ><IconSvg @name="copy-plus" /> Duplicate</button>
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--sm ve-add-transition"
            title="A transition on the selected clip's join, or the next one"
            disabled={{this.cannotTransition}}
            {{on "click" this.addTransition}}
          ><IconSvg @name="arrow-left-right" /> Transition</button>
          <span class="ve-tl-sep" aria-hidden="true"></span>
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--sm ve-set-in"
            title="Mark in at the playhead (I)"
            disabled={{this.empty}}
            {{on "click" this.markInHere}}
          ><IconSvg @name="arrow-right-to-line" />
            In
            <small>{{this.markInShort}}</small></button>
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--sm ve-set-out"
            title="Mark out at the playhead (O)"
            disabled={{this.empty}}
            {{on "click" this.markOutHere}}
          ><IconSvg @name="arrow-left-to-line" />
            Out
            <small>{{this.markOutShort}}</small></button>
          <button
            type="button"
            class="xz-btn xz-btn--sm ve-cut-out"
            title="Cut the marked part out of every layer (X)"
            disabled={{this.noRange}}
            {{on "click" this.cutOut}}
          ><IconSvg @name="scissors-line-dashed" /> Cut out</button>
          {{#unless this.noMarks}}
            <button
              type="button"
              class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm ve-clear-marks"
              aria-label="Clear the marks"
              title="Clear the marks (Esc)"
              {{on "click" this.clearMarks}}
            ><IconSvg @name="x" /></button>
          {{/unless}}
          <span class="ve-tl-grow"></span>
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm ve-zoom-out"
            aria-label="Zoom out"
            disabled={{this.cannotZoomOut}}
            {{on "click" this.zoomOut}}
          ><IconSvg @name="zoom-out" /></button>
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm ve-zoom-in"
            aria-label="Zoom in"
            disabled={{this.cannotZoomIn}}
            {{on "click" this.zoomIn}}
          ><IconSvg @name="zoom-in" /></button>
          <button
            type="button"
            class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm ve-zoom-fit"
            aria-label="Fit the whole edit"
            disabled={{this.cannotZoomOut}}
            {{on "click" this.zoomFit}}
          ><IconSvg @name="maximize-2" /></button>
        </div>
        <div class="ve-tl-body">
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
              @onLayerTrim={{this.trimLayerTo}}
              @onLayerMove={{this.moveLayerTo}}
              @onJoin={{this.openJoin}}
              @onDropClip={{this.dropClip}}
            />
          {{else}}
            <p class="ve-timeline-empty">Add videos, photos and sounds in Media
              and they line up here.</p>
          {{/if}}
        </div>
      </section>
    </div>

    {{! ----- export ----- }}
    <XzDialog
      class="ve-export"
      @open={{this.exportOpen}}
      @title="Export"
      @onClose={{this.closeExport}}
    >
      <XzRows @framed={{true}}>
        <XzHeading @text="Format" />
        <XzSegmented
          class="ve-format"
          @items={{FORMAT_LABELS}}
          @selected={{this.formatIndex}}
          @onChange={{this.pickFormat}}
        />
        {{#if this.exportIsVideo}}
          <XzSegmented
            class="ve-codec"
            @items={{this.codecLabels}}
            @selected={{this.codecIndex}}
            @onChange={{this.pickCodec}}
          />
          <XzHeading @text="Size" />
          <XzSegmented
            class="ve-size"
            @items={{this.sizeLabels}}
            @selected={{this.sizeIndexShown}}
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
        {{else if this.exportIsGif}}
          <XzHeading @text="Size" />
          <XzSegmented
            class="ve-gif-size"
            @items={{GIF_SIZE_LABELS}}
            @selected={{this.gifSizeIndex}}
            @onChange={{this.pickGifSize}}
          />
          <XzHeading @text="Frame rate" />
          <XzSegmented
            class="ve-gif-rate"
            @items={{GIF_RATE_LABELS}}
            @selected={{this.gifRateIndex}}
            @onChange={{this.pickGifRate}}
          />
        {{else}}
          <XzHeading @text="Sound file" />
          <XzSegmented
            class="ve-sound-format"
            @items={{SOUND_FORMAT_LABELS}}
            @selected={{this.soundFormatIndex}}
            @onChange={{this.pickSoundFormat}}
          />
        {{/if}}
        <XzRow class="ve-estimate" @title="File" @detail={{this.estimate}} />
        {{#if this.exportIsGif}}
          <p class="ve-hint">A GIF loops and has no sound. It gets large
            quickly: keep it short.</p>
        {{else if this.exportIsSound}}
          <p class="ve-hint">Every sound mixed: the videos', Music and Voice.</p>
        {{/if}}
        {{#if this.showToDisk}}
          <XzRow
            @title="Save as it renders"
            @detail="Asks where first; best for long videos"
          >
            <XzSwitch
              class="ve-to-disk"
              @on={{this.toDisk}}
              @onChange={{this.pickToDisk}}
              aria-label="Save as it renders"
            />
          </XzRow>
        {{/if}}
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
      {{#if this.resultFile}}
        <OpenIn
          class="ve-open-in"
          @file={{this.resultFile}}
          @self="video-edit"
        />
      {{/if}}
    </XzDialog>

    <XzDialog
      class="ve-new-dialog"
      @open={{this.newOpen}}
      @title="Start a new edit?"
      @onClose={{this.closeNew}}
    >
      <p class="ve-hint">Every clip, title and setting in this edit goes, and it
        can't be undone. Export first to keep it.</p>
      <XzGrid>
        <XzButton
          class="ve-new-keep"
          @text="Keep editing"
          @onClick={{this.closeNew}}
        />
        <XzButton
          class="ve-new-start"
          @text="Start over"
          @kind="primary"
          @onClick={{this.startOver}}
        />
      </XzGrid>
    </XzDialog>

    <XzDialog
      class="ve-open-dialog"
      @open={{this.openOpen}}
      @title="Open the project file?"
      @onClose={{this.closeOpen}}
    >
      <p class="ve-hint">It takes the place of this edit, which can't be brought
        back. Save a project file of this one first to keep it.</p>
      <XzGrid>
        <XzButton
          class="ve-open-keep"
          @text="Keep editing"
          @onClick={{this.closeOpen}}
        />
        <XzButton
          class="ve-open-go"
          @text="Open it"
          @kind="primary"
          @onClick={{this.confirmOpen}}
        />
      </XzGrid>
    </XzDialog>
  </template>
}
