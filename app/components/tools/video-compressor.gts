import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
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
import {
  formatFps,
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
  type ConvertResult,
  type SourceRates,
} from 'xsenze-tools/lib/media-convert';
import Drop from 'xsenze-tools/components/tools/media/drop';
import Job from 'xsenze-tools/components/tools/media/job';
import Playback from 'xsenze-tools/components/tools/media/playback';
import Sections from 'xsenze-tools/components/tools/media/sections';
import Slot from 'xsenze-tools/components/tools/media/slot';
import Transport from 'xsenze-tools/components/tools/media/transport';
import { frameAt } from 'xsenze-tools/components/tools/media/frames';
import './media/media.css';
import './video-compressor.css';

const ACCEPT = acceptAttr(VIDEO_ACCEPT);
const COMPRESS_ERROR =
  "Couldn't compress this video. Try another codec or container.";
const NO_ENCODER = "This browser can't encode video. Try Chrome or Edge.";
const TOO_SMALL =
  'Too small for a video this long. Lower the resolution or remove the audio.';
const ALREADY_LEAN =
  'This video is already lean at these settings, so it may not shrink much.';
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

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

function rate(bps: number) {
  return bps >= 1e6
    ? `${(bps / 1e6).toFixed(1)} Mbps`
    : `${Math.round(bps / 1000)} kbps`;
}

/** Smaller videos from mediabunny's WebCodecs transcode, on the device. */
export default class VideoCompressor extends Component {
  intake = new VideoIntake({
    onLoad: () => this.#reset(),
    probe: true,
    onProbe: (probe) => void this.#inspect(probe),
    canLoad: () => !this.busy,
  });
  drop = new Drop(ACCEPT, (file) => this.intake.load(file));
  playback = new Playback();

  @tracked mode = 0;
  @tracked preset = 1;
  @tracked target = 1;
  @tracked resolution = 0;
  @tracked frameRate = 0;
  @tracked containerPick = 0;
  @tracked codecPick = 0;
  @tracked removeAudio = false;

  @tracked support: CompressSupport | null = null;
  @tracked rates: SourceRates | null = null;
  @tracked busy = false;
  @tracked progress = 0;
  @tracked failed = false;
  @tracked result: ConvertResult | null = null;
  @tracked resultUrl = '';
  @tracked view = 0;
  @tracked before = '';
  @tracked after = '';
  @tracked aspect = 16 / 9;
  @tracked info: Section[] = [];

  #token = 0;
  #job = 0;
  #abort: AbortController | null = null;

  willDestroy() {
    super.willDestroy();
    this.#job++;
    this.#token++;
    this.#abort?.abort();
    this.intake.release();
    this.#releaseResult();
  }

  get loaded() {
    return this.intake.url !== null;
  }

  get probe() {
    return this.intake.probe;
  }

  get hasAudio() {
    return (this.probe?.audioTracks ?? 0) > 0;
  }

  get duration() {
    return this.rates?.duration || this.intake.duration;
  }

  get sourceFps() {
    return this.probe?.fps ?? 30;
  }

  get shortSide() {
    const p = this.probe;
    return p ? Math.min(p.width, p.height) : 0;
  }

  // ---------- choices the source rules out ----------

  get blockedResolutions() {
    const short = this.shortSide;
    if (!short) return [];
    return SHORT_SIDES.flatMap((side, i) => (side && side >= short ? [i] : []));
  }

  get blockedRates() {
    return RATES_FPS.flatMap((fps, i) =>
      fps && fps >= this.sourceFps - 0.5 ? [i] : [],
    );
  }

  get blockedTargets() {
    const size = this.intake.file?.size ?? 0;
    if (!size) return [];
    return TARGET_MB.flatMap((mb, i) => (mb * MB >= size ? [i] : []));
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

  // ---------- the plan ----------

  /** Null keeps the source's size. */
  get outSize() {
    const p = this.probe;
    const side = SHORT_SIDES[this.resolutionIndex] ?? 0;
    if (!p || !side) return null;
    const scale = side / Math.min(p.width, p.height);
    return { width: even(p.width * scale), height: even(p.height * scale) };
  }

  get outFps() {
    return RATES_FPS[this.rateIndex] || null;
  }

  get audioPlan(): 'remove' | 'copy' | number {
    if (!this.hasAudio || this.removeAudio) return 'remove';
    const source = this.rates?.audio ?? 0;
    return source > 0 && source <= AUDIO_COPY_MAX ? 'copy' : AUDIO_BITRATE;
  }

  get audioBits() {
    const plan = this.audioPlan;
    if (plan === 'remove') return 0;
    return plan === 'copy' ? (this.rates?.audio ?? 0) : plan;
  }

  get plan() {
    const p = this.probe;
    const duration = this.duration;
    if (!p || !duration || !this.codec) return null;
    const size = this.outSize ?? { width: p.width, height: p.height };
    const fps = this.outFps ?? this.sourceFps;
    const audio = this.audioBits;
    const source = this.rates?.video ?? 0;
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
      // 4 % headroom so the file lands under the target
      video = (mb * MB * 8 * 0.96) / OVERHEAD / duration - audio;
      if (video < FLOOR) {
        video = FLOOR;
        tooSmall = true;
      }
    }
    const bytes = Math.round(((video + audio) * duration * OVERHEAD) / 8);
    return { video: Math.round(video), bytes, lean, tooSmall };
  }

  get ready() {
    return !this.busy && this.plan !== null && !!this.intake.file;
  }

  get locked() {
    return this.busy || !this.loaded;
  }

  // ---------- readouts ----------

  get sourceBytes() {
    return this.intake.file?.size ?? 0;
  }

  get shownBytes() {
    return this.result?.blob.size ?? this.plan?.bytes ?? 0;
  }

  get scaleFormat() {
    const ext = this.container.toUpperCase();
    return this.result ? ext : `Estimate · ${ext}`;
  }

  get saving() {
    const before = this.sourceBytes;
    const after = this.shownBytes;
    if (!before || !after) return '';
    const pct = Math.round((1 - after / before) * 100);
    return pct >= 0 ? `−${pct}%` : `+${-pct}%`;
  }

  get tiles() {
    const plan = this.plan;
    const size = this.outSize ?? this.probe;
    const fps = this.outFps ?? this.probe?.fps;
    return [
      {
        label: this.result ? 'Size' : 'Estimate',
        value: this.shownBytes ? formatBytes(this.shownBytes) : '—',
      },
      { label: 'Saving', value: this.saving || '—' },
      { label: 'Video bitrate', value: plan ? rate(plan.video) : '—' },
      {
        label: 'Audio',
        value: !this.loaded
          ? '—'
          : this.audioPlan === 'remove'
            ? 'None'
            : rate(this.audioBits),
      },
      {
        label: 'Frame',
        value: size ? `${size.width} × ${size.height}` : '—',
      },
      { label: 'Frame rate', value: fps ? formatFps(fps) : '—' },
    ];
  }

  get warning() {
    if (this.intake.error) return this.intake.error;
    if (this.support && this.support.encoders.size === 0) return NO_ENCODER;
    if (this.mode === 1 && this.loaded && this.targetIndex < 0)
      return this.blockedTargets.length === TARGET_MB.length
        ? 'This video is already under 8 MB.'
        : 'Pick a target size.';
    if (this.plan?.tooSmall) return TOO_SMALL;
    if (this.plan?.lean) return ALREADY_LEAN;
    return '';
  }

  get codecNote() {
    if (this.container === 'webm') return 'WebM holds VP9 or AV1 only.';
    return this.codec ? CODEC_NOTES[this.codec] : '';
  }

  get meta() {
    const p = this.probe;
    if (!p) return '';
    const parts = [`${p.width} × ${p.height}`];
    if (p.fps) parts.push(formatFps(p.fps));
    parts.push(formatTimestamp(this.intake.duration * 1000, '.'));
    parts.push(formatBytes(this.sourceBytes));
    return parts.join(' · ');
  }

  get previewAspect() {
    return Math.max(this.aspect, 1 / tallest);
  }

  get playUrl() {
    return (this.view === 1 && this.resultUrl) || this.intake.url || undefined;
  }

  get comparing() {
    return !!(this.before && this.after);
  }

  get fileName() {
    const base = this.intake.baseName || 'video';
    return this.result ? `${base}-compressed.${this.result.ext}` : '';
  }

  get resultRow() {
    if (!this.result) return null;
    const size = formatBytes(this.result.blob.size);
    return {
      name: this.fileName,
      detail: `${this.result.ext.toUpperCase()} · ${size} · ${this.saving}`,
    };
  }

  // ---------- loading ----------

  async #inspect(probe: VideoProbe | null) {
    const token = this.#token;
    const file = this.intake.file;
    if (!probe || !file) {
      this.failed = true;
      return;
    }
    const [support, rates] = await Promise.all([
      compressSupport(even(probe.width), even(probe.height)),
      sourceRates(file).catch(() => null),
    ]);
    if (token !== this.#token) return;
    this.support = support;
    this.rates = rates;
  }

  metadata = (event: Event) => {
    if (this.view === 0) this.intake.ready(event);
    const video = event.target as HTMLVideoElement;
    if (video.videoWidth && video.videoHeight)
      this.aspect = video.videoWidth / video.videoHeight;
  };

  // ---------- settings ----------

  #changed() {
    this.failed = false;
    this.#releaseResult();
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

  // ---------- the job ----------

  compress = () => void this.#compress();

  async #compress() {
    const file = this.intake.file;
    const plan = this.plan;
    const codec = this.codec;
    if (!file || !plan || !codec || !this.ready) return;
    const job = ++this.#job;
    this.busy = true;
    this.progress = 0;
    this.failed = false;
    this.#releaseResult();
    this.playback.pause();
    const abort = new AbortController();
    this.#abort = abort;
    try {
      const result = await compressVideo(file, {
        container: this.container,
        codec,
        size: this.outSize,
        frameRate: this.outFps,
        videoBitrate: plan.video,
        audio: this.audioPlan,
        signal: abort.signal,
        onProgress: (fraction) => {
          if (job === this.#job) this.progress = fraction;
        },
      });
      if (job !== this.#job) return;
      this.result = result;
      this.resultUrl = URL.createObjectURL(result.blob);
      this.view = 1;
      void this.#compare(file, result, job);
      void this.#describe(result, job);
    } catch (error) {
      if (job !== this.#job) return;
      if ((error as Error).name === 'AbortError') return;
      console.error('Compress failed:', error);
      this.failed = true;
    } finally {
      if (this.#abort === abort) this.#abort = null;
      if (job === this.#job) this.busy = false;
    }
  }

  /** The same frame from both files, drawn at one size. */
  async #compare(file: File, result: ConvertResult, job: number) {
    const p = this.probe;
    if (!p) return;
    const scale = Math.min(1, COMPARE_MAX / Math.max(p.width, p.height));
    const width = even(p.width * scale);
    const height = even(p.height * scale);
    const time = this.duration * 0.4;
    const [before, after] = await Promise.all([
      frameAt(file, time, width, height),
      frameAt(result.blob, time, width, height),
    ]);
    if (job !== this.#job || !before || !after) {
      for (const url of [before, after]) if (url) URL.revokeObjectURL(url);
      return;
    }
    this.before = before;
    this.after = after;
  }

  async #describe(result: ConvertResult, job: number) {
    try {
      const tracks = await analyzeMedia(
        new File([result.blob], this.fileName, { type: result.blob.type }),
      );
      if (job === this.#job) this.info = sections(tracks);
    } catch {
      // no report: the section stays hidden
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
    if (this.result) downloadBlob(this.result.blob, this.fileName);
  };

  #releaseResult() {
    const urls = [this.resultUrl, this.before, this.after];
    this.resultUrl = '';
    this.before = '';
    this.after = '';
    // the player lets go of it on the next render
    setTimeout(() => {
      for (const url of urls) if (url) URL.revokeObjectURL(url);
    });
    this.result = null;
    this.info = [];
    this.view = 0;
  }

  #reset() {
    this.#token++;
    this.#job++;
    this.#abort?.abort();
    this.#abort = null;
    this.#releaseResult();
    this.support = null;
    this.rates = null;
    this.busy = false;
    this.progress = 0;
    this.failed = false;
  }

  clear = () => {
    this.playback.unload();
    this.#reset();
    this.aspect = 16 / 9;
    this.intake.clear();
  };

  <template>
    <CanonSplit
      class="video-compressor"
      @bannerSticks={{true}}
      @mainLeadsStacked={{true}}
      {{filePaste this.intake.load accept=ACCEPT}}
      {{on "dragover" this.drop.enter}}
      {{on "dragleave" this.drop.leave}}
      {{on "drop" this.drop.drop}}
    >
      <:banner>
        <CanonCanvas @height={{scaleHeight}}>
          <CanonCompressionScale
            @before={{this.sourceBytes}}
            @after={{this.shownBytes}}
            @format={{this.scaleFormat}}
            @working={{this.busy}}
          />
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
            <CanonHeading @text="Target size" />
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
              @disabled={{if this.hasAudio this.busy true}}
              @onChange={{this.setRemoveAudio}}
            />
          </CanonRow>
          <CanonHeading @text="Output" />
          <CanonTiles @items={{this.tiles}} />
          <Job
            @title="Compress"
            @icon={{Shrink}}
            @failure={{COMPRESS_ERROR}}
            @disabled={{if this.ready false true}}
            @busy={{this.busy}}
            @progress={{this.progress}}
            @failed={{this.failed}}
            @result={{this.resultRow}}
            @onRun={{this.compress}}
            @onCancel={{this.cancel}}
            @onSave={{this.save}}
          />
        </CanonRows>
      </:sidebar>
      <:main>
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Source" />
          {{#if this.loaded}}
            <CanonRow
              class="vc-source"
              @title={{this.intake.fileName}}
              @detail={{this.meta}}
              @form="flush"
            >
              <CanonButton
                @kind="cell"
                @text="Clear"
                @icon={{Trash}}
                @disabled={{this.busy}}
                @onClick={{this.clear}}
              />
            </CanonRow>
          {{else}}
            <Slot
              class="vc-slot"
              @prompt="Drop a video here"
              @icon="shrink"
              @row={{true}}
              @accept={{ACCEPT}}
              @over={{this.drop.over}}
              @onFile={{this.intake.load}}
            />
          {{/if}}
          {{#if this.warning}}
            <CanonStatus @text={{this.warning}} @tone="warn" @row={{true}} />
          {{/if}}
          {{#if this.result}}
            <CanonSegmented
              @items={{VIEWS}}
              @selected={{this.view}}
              @onChange={{this.pickView}}
            />
          {{/if}}
        </CanonRows>
        <CanonCanvas
          class="vc-preview"
          @aspect={{this.previewAspect}}
          @maxHeight={{tallestPreview}}
          @boxing="unlessWide"
          @background={{if this.loaded "#000" "var(--canon-muted)"}}
        >
          {{#if this.loaded}}
            {{! the transport is its control; user media lacks captions }}
            {{! template-lint-disable require-media-caption }}
            <video
              class="vc-video"
              src={{this.playUrl}}
              playsinline
              preload="metadata"
              {{this.intake.register}}
              {{this.playback.register}}
              {{on "loadedmetadata" this.metadata}}
              {{on "error" this.intake.failed}}
            ></video>
          {{/if}}
        </CanonCanvas>
        {{#if this.comparing}}
          <CanonRows @framed={{true}}>
            <CanonHeading @text="Compare one frame" />
          </CanonRows>
          <CanonCanvas
            class="vc-compare"
            @aspect={{this.previewAspect}}
            @maxHeight={{tallestPreview}}
            @boxing="unlessWide"
            @background="#000"
          >
            <CanonImageCompare
              @before={{this.before}}
              @after={{this.after}}
              @beforeTitle="Original"
              @afterTitle="Compressed"
            />
          </CanonCanvas>
        {{/if}}
        <Sections @sections={{this.info}} />
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
