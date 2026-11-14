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
import CanonSplit from 'delphicanon/components/canon-split';
import CanonStatus from 'delphicanon/components/canon-status';
import CanonSwitch from 'delphicanon/components/canon-switch';
import CanonTiles from 'delphicanon/components/canon-tiles';
import { IconSvg } from 'xsenze-tools/components/icon';
import filePaste from 'xsenze-tools/modifiers/file-paste';
import { downloadBlob } from 'xsenze-tools/lib/download';
import { formatBytes } from 'xsenze-tools/lib/format';
import { VideoIntake } from 'xsenze-tools/lib/video';
import { VIDEO_ACCEPT, acceptAttr } from 'xsenze-tools/lib/tools';
import type { NamedBlob } from 'xsenze-tools/lib/zip-files';
import {
  formatFps,
  probeVideo,
  type Container,
  type VideoProbe,
} from 'xsenze-tools/lib/media-probe';
import { formatTimestamp } from 'xsenze-tools/lib/subtitles';
import {
  analyzeMedia,
  sections,
  type Section,
} from 'xsenze-tools/lib/mediainfo';
import {
  COMPRESS_CODECS,
  CONTAINERS,
  compressSupport,
  compressVideo,
  sourceRates,
  type CompressCodec,
  type CompressSupport,
  type SourceRates,
} from 'xsenze-tools/lib/media-convert';
import DownloadAll from 'xsenze-tools/components/tools/media/download-all';
import Drop from 'xsenze-tools/components/tools/media/drop';
import Job from 'xsenze-tools/components/tools/media/job';
import Playback from 'xsenze-tools/components/tools/media/playback';
import Sections from 'xsenze-tools/components/tools/media/sections';
import Slot from 'xsenze-tools/components/tools/media/slot';
import Transport from 'xsenze-tools/components/tools/media/transport';
import WorkBanner from 'xsenze-tools/components/tools/media/work-banner';
import { frameAt } from 'xsenze-tools/components/tools/media/frames';
import './media/media.css';
import './video-compressor.css';

const ACCEPT = acceptAttr(VIDEO_ACCEPT);
const COMPRESS_ERROR =
  "Couldn't compress this video. Try another codec or container.";
const NO_ENCODER = "This browser can't encode video. Try Chrome or Edge.";
const tallest = 1.25;
const tallestPreview = 340;
const scaleHeight = 132;
const MB = 1024 * 1024;
// a bitrate below this falls apart
const FLOOR = 150_000;
const CEILING = 40_000_000;
// containers and headers on top of the streams
const OVERHEAD = 1.02;
// the source's audio is copied below this, re-encoded above it
const AUDIO_COPY_MAX = 160_000;
const AUDIO_BITRATE = 128_000;
// the longest side of a compare frame
const COMPARE_MAX = 1920;

const MODES = ['Quality', 'Target size'];
const PRESETS = ['Small', 'Balanced', 'High'];
/** H.264 bits per pixel per frame, per preset. */
const BITS_PER_PIXEL = [0.04, 0.07, 0.11];
const TARGET_MB = [8, 25, 50, 100];
const TARGETS = TARGET_MB.map((mb) => `${mb} MB`);
const SHORT_SIDES = [0, 1080, 720, 480, 360];
const RESOLUTIONS = ['Original', '1080p', '720p', '480p', '360p'];
const RATES_FPS = [0, 30, 24];
const RATES = ['Original', '30 fps', '24 fps'];
const containerLabels = CONTAINERS.map((c) => c.label);
const CODEC_LABELS = ['H.264', 'H.265', 'VP9', 'AV1'];
/** Bitrate for the same look, against H.264. */
const CODEC_FACTOR: Record<CompressCodec, number> = {
  avc: 1,
  hevc: 0.65,
  vp9: 0.7,
  av1: 0.55,
};
const CODEC_NOTES: Record<CompressCodec, string> = {
  avc: 'H.264 plays everywhere. The safest choice.',
  hevc: 'H.265 is smaller, but some browsers and older phones cannot play it.',
  vp9: 'VP9 is smaller and plays in every modern browser.',
  av1: 'AV1 is the smallest, but it encodes slowly and older devices cannot play it.',
};
const VIEWS = ['Original', 'Compressed'];

const Trash = <template><IconSvg @name="trash-2" /></template>;
const Shrink = <template><IconSvg @name="shrink" /></template>;
const Eye = <template><IconSvg @name="eye" /></template>;
const Remove = <template><IconSvg @name="x" /></template>;

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

function rate(bps: number) {
  return bps >= 1e6
    ? `${(bps / 1e6).toFixed(1)} Mbps`
    : `${Math.round(bps / 1000)} kbps`;
}

function saving(before: number, after: number) {
  if (!before || !after) return '';
  const pct = Math.round((1 - after / before) * 100);
  return pct >= 0 ? `−${pct}%` : `+${-pct}%`;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

interface Result {
  blob: Blob;
  /** Empty when the original is kept. */
  url: string;
  ext: string;
  /** Already under the target size: the original stays. */
  kept: boolean;
}

interface Clip {
  id: number;
  file: File;
  probe: VideoProbe | null;
  rates: SourceRates | null;
  support: CompressSupport | null;
  reading: boolean;
  /** No video track we can read. */
  broken: boolean;
  failed: boolean;
  result: Result | null;
  /** Compare frames and the result's report, made when it is viewed. */
  before: string;
  after: string;
  info: Section[];
}

interface Plan {
  video: number;
  bytes: number;
  lean: boolean;
  tooSmall: boolean;
  /** Target size: already under it. */
  keep: boolean;
}

/** Smaller videos, one or many, from mediabunny's WebCodecs transcode. */
export default class VideoCompressor extends Component {
  /** The preview: whichever video is selected. */
  intake = new VideoIntake();
  drop = new Drop(ACCEPT, (files) => this.add(files), true);
  playback = new Playback();

  @tracked clips: Clip[] = [];
  @tracked selectedId = 0;

  @tracked mode = 0;
  @tracked preset = 1;
  @tracked target = 1;
  @tracked resolution = 0;
  @tracked frameRate = 0;
  @tracked containerPick = 0;
  @tracked codecPick = 0;
  @tracked removeAudio = false;

  @tracked busy = false;
  @tracked progress = 0;
  @tracked current = 0;
  @tracked view = 0;
  @tracked compareOn = false;
  @tracked aspect = 16 / 9;

  #nextId = 0;
  #job = 0;
  #abort: AbortController | null = null;

  willDestroy() {
    super.willDestroy();
    this.#job++;
    this.#abort?.abort();
    this.intake.release();
    for (const clip of this.clips) this.#release(clip);
  }

  // ---------- the list ----------

  get usable() {
    return this.clips.filter((clip) => !clip.broken);
  }

  get reading() {
    return this.clips.some((clip) => clip.reading);
  }

  get selected(): Clip | undefined {
    return (
      this.clips.find((clip) => clip.id === this.selectedId) ?? this.clips[0]
    );
  }

  get loaded() {
    return this.clips.length > 0;
  }

  get rows() {
    const chosen = this.selected;
    return this.clips.map((clip) => ({
      clip,
      on: clip === chosen,
      detail: this.#detail(clip),
    }));
  }

  #meta(clip: Clip) {
    const p = clip.probe;
    const parts: string[] = [];
    if (p) parts.push(`${p.width} × ${p.height}`);
    if (p?.fps) parts.push(formatFps(p.fps));
    if (clip.rates?.duration)
      parts.push(formatTimestamp(clip.rates.duration * 1000, '.'));
    return parts;
  }

  #detail(clip: Clip) {
    if (clip.broken) return "Can't read this video";
    if (clip.reading) return `Reading… · ${formatBytes(clip.file.size)}`;
    const parts = this.#meta(clip);
    const size = clip.file.size;
    const r = clip.result;
    if (r) {
      parts.push(`${formatBytes(size)} → ${formatBytes(r.blob.size)}`);
      if (r.kept) parts.push('already under target, kept');
      else parts.push(saving(size, r.blob.size));
    } else {
      const plan = this.planFor(clip);
      parts.push(
        plan && !plan.keep
          ? `${formatBytes(size)} → ~${formatBytes(plan.bytes)}`
          : formatBytes(size),
      );
      if (plan?.keep) parts.push('already under target');
      if (clip.failed) parts.push('failed');
    }
    return parts.join(' · ');
  }

  add = (files: File[]) => {
    if (this.busy || !files.length) return;
    const fresh = files.map((file): Clip => ({
      id: ++this.#nextId,
      file,
      probe: null,
      rates: null,
      support: null,
      reading: true,
      broken: false,
      failed: false,
      result: null,
      before: '',
      after: '',
      info: [],
    }));
    this.clips = [...this.clips, ...fresh];
    if (!this.clips.some((c) => c.id === this.selectedId && !c.broken))
      this.#show(fresh[0]);
    for (const clip of fresh) void this.#inspect(clip);
  };

  addOne = (file: File) => this.add([file]);

  async #inspect(clip: Clip) {
    const [probe, rates] = await Promise.all([
      probeVideo(clip.file),
      sourceRates(clip.file).catch(() => null),
    ]);
    const support = probe
      ? await compressSupport(even(probe.width), even(probe.height))
      : null;
    this.#patch(clip.id, {
      probe,
      rates,
      support,
      reading: false,
      broken: !probe,
    });
  }

  #patch(id: number, changes: Partial<Clip>) {
    this.clips = this.clips.map((clip) =>
      clip.id === id ? { ...clip, ...changes } : clip,
    );
  }

  /** Puts a clip in the preview. */
  #show(clip: Clip | undefined) {
    this.playback.unload();
    this.view = clip?.result && !clip.result.kept ? 1 : 0;
    if (!clip) {
      this.selectedId = 0;
      this.intake.clear();
      this.aspect = 16 / 9;
      return;
    }
    this.selectedId = clip.id;
    this.intake.load(clip.file);
    void this.#prepare(clip.id);
  }

  select = (id: number) => {
    if (id === this.selected?.id) return;
    this.#show(this.clips.find((clip) => clip.id === id));
  };

  remove = (id: number) => {
    if (this.busy) return;
    const clip = this.clips.find((c) => c.id === id);
    if (clip) this.#release(clip);
    const wasShown = this.selected?.id === id;
    this.clips = this.clips.filter((c) => c.id !== id);
    if (wasShown) this.#show(this.clips[0]);
  };

  clear = () => {
    if (this.busy) return;
    for (const clip of this.clips) this.#release(clip);
    this.clips = [];
    this.#show(undefined);
  };

  #release(clip: Clip) {
    const urls = [clip.result?.url, clip.before, clip.after];
    // the player lets go of them on the next render
    setTimeout(() => {
      for (const url of urls) if (url) URL.revokeObjectURL(url);
    });
  }

  // ---------- choices the sources rule out ----------

  get support(): CompressSupport | null {
    const all = this.usable.flatMap((clip) =>
      clip.support ? [clip.support] : [],
    );
    if (!all.length) return null;
    const encoders = new Set(
      COMPRESS_CODECS.filter((c) => all.every((s) => s.encoders.has(c))),
    );
    return { encoders, holds: all[0]!.holds };
  }

  get #probes() {
    return this.usable.flatMap((clip) => (clip.probe ? [clip.probe] : []));
  }

  /** A choice no video would use. */
  get blockedResolutions() {
    const shorts = this.#probes.map((p) => Math.min(p.width, p.height));
    if (!shorts.length) return [];
    const biggest = Math.max(...shorts);
    return SHORT_SIDES.flatMap((side, i) =>
      side && side >= biggest ? [i] : [],
    );
  }

  get blockedRates() {
    const rates = this.#probes.map((p) => p.fps ?? 30);
    if (!rates.length) return [];
    const fastest = Math.max(...rates);
    return RATES_FPS.flatMap((fps, i) =>
      fps && fps >= fastest - 0.5 ? [i] : [],
    );
  }

  get blockedTargets() {
    const sizes = this.usable.map((clip) => clip.file.size);
    if (!sizes.length) return [];
    const biggest = Math.max(...sizes);
    return TARGET_MB.flatMap((mb, i) => (mb * MB >= biggest ? [i] : []));
  }

  #codecOk(codec: CompressCodec, container: Container) {
    const s = this.support;
    return !!s && s.encoders.has(codec) && s.holds[container].has(codec);
  }

  get blockedContainers() {
    if (!this.support) return [];
    return CONTAINERS.flatMap((c, i) =>
      COMPRESS_CODECS.some((codec) => this.#codecOk(codec, c.id)) ? [] : [i],
    );
  }

  get containerIndex() {
    const blocked = this.blockedContainers;
    if (!blocked.includes(this.containerPick)) return this.containerPick;
    return CONTAINERS.findIndex((_, i) => !blocked.includes(i));
  }

  get container(): Container {
    return CONTAINERS[Math.max(0, this.containerIndex)]!.id;
  }

  get blockedCodecs() {
    if (!this.support) return [];
    return COMPRESS_CODECS.flatMap((codec, i) =>
      this.#codecOk(codec, this.container) ? [] : [i],
    );
  }

  get codecIndex() {
    const blocked = this.blockedCodecs;
    if (!blocked.includes(this.codecPick)) return this.codecPick;
    return COMPRESS_CODECS.findIndex((_, i) => !blocked.includes(i));
  }

  get codec(): CompressCodec | null {
    if (!this.support) return null;
    return COMPRESS_CODECS[this.codecIndex] ?? null;
  }

  get resolutionIndex() {
    return this.blockedResolutions.includes(this.resolution)
      ? 0
      : this.resolution;
  }

  get rateIndex() {
    return this.blockedRates.includes(this.frameRate) ? 0 : this.frameRate;
  }

  get targetIndex() {
    return this.blockedTargets.includes(this.target) ? -1 : this.target;
  }

  // ---------- the plan, per video ----------

  /** Null keeps the video's size: it is already that small. */
  sizeFor(clip: Clip) {
    const p = clip.probe;
    const side = SHORT_SIDES[this.resolutionIndex] ?? 0;
    if (!p || !side) return null;
    const short = Math.min(p.width, p.height);
    if (side >= short) return null;
    const scale = side / short;
    return { width: even(p.width * scale), height: even(p.height * scale) };
  }

  fpsFor(clip: Clip) {
    const fps = RATES_FPS[this.rateIndex] || null;
    const source = clip.probe?.fps ?? 30;
    return fps && fps < source - 0.5 ? fps : null;
  }

  audioPlanFor(clip: Clip): 'remove' | 'copy' | number {
    if (!clip.probe?.audioTracks || this.removeAudio) return 'remove';
    const source = clip.rates?.audio ?? 0;
    return source > 0 && source <= AUDIO_COPY_MAX ? 'copy' : AUDIO_BITRATE;
  }

  audioBitsFor(clip: Clip) {
    const plan = this.audioPlanFor(clip);
    if (plan === 'remove') return 0;
    return plan === 'copy' ? (clip.rates?.audio ?? 0) : plan;
  }

  planFor(clip: Clip): Plan | null {
    const p = clip.probe;
    const duration = clip.rates?.duration ?? 0;
    if (!p || !duration || !this.codec) return null;
    const size = this.sizeFor(clip) ?? { width: p.width, height: p.height };
    const fps = this.fpsFor(clip) ?? p.fps ?? 30;
    const audio = this.audioBitsFor(clip);
    const source = clip.rates?.video ?? 0;
    let video: number;
    let lean = false;
    let tooSmall = false;
    if (this.mode === 0) {
      video =
        (BITS_PER_PIXEL[this.preset] ?? 0.07) *
        size.width *
        size.height *
        fps *
        CODEC_FACTOR[this.codec];
      video = Math.min(CEILING, Math.max(FLOOR, video));
      if (source > 0 && video >= source) {
        video = source;
        lean = true;
      }
    } else {
      const mb = TARGET_MB[this.targetIndex];
      if (mb === undefined) return null;
      if (clip.file.size <= mb * MB)
        return {
          video: 0,
          bytes: clip.file.size,
          lean: false,
          tooSmall: false,
          keep: true,
        };
      // 4 % headroom so the file lands under the target
      video = (mb * MB * 8 * 0.96) / OVERHEAD / duration - audio;
      if (video < FLOOR) {
        video = FLOOR;
        tooSmall = true;
      }
    }
    const bytes = Math.round(((video + audio) * duration * OVERHEAD) / 8);
    return { video: Math.round(video), bytes, lean, tooSmall, keep: false };
  }

  get plans() {
    return this.usable.map((clip) => ({ clip, plan: this.planFor(clip) }));
  }

  get ready() {
    return (
      !this.busy &&
      !this.reading &&
      this.usable.length > 0 &&
      this.plans.every(({ plan }) => plan !== null)
    );
  }

  // ---------- readouts ----------

  get done() {
    return this.usable.length > 0 && this.usable.every((clip) => clip.result);
  }

  get sourceBytes() {
    return this.usable.reduce((sum, clip) => sum + clip.file.size, 0);
  }

  /** The results once all are done, else the estimate. */
  get shownBytes() {
    if (this.done)
      return this.usable.reduce((sum, c) => sum + c.result!.blob.size, 0);
    const plans = this.plans;
    if (!plans.length || plans.some(({ plan }) => !plan)) return 0;
    return plans.reduce((sum, { plan }) => sum + plan!.bytes, 0);
  }

  get scaleFormat() {
    const ext = this.container.toUpperCase();
    return this.done ? ext : `Estimate · ${ext}`;
  }

  get tiles() {
    const clip = this.selected;
    const plan = clip ? this.planFor(clip) : null;
    const size = clip ? (this.sizeFor(clip) ?? clip.probe) : null;
    const fps = clip ? (this.fpsFor(clip) ?? clip.probe?.fps) : null;
    const before = this.sourceBytes;
    const after = this.shownBytes;
    const many = this.usable.length > 1;
    return [
      {
        label: this.done ? 'Size' : 'Estimate',
        value: after ? formatBytes(after) : '—',
      },
      { label: 'Saving', value: saving(before, after) || '—' },
      many
        ? { label: 'Videos', value: String(this.usable.length) }
        : {
            label: 'Video bitrate',
            value: plan && !plan.keep ? rate(plan.video) : '—',
          },
      {
        label: 'Audio',
        value: !clip
          ? '—'
          : this.audioPlanFor(clip) === 'remove'
            ? 'None'
            : rate(this.audioBitsFor(clip)),
      },
      {
        label: many ? 'Frame, this video' : 'Frame',
        value: size ? `${size.width} × ${size.height}` : '—',
      },
      { label: 'Frame rate', value: fps ? formatFps(fps) : '—' },
    ];
  }

  get warning() {
    if (this.intake.error) return this.intake.error;
    if (this.support && this.support.encoders.size === 0) return NO_ENCODER;
    const broken = this.clips.length - this.usable.length;
    const failed = this.clips.filter((c) => c.failed).length;
    if (failed)
      return `Couldn't compress ${plural(failed, 'video')}. Try another codec or container.`;
    if (this.mode === 1 && this.loaded && !this.reading && this.targetIndex < 0)
      return this.blockedTargets.length === TARGET_MB.length
        ? this.usable.length > 1
          ? 'These videos are all under 8 MB already.'
          : 'This video is already under 8 MB.'
        : 'Pick a target size.';
    const plans = this.plans.map(({ plan }) => plan);
    const tooSmall = plans.filter((p) => p?.tooSmall).length;
    const lean = plans.filter((p) => p?.lean).length;
    const one = this.usable.length === 1;
    if (tooSmall)
      return one
        ? 'Too small for a video this long. Lower the resolution or remove the audio.'
        : `Too small for ${plural(tooSmall, 'long video')}. Lower the resolution or remove the audio.`;
    if (lean)
      return one
        ? 'This video is already lean at these settings, so it may not shrink much.'
        : `${plural(lean, 'video')} already lean at these settings, so may not shrink much.`;
    if (broken)
      return `${plural(broken, 'file')} can't be read and will be skipped.`;
    return '';
  }

  get codecNote() {
    if (this.container === 'webm') return 'WebM holds VP9 or AV1 only.';
    return this.codec ? CODEC_NOTES[this.codec] : '';
  }

  get runTitle() {
    if (this.busy) return 'Compressing…';
    const n = this.usable.length;
    return n > 1 ? `Compress ${n} videos` : 'Compress';
  }

  get bannerTitle() {
    const n = this.usable.length;
    return n > 1 ? `Compressing ${this.current} of ${n}…` : 'Compressing…';
  }

  get single() {
    return this.usable.length === 1;
  }

  #name(clip: Clip) {
    const r = clip.result!;
    const base = clip.file.name.replace(/\.[^.]+$/, '') || 'video';
    return r.kept ? clip.file.name : `${base}-compressed.${r.ext}`;
  }

  get singleResult() {
    const clip = this.usable[0];
    if (!this.single || !clip?.result) return null;
    const r = clip.result;
    return {
      name: this.#name(clip),
      detail: r.kept
        ? 'Already under the target, kept as it is'
        : `${r.ext.toUpperCase()} · ${formatBytes(r.blob.size)} · ${saving(clip.file.size, r.blob.size)}`,
    };
  }

  outputs = (): NamedBlob[] =>
    this.usable.flatMap((clip) =>
      clip.result ? [{ name: this.#name(clip), blob: clip.result.blob }] : [],
    );

  // ---------- the preview ----------

  get previewAspect() {
    return Math.max(this.aspect, 1 / tallest);
  }

  /** The selected video's compressed file, when it has one. */
  get resultUrl() {
    return this.selected?.result?.url ?? '';
  }

  get playUrl() {
    return (this.view === 1 && this.resultUrl) || this.intake.url || undefined;
  }

  get canCompare() {
    return !!(this.selected?.before && this.selected.after);
  }

  get comparing() {
    return this.compareOn && this.canCompare;
  }

  metadata = (event: Event) => {
    if (this.view === 0) this.intake.ready(event);
    const video = event.target as HTMLVideoElement;
    if (video.videoWidth && video.videoHeight)
      this.aspect = video.videoWidth / video.videoHeight;
  };

  /** The selected video's compare frames and report, once it has a result. */
  async #prepare(id: number) {
    const clip = this.clips.find((c) => c.id === id);
    const r = clip?.result;
    if (!clip || !r || r.kept || clip.before) return;
    const job = this.#job;
    const p = clip.probe;
    if (p) {
      const scale = Math.min(1, COMPARE_MAX / Math.max(p.width, p.height));
      const width = even(p.width * scale);
      const height = even(p.height * scale);
      const time = (clip.rates?.duration ?? 0) * 0.4;
      const [before, after] = await Promise.all([
        frameAt(clip.file, time, width, height),
        frameAt(r.blob, time, width, height),
      ]);
      const now = this.clips.find((c) => c.id === id);
      if (job !== this.#job || now?.result !== r || !before || !after) {
        for (const url of [before, after]) if (url) URL.revokeObjectURL(url);
      } else this.#patch(id, { before, after });
    }
    try {
      const name = this.#name(clip);
      const tracks = await analyzeMedia(
        new File([r.blob], name, { type: r.blob.type }),
      );
      const now = this.clips.find((c) => c.id === id);
      if (job === this.#job && now?.result === r)
        this.#patch(id, { info: sections(tracks) });
    } catch {
      // no report: the section stays hidden
    }
  }

  // ---------- settings ----------

  #changed() {
    if (!this.clips.some((c) => c.result || c.failed)) return;
    for (const clip of this.clips) this.#release(clip);
    this.clips = this.clips.map((clip) => ({
      ...clip,
      result: null,
      failed: false,
      before: '',
      after: '',
      info: [],
    }));
    this.view = 0;
    this.compareOn = false;
  }

  pickMode = (i: number) => {
    this.mode = i;
    this.#changed();
  };
  pickPreset = (i: number) => {
    this.preset = i;
    this.#changed();
  };
  pickTarget = (i: number) => {
    this.target = i;
    this.#changed();
  };
  pickResolution = (i: number) => {
    this.resolution = i;
    this.#changed();
  };
  pickRate = (i: number) => {
    this.frameRate = i;
    this.#changed();
  };
  pickContainer = (i: number) => {
    this.containerPick = i;
    this.#changed();
  };
  pickCodec = (i: number) => {
    this.codecPick = i;
    this.#changed();
  };
  setRemoveAudio = (on: boolean) => {
    this.removeAudio = on;
    this.#changed();
  };
  pickView = (i: number) => {
    this.playback.pause();
    this.view = i;
  };
  setCompare = (on: boolean) => {
    this.playback.pause();
    this.compareOn = on;
  };

  // ---------- the job ----------

  compress = () => void this.#compress();

  async #compress() {
    const codec = this.codec;
    if (!this.ready || !codec) return;
    this.#changed();
    const job = ++this.#job;
    const todo = this.plans;
    const n = todo.length;
    this.busy = true;
    this.progress = 0;
    this.playback.pause();
    try {
      for (const [i, { clip, plan }] of todo.entries()) {
        this.current = i + 1;
        if (plan!.keep) {
          const ext = clip.file.name.split('.').pop() ?? 'mp4';
          this.#patch(clip.id, {
            result: { blob: clip.file, url: '', ext, kept: true },
          });
          this.progress = (i + 1) / n;
          continue;
        }
        const abort = new AbortController();
        this.#abort = abort;
        try {
          const out = await compressVideo(clip.file, {
            container: this.container,
            codec,
            size: this.sizeFor(clip),
            frameRate: this.fpsFor(clip),
            videoBitrate: plan!.video,
            audio: this.audioPlanFor(clip),
            signal: abort.signal,
            onProgress: (share) => {
              if (job === this.#job) this.progress = (i + share) / n;
            },
          });
          if (job !== this.#job) return;
          this.#patch(clip.id, {
            failed: false,
            result: {
              blob: out.blob,
              url: URL.createObjectURL(out.blob),
              ext: out.ext,
              kept: false,
            },
          });
        } catch (error) {
          if (job !== this.#job) return;
          if ((error as Error).name === 'AbortError') return;
          console.error('Compress failed:', error);
          this.#patch(clip.id, { failed: true });
        } finally {
          if (this.#abort === abort) this.#abort = null;
        }
        this.progress = (i + 1) / n;
      }
      const shown = this.selected;
      if (shown?.result && !shown.result.kept) this.view = 1;
      if (shown) void this.#prepare(shown.id);
    } finally {
      if (job === this.#job) this.busy = false;
    }
  }

  cancel = () => {
    this.#job++;
    this.#abort?.abort();
    this.#abort = null;
    this.busy = false;
    this.progress = 0;
  };

  save = () => {
    const clip = this.usable[0];
    if (clip?.result) downloadBlob(clip.result.blob, this.#name(clip));
  };

  <template>
    <CanonSplit
      class="video-compressor"
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
              @after={{this.shownBytes}}
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
            <CanonHeading @text="Target size, each video" />
            <CanonSegmented
              @items={{TARGETS}}
              @selected={{this.targetIndex}}
              @disabledIndices={{this.blockedTargets}}
              @disabled={{this.busy}}
              @onChange={{this.pickTarget}}
            />
          {{else}}
            <CanonHeading @text="Quality" />
            <CanonSegmented
              @items={{PRESETS}}
              @selected={{this.preset}}
              @disabled={{this.busy}}
              @onChange={{this.pickPreset}}
            />
          {{/if}}
          <CanonHeading @text="Resolution" />
          <CanonSegmented
            @items={{RESOLUTIONS}}
            @selected={{this.resolutionIndex}}
            @disabledIndices={{this.blockedResolutions}}
            @disabled={{this.busy}}
            @onChange={{this.pickResolution}}
          />
          <CanonHeading @text="Frame rate" />
          <CanonSegmented
            @items={{RATES}}
            @selected={{this.rateIndex}}
            @disabledIndices={{this.blockedRates}}
            @disabled={{this.busy}}
            @onChange={{this.pickRate}}
          />
          <CanonHeading @text="Container" />
          <CanonSegmented
            @items={{containerLabels}}
            @selected={{this.containerIndex}}
            @disabledIndices={{this.blockedContainers}}
            @disabled={{this.busy}}
            @onChange={{this.pickContainer}}
          />
          <CanonHeading @text="Codec" />
          <CanonSegmented
            @items={{CODEC_LABELS}}
            @selected={{this.codecIndex}}
            @disabledIndices={{this.blockedCodecs}}
            @disabled={{this.busy}}
            @onChange={{this.pickCodec}}
          />
          {{#if this.codecNote}}
            <CanonEmptyRow @text={{this.codecNote}} />
          {{/if}}
          <CanonRow @title="Remove audio" as |titleId|>
            <CanonSwitch
              aria-labelledby={{titleId}}
              @on={{this.removeAudio}}
              @disabled={{if this.loaded this.busy true}}
              @onChange={{this.setRemoveAudio}}
            />
          </CanonRow>
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
                class="vc-save-all"
                @files={{this.outputs}}
                @zipName="videos-compressed.zip"
              />
            {{/unless}}
          {{/if}}
        </CanonRows>
      </:sidebar>
      <:main>
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Videos" />
          {{#each this.rows as |row|}}
            <CanonRow
              class="vc-source {{if row.on 'vc-source--on'}}"
              @title={{row.clip.file.name}}
              @detail={{row.detail}}
              @form="flush"
            >
              <CanonButton
                class="vc-view"
                @kind="cell"
                @text={{if row.on "Viewing" "View"}}
                @icon={{Eye}}
                @disabled={{row.clip.broken}}
                @onClick={{fn this.select row.clip.id}}
              />
              <CanonButton
                class="vc-remove"
                @kind="cell"
                @text="Remove"
                @icon={{Remove}}
                @disabled={{this.busy}}
                @onClick={{fn this.remove row.clip.id}}
              />
            </CanonRow>
          {{/each}}
          <Slot
            class="vc-slot"
            @prompt={{if this.loaded "Add more videos" "Drop videos here"}}
            @icon="shrink"
            @row={{true}}
            @multiple={{true}}
            @accept={{ACCEPT}}
            @over={{this.drop.over}}
            @onFiles={{this.add}}
          />
          {{#if this.loaded}}
            <CanonButton
              class="vc-clear"
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
                @disabled={{if this.canCompare false true}}
                @onChange={{this.setCompare}}
              />
            </CanonRow>
          {{/if}}
        </CanonRows>
        <CanonCanvas
          class="vc-preview"
          @aspect={{this.previewAspect}}
          @maxHeight={{tallestPreview}}
          @boxing="unlessWide"
          @background={{if this.loaded "#000" "var(--canon-muted)"}}
        >
          {{#if this.intake.url}}
            {{! the transport is its control; user media lacks captions }}
            {{! template-lint-disable require-media-caption }}
            <video
              class="vc-video {{if this.comparing 'vc-hidden'}}"
              src={{this.playUrl}}
              playsinline
              preload="metadata"
              {{this.intake.register}}
              {{this.playback.register}}
              {{on "loadedmetadata" this.metadata}}
              {{on "error" this.intake.failed}}
            ></video>
            {{#if this.comparing}}
              <div class="vc-compare">
                <CanonImageCompare
                  @before={{this.selected.before}}
                  @after={{this.selected.after}}
                  @beforeTitle="Original"
                  @afterTitle="Compressed"
                />
              </div>
            {{/if}}
          {{/if}}
        </CanonCanvas>
        {{#if this.selected}}
          <Sections @sections={{this.selected.info}} />
        {{/if}}
      </:main>
      <:footer>
        <Transport
          @playback={{this.playback}}
          @ready={{if this.intake.duration true false}}
        />
      </:footer>
    </CanonSplit>
  </template>
}
