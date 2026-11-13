import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import type Owner from '@ember/owner';
import CanonBar from 'delphicanon/components/canon-bar';
import CanonButton from 'delphicanon/components/canon-button';
import CanonCanvas from 'delphicanon/components/canon-canvas';
import CanonDropZone from 'delphicanon/components/canon-drop-zone';
import CanonEmptyRow from 'delphicanon/components/canon-empty-row';
import CanonHeading from 'delphicanon/components/canon-heading';
import CanonLoader from 'delphicanon/components/canon-loader';
import CanonRow from 'delphicanon/components/canon-row';
import CanonRows from 'delphicanon/components/canon-rows';
import CanonSegmented from 'delphicanon/components/canon-segmented';
import CanonSplit from 'delphicanon/components/canon-split';
import CanonStatus from 'delphicanon/components/canon-status';
import { IconSvg } from 'xsenze-tools/components/icon';
import CueRow from 'xsenze-tools/components/tools/media/cue-row';
import DownloadAll from 'xsenze-tools/components/tools/media/download-all';
import { peakBuckets } from 'xsenze-tools/components/tools/media/frames';
import Playback from 'xsenze-tools/components/tools/media/playback';
import Transport from 'xsenze-tools/components/tools/media/transport';
import LanguageSelect, {
  flagOf,
  languageOf,
} from 'xsenze-tools/components/tools/subtitle-translator/language-select';
import Picture, {
  type DubLane,
  type SpeakerLane,
} from 'xsenze-tools/components/tools/audio-dub/picture';
import Speakers from 'xsenze-tools/components/tools/audio-dub/speakers';
import {
  channelsOf,
  encodeWav,
  extractPeaks,
  type WaveformPeaks,
} from 'xsenze-tools/lib/audio';
import { downloadBlob } from 'xsenze-tools/lib/download';
import { detectLanguage } from 'xsenze-tools/lib/dub/detect-language';
import {
  CLONE_RATE,
  CLONE_SECONDS,
  DUB_LANGUAGES,
  ENGINES,
  engineInfo,
  iso3,
  pickEngine,
  type EngineChoice,
  type EngineId,
  type Preset,
} from 'xsenze-tools/lib/dub/engines';
import {
  MAX_SPEED,
  decodeForMix,
  renderDub,
  seconds,
  type Background,
  type PlacedLine,
} from 'xsenze-tools/lib/dub/mix';
import { hasVideo, videoWithAudio } from 'xsenze-tools/lib/dub/mux';
import {
  assignPresets,
  diarize,
  mono16k,
  speakerLabel,
  voiceClips,
  type Speaker,
  type VoiceMode,
  type VoiceType,
} from 'xsenze-tools/lib/dub/speakers';
import { speak, type CloneRef } from 'xsenze-tools/lib/dub/voice';
import { formatBytes } from 'xsenze-tools/lib/format';
import {
  detectFormat,
  formatTimestamp,
  parseSubtitles,
  writeSrt,
  type Cue,
} from 'xsenze-tools/lib/subtitles';
import {
  AUDIO_ACCEPT,
  SUBTITLE_ACCEPT,
  VIDEO_ACCEPT,
  acceptAttr,
} from 'xsenze-tools/lib/tools';
import { transcribe } from 'xsenze-tools/lib/transcribe';
import {
  TRANSLATE_LANGUAGES,
  prepareCue,
  restoreCue,
  translateTexts,
} from 'xsenze-tools/lib/translate';
import type { NamedBlob } from 'xsenze-tools/lib/zip-files';
import filePaste from 'xsenze-tools/modifiers/file-paste';
import './media/media.css';
import './audio-dub/audio-dub.css';

type JobState = 'waiting' | 'running' | 'done' | 'failed' | 'stopped';
type Stage = 'translate' | 'voice' | 'mix';

interface Job {
  code: string;
  state: JobState;
  stage?: Stage;
  engine?: EngineId;
  /** Lines voiced so far. */
  done: number;
  /** Translated lines, by cue index. */
  lines: string[];
  /** Distinct voices used, for the row. */
  voices?: Preset[];
  /** The mixed track, kept for the multi-language video. */
  mix?: AudioBuffer;
  /** The download: WAV for audio, MP4 for video. */
  file?: Blob;
  url?: string;
  error?: string;
}

const MEDIA_ACCEPT = acceptAttr([...AUDIO_ACCEPT, ...VIDEO_ACCEPT]);
const SUBS_ACCEPT = acceptAttr(SUBTITLE_ACCEPT);
const BAND_MIN = 150;
const BAND_MAX = 320;
const LANE_HEIGHT = 22;
/** Whisper Small: the Auto Subtitle default, a balance of accuracy and size. */
const WHISPER_MODE = 'reasonable';

const VOICES: VoiceMode[] = ['auto', 'female', 'male'];
const VOICE_LABELS = ['Auto', 'Female', 'Male'];
const VOICE_NOTES: Record<VoiceMode, string> = {
  auto: 'Each speaker gets a matching voice of their own: women and children a female voice, men a male one.',
  female: 'Every speaker gets a female voice, a different one each.',
  male: 'Every speaker gets a male voice, a different one each.',
};
/** 0 is Auto: find how many. */
const SPEAKER_COUNTS = [0, 1, 2, 3, 4, 5, 6];
const SPEAKER_LABELS = ['Auto', '1', '2', '3', '4', '5', '6'];
const BACKGROUNDS: Background[] = ['duck', 'dub'];
const BACKGROUND_LABELS = ['Keep quietly', 'Dub only'];
const BACKGROUND_NOTES: Record<Background, string> = {
  duck: 'The original plays softly under the new voice: music and effects stay.',
  dub: 'Only the new voice: the original audio is left out.',
};
const ENGINE_CHOICES: EngineChoice[] = ['auto', ...ENGINES.map((e) => e.id)];
const ENGINE_LABELS = ['Auto', ...ENGINES.map((e) => e.short)];

/** Languages listed in the picker that no engine voices yet. */
const SOON = new Set(
  TRANSLATE_LANGUAGES.map((l) => l.code).filter((c) => !DUB_LANGUAGES.has(c)),
);

const FileIcon = <template><IconSvg @name="audio-waveform" /></template>;
const SubsIcon = <template><IconSvg @name="captions" /></template>;
const Run = <template><IconSvg @name="languages" /></template>;
const Save = <template><IconSvg @name="download" /></template>;
const Cancel = <template><IconSvg @name="x" /></template>;
const Remove = <template><IconSvg @name="x" /></template>;
const Trash = <template><IconSvg @name="trash-2" /></template>;
const Redo = <template><IconSvg @name="rotate-ccw" /></template>;
const Film = <template><IconSvg @name="film" /></template>;

const keepPaste = (event: Event) => event.stopPropagation();
const nameOf = (code: string) => languageOf(code)?.name ?? code;

/** Engine and voices for a finished row; one-voice engines name none. */
const voiceLabel = (engine: EngineId, voices: Preset[]) => {
  const info = engineInfo(engine);
  if (info.clones)
    return voices.length === 1
      ? `${info.name} · cloned voice`
      : `${info.name} · ${voices.length} cloned voices`;
  if (info.voices.length < 2) return `${info.name} · single voice`;
  return voices.length === 1
    ? `${info.name} · ${voices[0]}`
    : `${info.name} · ${voices.length} voices`;
};

const baseName = (name: string) => name.replace(/\.[^.]+$/, '') || 'audio';

const STAGE_TEXT: Record<Stage, string> = {
  translate: 'Translating…',
  voice: 'Voicing…',
  mix: 'Mixing…',
};

/**
 * Dub audio or video into several languages on the device: transcribe once
 * (Whisper), then for each language translate (NLLB), voice each line with the
 * best engine for that language, fit it to its slot and mix over the original.
 */
export default class AudioDubTool extends Component {
  playback = new Playback();

  @tracked file: File | null = null;
  @tracked video = false;
  @tracked original: AudioBuffer | null = null;
  @tracked peaks: WaveformPeaks | null = null;
  @tracked loadError = '';

  @tracked cues: Cue[] = [];
  @tracked scriptSource: 'whisper' | 'file' | '' = '';
  @tracked from = '';
  @tracked detected = '';

  @tracked targets: string[] = ['hi'];
  @tracked voice: VoiceMode = 'auto';
  @tracked speakerCount = 0;
  @tracked speakers: Speaker[] = [];
  /** Speaker index of each cue. */
  @tracked assign: number[] = [];
  /** A script line whose speaker is being picked. */
  @tracked moving: number | null = null;
  /** Who is being voiced, for the status line. */
  @tracked speaking = '';
  @tracked background: Background = 'duck';
  @tracked engine: EngineChoice = 'auto';

  @tracked jobs: Job[] = [];
  @tracked busy = false;
  @tracked phase: 'transcribe' | 'speakers' | 'dub' | 'video' | '' = '';
  @tracked percent = 0;
  @tracked downloading = false;
  /** Which model is downloading, for the status line. */
  @tracked downloadWhat: 'translation' | 'voice' = 'voice';
  @tracked current = '';
  @tracked tab = '';
  @tracked error = '';
  @tracked combined: { blob: Blob; url: string } | null = null;
  #abort: AbortController | null = null;
  /** Each speaker's clip for cloning, made once per run; keys stay unique across runs. */
  #clips: Float32Array[] | null = null;
  #clipRun = 0;
  #sample: HTMLAudioElement | null = null;

  // ?adSample=<same-origin path> ?adSubs=<srt> ?adTo=hi,de ?adRun=1: preset the tool from the URL
  constructor(owner: Owner, args: object) {
    super(owner, args);
    const query = new URLSearchParams(window.location.search);
    const to = (query.get('adTo') ?? '')
      .split(',')
      .filter((c) => DUB_LANGUAGES.has(c));
    if (to.length) this.targets = to;
    const voice = query.get('adVoice');
    if (voice === 'male' || voice === 'female') this.voice = voice;
    const count = Number(query.get('adSpeakers'));
    if (SPEAKER_COUNTS.includes(count)) this.speakerCount = count;
    const subs = query.get('adSubs');
    const sample = query.get('adSample');
    if (sample?.startsWith('/') && !sample.startsWith('//'))
      void this.#fetchSample(sample, subs, query.get('adRun') === '1');
  }

  willDestroy() {
    super.willDestroy();
    this.#abort?.abort();
    this.#revoke();
    this.#stopSample();
  }

  async #fetchSample(url: string, subs: string | null, run: boolean) {
    const response = await fetch(url).catch(() => null);
    if (!response?.ok || this.isDestroying) return;
    const blob = await response.blob();
    const name = url.split('/').pop() || 'audio';
    await this.#load(new File([blob], name, { type: blob.type }));
    if (subs) this.#setScript(subs);
    if (run && !this.isDestroying) void this.dub();
  }

  /* --- source --- */

  get fileName() {
    return this.file?.name ?? '';
  }

  get duration() {
    return this.original?.duration ?? 0;
  }

  get fileDetail() {
    const file = this.file;
    if (!file) return '';
    const parts = [formatTimestamp(this.duration * 1000, '.').slice(0, 8)];
    parts.push(this.video ? 'video' : 'audio', formatBytes(file.size));
    return parts.join(' · ');
  }

  get loaded() {
    return !!this.original;
  }

  #revoke() {
    for (const job of this.jobs) if (job.url) URL.revokeObjectURL(job.url);
    if (this.combined) URL.revokeObjectURL(this.combined.url);
  }

  #resetResults() {
    this.#clips = null;
    this.playback.unload();
    this.#revoke();
    this.jobs = [];
    this.tab = '';
    this.combined = null;
    this.error = '';
  }

  async #load(file: File) {
    this.#resetResults();
    this.file = file;
    this.original = null;
    this.peaks = null;
    this.cues = [];
    this.#forgetSpeakers();
    this.scriptSource = '';
    this.detected = '';
    this.loadError = '';
    try {
      const [buffer, isVideo] = await Promise.all([
        decodeForMix(file),
        hasVideo(file),
      ]);
      if (this.isDestroying || this.file !== file) return;
      this.original = buffer;
      this.video = isVideo;
      this.peaks = extractPeaks(channelsOf(buffer), peakBuckets);
    } catch {
      if (this.file === file)
        this.loadError = 'This file has no audio this browser can read.';
    }
  }

  loadFiles = (files: File[]) => {
    const media = files.find((f) => !/\.(srt|vtt)$/i.test(f.name));
    const subs = files.find((f) => /\.(srt|vtt)$/i.test(f.name));
    if (media) void this.#load(media);
    if (subs) void subs.text().then((t) => this.#setScript(t));
  };

  loadFile = (file: File) => this.loadFiles([file]);

  loadSubs = (files: File[]) => {
    const subs = files[0];
    if (subs) void subs.text().then((t) => this.#setScript(t));
  };

  #setScript(text: string) {
    if (!detectFormat(text)) {
      this.error = 'That subtitle file has no lines.';
      return;
    }
    this.cues = parseSubtitles(text).sort((a, b) => a.start - b.start);
    this.#forgetSpeakers();
    this.scriptSource = 'file';
    this.#resetResults();
  }

  clear = () => {
    this.#abort?.abort();
    this.#resetResults();
    this.file = null;
    this.original = null;
    this.peaks = null;
    this.cues = [];
    this.#forgetSpeakers();
    this.scriptSource = '';
    this.detected = '';
    this.loadError = '';
  };

  clearScript = () => {
    this.cues = [];
    this.#forgetSpeakers();
    this.scriptSource = '';
    this.detected = '';
    this.#resetResults();
  };

  /* --- languages and options --- */

  get fromSelected() {
    return this.from ? [this.from] : [];
  }

  get sourceCode() {
    return this.from || this.detected || 'en';
  }

  get sourceLabel() {
    return this.sourceCode.toUpperCase().slice(0, 4);
  }

  get scriptHeading() {
    if (!this.cues.length) return 'Script';
    const auto = !this.from && this.detected ? ' (detected)' : '';
    return `Script · ${nameOf(this.sourceCode)}${auto}`;
  }

  get targetRows() {
    return this.targets.map((code) => ({
      code,
      name: nameOf(code),
      icon: flagOf(code),
      engine: engineInfo(pickEngine(code, this.engine) ?? 'mms').name,
      unsupported: !pickEngine(code, this.engine),
    }));
  }

  get voiceIndex() {
    return VOICES.indexOf(this.voice);
  }

  get voiceNote() {
    return VOICE_NOTES[this.voice];
  }

  get speakerCountIndex() {
    return SPEAKER_COUNTS.indexOf(this.speakerCount);
  }

  get speakerCountNote() {
    return this.speakerCount === 0
      ? 'Finds up to 8 people. If you know how many speak, pick the number: it is more accurate.'
      : this.speakerCount === 1
        ? 'One person speaks: every line gets the same voice.'
        : `Splits the lines between ${this.speakerCount} people.`;
  }

  get backgroundIndex() {
    return BACKGROUNDS.indexOf(this.background);
  }

  get backgroundNote() {
    return BACKGROUND_NOTES[this.background];
  }

  get engineIndex() {
    return ENGINE_CHOICES.indexOf(this.engine);
  }

  get engineNote() {
    if (this.engine === 'auto')
      return 'Picks the best voice engine for each language on its own.';
    const info = engineInfo(this.engine);
    return `${info.note} About ${info.sizeMb} MB once, then cached. Licence: ${info.licence}.`;
  }

  /** Cloning picked outright: every speaker keeps their own voice, so Female/Male has no say. */
  get cloning() {
    return this.engine === 'chatterbox';
  }

  get licenceNote() {
    return 'Voices: Supertonic 3 (OpenRAIL-M, use restrictions apply), MMS (CC-BY-NC) and Chatterbox (MIT). Translation: NLLB-200 (CC-BY-NC). Speakers: WavLM (MIT). Free, non-commercial use.';
  }

  get canRun() {
    return (
      this.loaded &&
      !this.busy &&
      this.targets.length > 0 &&
      this.targets.every((c) => pickEngine(c, this.engine))
    );
  }

  get cannotRun() {
    return !this.canRun;
  }

  get runText() {
    const n = this.targets.length;
    return n > 1 ? `Dub into ${n}` : 'Dub';
  }

  pickFrom = (codes: string[]) => {
    this.from = codes[0] ?? '';
    this.targets = this.targets.filter((c) => c !== this.from);
    this.#resetResults();
  };

  pickTargets = (codes: string[]) => {
    this.targets = codes;
    this.#resetResults();
  };

  removeTarget = (code: string) => {
    this.targets = this.targets.filter((c) => c !== code);
  };

  pickVoice = (index: number) => {
    this.voice = VOICES[index] ?? 'auto';
  };

  pickSpeakerCount = (index: number) => {
    const count = SPEAKER_COUNTS[index] ?? 0;
    if (count === this.speakerCount) return;
    this.speakerCount = count;
    // the next run finds them again with the new count
    this.#forgetSpeakers();
  };

  pickBackground = (index: number) => {
    this.background = BACKGROUNDS[index] ?? 'duck';
  };

  pickEngine = (index: number) => {
    this.engine = ENGINE_CHOICES[index] ?? 'auto';
  };

  editCue = (index: number, cue: Cue) => {
    const next = [...this.cues];
    next[index] = cue;
    this.cues = next;
  };

  /* --- speakers --- */

  #forgetSpeakers() {
    this.speakers = [];
    this.assign = [];
    this.moving = null;
  }

  get found() {
    return this.speakers.length > 0;
  }

  get many() {
    return this.speakers.length > 1;
  }

  /** The voice each speaker gets now. */
  get presets(): Preset[] {
    return assignPresets(this.speakers, this.voice);
  }

  get speakerLines() {
    const counts = this.speakers.map(() => 0);
    for (const s of this.assign) counts[s] = (counts[s] ?? 0) + 1;
    return counts;
  }

  /** Every picked language's engine has a single voice. */
  get singleVoice() {
    return (
      this.targets.length > 0 &&
      this.targets.every((code) => {
        const engine = pickEngine(code, this.engine);
        return !engine || engineInfo(engine).voices.length < 2;
      })
    );
  }

  get canFind() {
    return this.loaded && !this.busy;
  }

  get movingFrom() {
    return this.moving === null ? 0 : (this.assign[this.moving] ?? 0);
  }

  /** The speaker tag over a script line, when more than one person speaks. */
  tagOf = (index: number) => {
    if (!this.many) return undefined;
    const speaker = this.speakers[this.assign[index] ?? 0];
    return speaker ? speakerLabel(speaker) : undefined;
  };

  #setSpeaker(index: number, change: Partial<Speaker>) {
    this.speakers = this.speakers.map((s, i) =>
      i === index ? { ...s, ...change } : s,
    );
  }

  renameSpeaker = (index: number, name: string) =>
    this.#setSpeaker(index, { name: name.trim() });

  typeSpeaker = (index: number, type: VoiceType) =>
    this.#setSpeaker(index, { type });

  voiceSpeaker = (index: number, voice: 'auto' | Preset) =>
    this.#setSpeaker(index, { voice });

  /** Every line of `from` becomes `into`'s; `from` goes. */
  mergeSpeaker = (from: number, into: number) => {
    const target = into > from ? into - 1 : into;
    this.assign = this.assign.map((s) => {
      if (s === from) return target;
      return s > from ? s - 1 : s;
    });
    this.speakers = this.speakers.filter((_, i) => i !== from);
  };

  moveLine = (index: number) => (this.moving = index);

  closeMove = () => (this.moving = null);

  setLineSpeaker = (cue: number, speaker: number) => {
    const next = [...this.assign];
    next[cue] = speaker;
    this.assign = next;
    this.moving = null;
  };

  #stopSample() {
    this.#sample?.pause();
    if (this.#sample) URL.revokeObjectURL(this.#sample.src);
    this.#sample = null;
  }

  /** A few seconds of the speaker: their longest line. */
  playSample = (index: number) => {
    const original = this.original;
    if (!original) return;
    let best: Cue | undefined;
    this.cues.forEach((cue, i) => {
      if (this.assign[i] !== index) return;
      if (!best || cue.end - cue.start > best.end - best.start) best = cue;
    });
    if (!best) return;
    this.#stopSample();
    this.playback.pause();
    const rate = original.sampleRate;
    const from = Math.floor((best.start / 1000) * rate);
    const to = Math.min(
      original.length,
      Math.ceil((best.end / 1000) * rate),
      from + 6 * rate,
    );
    const channels = channelsOf(original).map((c) => c.slice(from, to));
    const url = URL.createObjectURL(
      new Blob([encodeWav(channels, rate)], { type: 'audio/wav' }),
    );
    const audio = new Audio(url);
    this.#sample = audio;
    audio.addEventListener('ended', () => {
      if (this.#sample === audio) this.#stopSample();
    });
    void audio.play().catch(() => this.#stopSample());
  };

  get speakerLanes(): SpeakerLane[] {
    if (!this.many) return [];
    return this.speakers.map((s, k) => ({
      label: `S${s.id}`,
      cues: this.cues.filter((_, i) => this.assign[i] === k),
    }));
  }

  /* --- progress and band --- */

  get currentJob() {
    return this.jobs.find((job) => job.code === this.current);
  }

  get status() {
    if (this.phase === 'transcribe')
      return this.downloading ? 'Downloading speech model…' : 'Transcribing…';
    if (this.phase === 'speakers')
      return this.downloading
        ? 'Downloading speaker model…'
        : 'Finding who speaks each line…';
    if (this.phase === 'video') return 'Building the video…';
    if (this.downloading)
      return this.downloadWhat === 'translation'
        ? 'Downloading translation model…'
        : 'Downloading voice model…';
    const job = this.currentJob;
    if (!job?.stage) return 'Starting…';
    const name = nameOf(job.code);
    if (job.stage === 'voice') {
      const who = this.speaking ? ` · ${this.speaking}` : '';
      return `Voicing ${name}${who}… ${job.done} / ${this.cues.length}`;
    }
    return `${STAGE_TEXT[job.stage]} ${name}`;
  }

  get share() {
    if (
      this.downloading ||
      this.phase === 'transcribe' ||
      this.phase === 'speakers'
    )
      return this.percent / 100;
    const n = this.cues.length * Math.max(1, this.jobs.length);
    const done = this.jobs.reduce(
      (sum, job) => sum + (job.state === 'done' ? this.cues.length : job.done),
      0,
    );
    return n ? done / n : 0;
  }

  get sharePercent() {
    return Math.round(this.share * 100);
  }

  get lanes(): DubLane[] {
    const jobs = this.jobs.length
      ? this.jobs
      : this.targets.map((code) => ({ code, done: 0 }));
    return jobs.map((job) => ({
      label: job.code.toUpperCase().slice(0, 4),
      done: job.done,
    }));
  }

  get bandHeight() {
    const rows = 1 + Math.max(1, this.speakerLanes.length) + this.lanes.length;
    return Math.min(BAND_MAX, Math.max(BAND_MIN, 70 + rows * LANE_HEIGHT));
  }

  get figure() {
    if (!this.loaded) return '';
    if (
      this.busy &&
      (this.downloading ||
        this.phase === 'transcribe' ||
        this.phase === 'speakers')
    )
      return this.downloading ? String(this.percent) : '';
    if (this.busy && this.phase === 'video') return '';
    if (this.busy) return String(this.currentJob?.done ?? 0);
    const finished = this.finished.length;
    if (finished) return String(finished);
    if (this.many) return String(this.speakers.length);
    return this.cues.length ? String(this.cues.length) : '';
  }

  get unit() {
    if (this.busy && this.downloading) return '% model';
    if (this.busy)
      return `/ ${this.cues.length} ${this.current.toUpperCase().slice(0, 4)}`;
    if (this.finished.length)
      return this.finished.length === 1 ? 'dub' : 'dubs';
    if (this.many) return 'speakers';
    return this.cues.length === 1 ? 'line' : 'lines';
  }

  get pictureLabel() {
    if (!this.loaded) return '';
    const names = this.targets.map(nameOf).join(', ');
    const who = this.many ? `, ${this.speakers.length} speakers` : '';
    return `Timeline: ${this.cues.length} lines${who}, ${nameOf(this.sourceCode)} to ${names}`;
  }

  /* --- results --- */

  get finished(): Job[] {
    return this.jobs.filter((job) => job.state === 'done');
  }

  get queueRows() {
    return this.jobs.map((job) => ({
      code: job.code,
      name: nameOf(job.code),
      icon: flagOf(job.code),
      state: job.state,
      running: job.state === 'running',
      done: job.state === 'done',
      detail:
        job.state === 'running'
          ? `${job.engine ? engineInfo(job.engine).name + ' · ' : ''}${job.stage === 'voice' ? `${job.done} / ${this.cues.length}` : STAGE_TEXT[job.stage ?? 'translate']}`
          : job.state === 'done' && job.engine
            ? voiceLabel(job.engine, job.voices ?? [])
            : job.state === 'failed'
              ? (job.error ?? 'Failed')
              : job.state === 'stopped'
                ? 'Stopped'
                : 'Waiting',
    }));
  }

  get showsQueue() {
    return this.jobs.length > 0;
  }

  get tabs() {
    return this.finished.map((job) => nameOf(job.code));
  }

  get showsTabs() {
    return this.finished.length > 1;
  }

  get tabIndex() {
    return Math.max(
      0,
      this.finished.findIndex((job) => job.code === this.tab),
    );
  }

  get shown(): Job | undefined {
    return this.finished[this.tabIndex];
  }

  get previewUrl() {
    return this.shown?.url ?? '';
  }

  get noResult() {
    return !this.busy && this.finished.length === 0;
  }

  get zipName() {
    return `${baseName(this.fileName)}.dubs.zip`;
  }

  get canCombine() {
    return this.video && this.finished.length > 0 && !this.busy;
  }

  get combineText() {
    return this.combined
      ? 'Download video with all languages'
      : 'One video with all languages';
  }

  pickTab = (index: number) => {
    this.playback.unload();
    this.tab = this.finished[index]?.code ?? '';
  };

  #update(code: string, change: Partial<Job>) {
    this.jobs = this.jobs.map((job) =>
      job.code === code ? { ...job, ...change } : job,
    );
  }

  /* --- the run --- */

  /** The script (transcribed once) and its speakers; false when there is no speech. */
  async #prepare(file: File, original: AudioBuffer, signal: AbortSignal) {
    // 1. the script: from a subtitle file, or transcribed once
    if (!this.cues.length) {
      this.phase = 'transcribe';
      const cues = await transcribe(file, {
        mode: WHISPER_MODE,
        language: this.from || undefined,
        onProgress: (p) => {
          this.downloading = p > 0 && p < 100;
          this.percent = p;
        },
      });
      if (signal.aborted || this.isDestroying) return false;
      this.cues = cues;
      this.scriptSource = 'whisper';
      this.downloading = false;
    }
    if (!this.cues.length) {
      this.error = 'No speech was found in this file.';
      return false;
    }
    if (!this.from && !this.detected)
      this.detected = await detectLanguage(
        this.cues.map((c) => c.text).join(' '),
      );

    // 2. who speaks each line
    if (!this.found) {
      this.phase = 'speakers';
      this.percent = 0;
      const cues = this.cues;
      const result = await diarize(
        await mono16k(original),
        cues,
        this.speakerCount,
        (stage, ratio) => {
          this.downloading = stage === 'download' && ratio < 1;
          this.percent = Math.round(ratio * 100);
        },
      );
      this.downloading = false;
      if (signal.aborted || this.isDestroying || this.cues !== cues)
        return false;
      this.speakers = result.speakers;
      this.assign = result.assign;
    }
    return true;
  }

  #failText() {
    if (this.phase === 'transcribe')
      return 'Transcription failed. Check your connection for the first model download and try again.';
    if (this.phase === 'speakers')
      return 'Finding speakers failed. Check your connection for the first model download and try again.';
    return 'Dubbing failed. Please try again.';
  }

  #finish() {
    this.busy = false;
    this.phase = '';
    this.current = '';
    this.speaking = '';
    this.downloading = false;
    this.#abort = null;
  }

  /** Transcribe if needed and find the speakers, to name them before dubbing. */
  findSpeakers = async () => {
    if (!this.canFind || !this.file || !this.original) return;
    const abort = new AbortController();
    this.#abort = abort;
    this.busy = true;
    this.error = '';
    this.percent = 0;
    this.#forgetSpeakers();
    try {
      await this.#prepare(this.file, this.original, abort.signal);
    } catch (error) {
      if (!abort.signal.aborted && !this.isDestroying) {
        console.error('Finding speakers failed:', error);
        this.error = this.#failText();
      }
    } finally {
      if (!this.isDestroying) this.#finish();
    }
  };

  dub = async () => {
    if (!this.canRun || !this.file || !this.original) return;
    const file = this.file;
    const original = this.original;
    this.#resetResults();
    const abort = new AbortController();
    this.#abort = abort;
    this.busy = true;
    this.percent = 0;
    this.downloading = false;

    try {
      if (!(await this.#prepare(file, original, abort.signal))) return;

      // 3. each language in turn
      this.phase = 'dub';
      const targets = this.targets.filter((c) => c !== this.sourceCode);
      this.jobs = targets.map((code) => ({
        code,
        state: 'waiting',
        done: 0,
        lines: [],
      }));
      for (const code of targets) {
        if (abort.signal.aborted || this.isDestroying) break;
        await this.#dubOne(code, file, original, abort.signal);
      }
    } catch (error) {
      if (!abort.signal.aborted && !this.isDestroying) {
        console.error('Dubbing failed:', error);
        this.error = this.#failText();
      }
    } finally {
      if (!this.isDestroying) {
        this.jobs = this.jobs.map((job) =>
          job.state === 'waiting' || job.state === 'running'
            ? { ...job, state: 'stopped', stage: undefined }
            : job,
        );
        this.#finish();
      }
    }
  };

  /** Translate, voice, fit and mix one language; marks its job done or failed. */
  async #dubOne(
    code: string,
    file: File,
    original: AudioBuffer,
    signal: AbortSignal,
  ) {
    const to = languageOf(code);
    const from = languageOf(this.sourceCode) ?? TRANSLATE_LANGUAGES[0]!;
    const engine = pickEngine(code, this.engine);
    if (!to || !engine) {
      this.#update(code, { state: 'failed', error: 'No voice yet' });
      return;
    }
    this.current = code;
    this.#update(code, { state: 'running', stage: 'translate', engine });
    try {
      // translate
      const cues = this.cues;
      const shapes = cues.map((cue) => prepareCue(cue.text));
      const { texts } = await translateTexts(
        shapes.map((s) => s.plain),
        {
          from,
          to,
          engine: 'auto',
          signal,
          onProgress: (p) => {
            this.downloadWhat = 'translation';
            this.downloading = p.phase === 'download' && p.ratio < 1;
            this.percent = Math.round(p.ratio * 100);
          },
        },
      );
      this.downloading = false;
      const lines = texts.map((t, i) => restoreCue(t, shapes[i]!));
      this.#update(code, { lines, stage: 'voice' });

      // voice each line, fitted to its slot
      const info = engineInfo(engine);
      const presets = this.presets;
      const fallback: Preset = this.voice === 'male' ? 'M1' : 'F1';
      const used = new Set<Preset>();
      const placed: PlacedLine[] = [];
      if (info.clones && !this.#clips) {
        this.#clipRun++;
        this.#clips = await voiceClips(
          original,
          cues,
          this.assign,
          Math.max(1, this.speakers.length),
          CLONE_RATE,
          CLONE_SECONDS,
        );
      }
      for (const [i, cue] of cues.entries()) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        const text = (texts[i] ?? '').trim();
        const who = this.assign[i] ?? 0;
        const voice = presets[who] ?? fallback;
        const speaker = this.speakers[who];
        this.speaking = this.many && speaker ? speakerLabel(speaker) : '';
        let clone: CloneRef | undefined;
        if (info.clones) {
          // a speaker with no clip of their own borrows the longest one
          const clips = this.#clips!;
          const own = clips[who];
          const audio = own?.length
            ? own
            : clips.reduce((a, b) => (b.length > a.length ? b : a));
          clone = {
            key: `${this.#clipRun}:${own?.length ? who : 'any'}`,
            audio,
          };
        }
        if (text) {
          used.add(voice);
          const next = cues[i + 1]?.start ?? (original.duration + 1) * 1000;
          const slot = Math.max(0.3, (next - cue.start) / 1000 - 0.05);
          const onDownload = (r: number) => {
            this.downloadWhat = 'voice';
            this.downloading = r < 1;
            this.percent = Math.round(r * 100);
          };
          let speech = await speak(
            engine,
            code,
            text,
            voice,
            1,
            onDownload,
            clone,
          );
          this.downloading = false;
          const need = seconds(speech) / slot;
          let rate: number | undefined;
          if (need > 1.02) {
            const speed = Math.min(need, MAX_SPEED);
            if (info.speedControl)
              speech = await speak(engine, code, text, voice, speed);
            else rate = speed;
          }
          placed.push({ start: cue.start / 1000, speech, rate });
        }
        this.#update(code, { done: i + 1 });
      }

      // mix, then the file: MP4 with the new audio for video, WAV for audio
      this.speaking = '';
      this.#update(code, { stage: 'mix', voices: [...used] });
      const mix = await renderDub(original, placed, this.background);
      let out: Blob;
      if (this.video) {
        out = await videoWithAudio(
          file,
          [{ buffer: mix, language: iso3(code), name: to.name }],
          signal,
        );
      } else {
        out = new Blob([encodeWav(channelsOf(mix), mix.sampleRate)], {
          type: 'audio/wav',
        });
      }
      this.#update(code, {
        state: 'done',
        stage: undefined,
        mix,
        file: out,
        url: URL.createObjectURL(out),
        done: cues.length,
      });
      if (!this.tab) this.tab = code;
    } catch (error) {
      if (signal.aborted) {
        this.#update(code, { state: 'stopped', stage: undefined });
        throw error;
      }
      console.error(`Dubbing ${code} failed:`, error);
      this.#update(code, {
        state: 'failed',
        stage: undefined,
        error: 'Failed: try again',
      });
    }
  }

  cancel = () => {
    this.#abort?.abort();
  };

  /** Redo one language with the edited script and current options. */
  redo = async (code: string) => {
    if (this.busy || !this.file || !this.original) return;
    const abort = new AbortController();
    this.#abort = abort;
    this.busy = true;
    this.phase = 'dub';
    this.combined = null;
    const old = this.jobs.find((j) => j.code === code);
    if (old?.url) URL.revokeObjectURL(old.url);
    this.#update(code, {
      state: 'waiting',
      done: 0,
      url: undefined,
      file: undefined,
      mix: undefined,
    });
    try {
      await this.#dubOne(code, this.file, this.original, abort.signal);
    } catch {
      // stopped
    } finally {
      if (!this.isDestroying) this.#finish();
    }
  };

  /** One MP4: the original audio first, then every dub as its own language track. */
  combine = async () => {
    if (this.combined) {
      downloadBlob(this.combined.blob, `${baseName(this.fileName)}.dubbed.mp4`);
      return;
    }
    if (!this.canCombine || !this.file || !this.original) return;
    const abort = new AbortController();
    this.#abort = abort;
    this.busy = true;
    this.phase = 'video';
    try {
      const tracks = [
        {
          buffer: this.original,
          language: iso3(this.sourceCode),
          name: `${nameOf(this.sourceCode)} (original)`,
        },
        ...this.finished.map((job) => ({
          buffer: job.mix!,
          language: iso3(job.code),
          name: nameOf(job.code),
        })),
      ];
      const blob = await videoWithAudio(this.file, tracks, abort.signal);
      if (this.isDestroying) return;
      this.combined = { blob, url: URL.createObjectURL(blob) };
      downloadBlob(blob, `${baseName(this.fileName)}.dubbed.mp4`);
    } catch (error) {
      if (!abort.signal.aborted) {
        console.error('Building the video failed:', error);
        this.error = 'Building the video failed. Please try again.';
      }
    } finally {
      if (!this.isDestroying) {
        this.busy = false;
        this.phase = '';
        this.#abort = null;
      }
    }
  };

  /* --- downloads --- */

  #ext() {
    return this.video ? 'mp4' : 'wav';
  }

  #srt(job: Job): string {
    return writeSrt(
      this.cues.map((cue, i) => ({ ...cue, text: job.lines[i] ?? '' })),
    );
  }

  downloadOne = (code: string) => {
    const job = this.finished.find((j) => j.code === code);
    if (!job?.file) return;
    downloadBlob(job.file, `${baseName(this.fileName)}.${code}.${this.#ext()}`);
  };

  allFiles = (): NamedBlob[] =>
    this.finished.flatMap((job) => [
      {
        name: `${baseName(this.fileName)}.${job.code}.${this.#ext()}`,
        blob: job.file!,
      },
      {
        name: `${baseName(this.fileName)}.${job.code}.srt`,
        blob: new Blob([this.#srt(job)], { type: 'application/x-subrip' }),
      },
    ]);

  <template>
    <CanonSplit
      class="audio-dub"
      @collapsesTo={{72}}
      @mainLeadsStacked={{true}}
      {{filePaste this.loadFile accept=MEDIA_ACCEPT}}
    >
      <:banner>
        <CanonCanvas
          @height={{this.bandHeight}}
          @background="var(--canon-muted)"
        >
          <Picture
            @peaks={{this.peaks}}
            @duration={{this.duration}}
            @cues={{this.cues}}
            @source={{this.sourceLabel}}
            @speakers={{this.speakerLanes}}
            @lanes={{this.lanes}}
            @playhead={{this.playback.playhead}}
            @onScrub={{this.playback.scrub}}
            @figure={{this.figure}}
            @unit={{this.unit}}
            @label={{this.pictureLabel}}
          />
        </CanonCanvas>
      </:banner>
      <:sidebar>
        <CanonRows class="ad-controls" @framed={{true}}>
          <CanonHeading @text="Languages" />
          <LanguageSelect
            @title="From"
            @auto={{true}}
            @selected={{this.fromSelected}}
            @disabled={{this.busy}}
            @onChange={{this.pickFrom}}
          />
          <LanguageSelect
            @title="Into"
            @multiple={{true}}
            @selected={{this.targets}}
            @exclude={{this.from}}
            @unavailable={{SOON}}
            @disabled={{this.busy}}
            @onChange={{this.pickTargets}}
          />
          {{#each this.targetRows key="code" as |row|}}
            <CanonRow
              class="ad-target"
              @title={{row.name}}
              @detail={{row.engine}}
              @icon={{row.icon}}
            >
              <CanonButton
                class="ad-target-remove"
                @kind="cell"
                @icon={{Remove}}
                @label="Remove {{row.name}}"
                @disabled={{this.busy}}
                @onClick={{fn this.removeTarget row.code}}
              />
            </CanonRow>
          {{else}}
            <CanonEmptyRow @text="Pick languages above" />
          {{/each}}
          {{#unless this.cloning}}
            <CanonHeading @text="Voice" />
            <CanonSegmented
              class="ad-voice"
              aria-label="Voice"
              @items={{VOICE_LABELS}}
              @selected={{this.voiceIndex}}
              @disabled={{this.busy}}
              @onChange={{this.pickVoice}}
            />
            <CanonStatus @text={{this.voiceNote}} @tone="muted" @row={{true}} />
          {{/unless}}
          <CanonHeading @text="Speakers" />
          <CanonSegmented
            class="ad-speaker-count"
            aria-label="Speakers"
            @items={{SPEAKER_LABELS}}
            @columns={{4}}
            @selected={{this.speakerCountIndex}}
            @disabled={{this.busy}}
            @onChange={{this.pickSpeakerCount}}
          />
          <CanonStatus
            @text={{this.speakerCountNote}}
            @tone="muted"
            @row={{true}}
          />
          <CanonHeading @text="Background" />
          <CanonSegmented
            class="ad-background"
            aria-label="Background"
            @items={{BACKGROUND_LABELS}}
            @selected={{this.backgroundIndex}}
            @disabled={{this.busy}}
            @onChange={{this.pickBackground}}
          />
          <CanonStatus
            @text={{this.backgroundNote}}
            @tone="muted"
            @row={{true}}
          />
          <CanonHeading @text="Voice engine" />
          <CanonSegmented
            class="ad-engine"
            aria-label="Voice engine"
            @items={{ENGINE_LABELS}}
            @selected={{this.engineIndex}}
            @disabled={{this.busy}}
            @onChange={{this.pickEngine}}
          />
          <CanonStatus @text={{this.engineNote}} @tone="muted" @row={{true}} />
          <CanonButton
            class="ad-run"
            @kind="primary"
            @text={{this.runText}}
            @icon={{Run}}
            @iconStyle="oversized"
            @disabled={{this.cannotRun}}
            @onClick={{this.dub}}
          />
          <CanonStatus
            class="ad-licence"
            @text={{this.licenceNote}}
            @tone="muted"
            @row={{true}}
          />
        </CanonRows>
      </:sidebar>
      <:main>
        <CanonRows class="ad-source" @framed={{true}}>
          <CanonHeading @text="Source" />
          {{#if this.file}}
            <CanonRow
              class="ad-file"
              @title={{this.fileName}}
              @detail={{this.fileDetail}}
              @form="flush"
            >
              <CanonButton
                class="ad-clear"
                @kind="cell"
                @text="Clear"
                @icon={{Trash}}
                @disabled={{this.busy}}
                @onClick={{this.clear}}
              />
            </CanonRow>
            {{#if this.loadError}}
              <CanonStatus
                @text={{this.loadError}}
                @tone="warn"
                @row={{true}}
              />
            {{/if}}
          {{else}}
            <CanonDropZone
              class="ad-drop"
              @prompt="Drop audio or video, plus SRT if you have one"
              @icon={{FileIcon}}
              @accept=""
              @multiple={{true}}
              @paste={{false}}
              @onFiles={{this.loadFiles}}
              {{on "paste" keepPaste}}
            />
          {{/if}}
        </CanonRows>

        {{#if this.file}}
          <Speakers
            @speakers={{this.speakers}}
            @presets={{this.presets}}
            @lines={{this.speakerLines}}
            @found={{this.found}}
            @singleVoice={{this.singleVoice}}
            @busy={{this.busy}}
            @canFind={{this.canFind}}
            @moving={{this.moving}}
            @movingFrom={{this.movingFrom}}
            @onFind={{this.findSpeakers}}
            @onRename={{this.renameSpeaker}}
            @onType={{this.typeSpeaker}}
            @onVoice={{this.voiceSpeaker}}
            @onMerge={{this.mergeSpeaker}}
            @onSample={{this.playSample}}
            @onMove={{this.setLineSpeaker}}
            @onCloseMove={{this.closeMove}}
          />
          <CanonRows class="ad-script" @framed={{true}}>
            <CanonHeading @text={{this.scriptHeading}} />
            {{#if this.cues.length}}
              <div class="ad-lines">
                {{#each this.cues key="@index" as |cue index|}}
                  <CueRow
                    @index={{index}}
                    @cue={{cue}}
                    @editable={{true}}
                    @note={{this.tagOf index}}
                    @onNote={{fn this.moveLine index}}
                    @onChange={{fn this.editCue index}}
                  />
                {{/each}}
              </div>
              <CanonButton
                class="ad-script-clear"
                @text="Clear script"
                @icon={{Trash}}
                @disabled={{this.busy}}
                @onClick={{this.clearScript}}
              />
            {{else}}
              <CanonStatus
                @text="Dub transcribes the speech first. Or drop an SRT or VTT to use your own script."
                @tone="muted"
                @row={{true}}
              />
              <CanonDropZone
                class="ad-subs-drop"
                @prompt="SRT or VTT (optional)"
                @icon={{SubsIcon}}
                @accept={{SUBS_ACCEPT}}
                @paste={{false}}
                @onFiles={{this.loadSubs}}
                {{on "paste" keepPaste}}
              />
            {{/if}}
          </CanonRows>
        {{/if}}

        <CanonRows class="ad-output" @framed={{true}}>
          <CanonHeading @text="Dubs" />
          {{#if this.busy}}
            <CanonRow class="ad-busy" @title={{this.status}}>
              <span class="ad-busy-cell">
                <CanonLoader @cell={{5}} @gap={{1}} />
                <span role="status">{{this.sharePercent}}%</span>
              </span>
            </CanonRow>
            <CanonBar
              class="ad-bar"
              role="progressbar"
              aria-label="Progress"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={{this.sharePercent}}
              @share={{this.share}}
            />
            <CanonButton
              class="ad-cancel"
              @text="Cancel"
              @icon={{Cancel}}
              @onClick={{this.cancel}}
            />
          {{/if}}
          {{#if this.error}}
            <CanonStatus @text={{this.error}} @tone="warn" @row={{true}} />
          {{/if}}

          {{#each this.queueRows key="code" as |row|}}
            <CanonRow
              class="ad-job ad-job--{{row.state}}"
              @title={{row.name}}
              @detail={{row.detail}}
              @icon={{row.icon}}
            >
              {{#if row.running}}
                <span class="ad-busy-cell">
                  <CanonLoader @cell={{4}} @gap={{1}} />
                </span>
              {{else if row.done}}
                <span class="ad-job-actions">
                  <CanonButton
                    class="ad-job-redo"
                    @kind="cell"
                    @icon={{Redo}}
                    @label="Re-dub {{row.name}}"
                    @disabled={{this.busy}}
                    @onClick={{fn this.redo row.code}}
                  />
                  <CanonButton
                    class="ad-job-download"
                    @kind="cell"
                    @text="Download"
                    @icon={{Save}}
                    @onClick={{fn this.downloadOne row.code}}
                  />
                </span>
              {{/if}}
            </CanonRow>
          {{/each}}

          {{#if this.shown}}
            {{#if this.showsTabs}}
              <CanonSegmented
                class="ad-tabs"
                aria-label="Preview language"
                @items={{this.tabs}}
                @columns={{3}}
                @selected={{this.tabIndex}}
                @onChange={{this.pickTab}}
              />
            {{/if}}
            <DownloadAll
              class="ad-download-all"
              @files={{this.allFiles}}
              @zipName={{this.zipName}}
              @disabled={{this.busy}}
            />
            {{#if this.video}}
              <CanonButton
                class="ad-combine"
                @kind="secondary"
                @text={{this.combineText}}
                @icon={{Film}}
                @disabled={{if this.canCombine false true}}
                @onClick={{this.combine}}
              />
            {{/if}}
          {{else if this.noResult}}
            {{#unless this.showsQueue}}
              <CanonEmptyRow @text="None yet" />
            {{/unless}}
          {{/if}}
        </CanonRows>

        {{#if this.previewUrl}}
          {{! the transport is its control; the dub has no captions track }}
          {{! template-lint-disable require-media-caption }}
          <audio
            src={{this.previewUrl}}
            hidden
            preload="auto"
            {{this.playback.register}}
          ></audio>
        {{/if}}
      </:main>
      <:footer>
        <Transport
          @playback={{this.playback}}
          @ready={{if this.previewUrl true false}}
        />
      </:footer>
    </CanonSplit>
  </template>
}
