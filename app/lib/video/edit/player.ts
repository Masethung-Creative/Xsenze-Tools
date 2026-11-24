import { tracked } from '@glimmer/tracking';
import { modifier } from 'ember-modifier';
import type { XzTransport } from 'xsenze-tools/components/xz/readout-band';
import { seekTo } from 'xsenze-tools/lib/video/video';
import {
  duckAt,
  editLength,
  emptyEdit,
  endOf,
  fadeAt,
  layersAt,
  lengthOf,
  placeAt,
  showingAt,
  starts,
  type AudioItem,
  type Clip,
  type Edit,
  type Layer,
  type Level,
  type Place,
  type Showing,
} from 'xsenze-tools/lib/video/edit/timeline';
import {
  drawShots,
  type Fit,
  type Picture,
  type Shot,
} from 'xsenze-tools/lib/video/edit/draw';
import { drawLayer } from 'xsenze-tools/lib/video/edit/layers';

export type { Fit };

/** Timeline seconds into a piece, from the clip second it is at. */
const localOf = (place: Place) =>
  (place.clipTime - place.piece.in) / (place.piece.speed || 1);

/** A piece's fade at its place, towards black and silence. */
const fadeOf = (place: Place) =>
  fadeAt(
    localOf(place),
    lengthOf(place.piece),
    place.piece.fadeIn,
    place.piece.fadeOut,
  );

// seconds before a piece or layer starts that its video is sought, so the switch is quick
const preseek = 0.5;
// drift between the clock and a media element that brings a re-seek, seconds
const driftLimit = 0.3;
// after a re-seek an element gets this long to settle, ms
const settleMs = 600;

/** The gain of a level: its volume, or nothing when muted. */
const levelGain = (level: Level) => (level.muted ? 0 : level.volume);

interface Voice {
  media: HTMLMediaElement;
  gain: GainNode | null;
  /** performance.now() before which no re-seek happens. */
  settled: number;
}

/**
 * The main track's video element for a piece. Neighbouring pieces use
 * different ones, so a transition between two parts of one clip can show
 * both at once.
 */
const slotOf = (clip: string, index: number) => `${clip}|${index % 2}`;

/**
 * Plays an edit on one clock: the video track onto one canvas (black bars,
 * fades, transitions), the text and overlays over it, and every sound
 * through its own gain, so volume can go to 200 % and fade. The transport
 * fields match the single-file Playback.
 */
export default class EditPlayer {
  @tracked playing = false;
  @tracked paused = false;
  @tracked looping = false;
  @tracked loops = 0;
  /** Timeline seconds of the frame on show. */
  @tracked time = 0;

  /** Width over height of the frame. */
  aspect = 16 / 9;
  fit: Fit = 'contain';

  #clips = new Map<string, Clip>();
  #edit: Edit = emptyEdit();
  /** Main track videos, by slot. */
  #videos = new Map<string, Voice>();
  /** Overlay videos, by layer. */
  #overlays = new Map<string, Voice>();
  #images = new Map<string, HTMLImageElement>();
  #sounds = new Map<string, Voice>();
  #context?: AudioContext;
  #canvas?: HTMLCanvasElement;
  #frame = 0;
  #seek = 0;
  /** Clock: timeline seconds at `#startedAt`. */
  #base = 0;
  #startedAt = 0;

  get transport(): XzTransport {
    return {
      playhead: this.time,
      playing: this.playing,
      paused: this.paused,
      looping: this.looping,
      loops: this.loops,
    };
  }

  get active() {
    return this.playing || this.paused;
  }

  get duration() {
    return editLength(this.#edit);
  }

  /** Frames a second of the clip on show. */
  get fps() {
    const place = placeAt(this.#edit.pieces, this.time);
    return (place && this.#clips.get(place.piece.clip)?.fps) || 30;
  }

  /** The canvas's size in its own pixels. */
  get frameSize() {
    return {
      width: this.#canvas?.width ?? 1280,
      height: this.#canvas?.height ?? 720,
    };
  }

  /** The media and the edit to play; the frame on show is redrawn. */
  load(clips: readonly Clip[], edit: Edit) {
    this.#clips = new Map(clips.map((clip) => [clip.id, clip]));
    this.#edit = edit;
    const slots = new Set(
      edit.pieces.map((piece, index) => slotOf(piece.clip, index)),
    );
    for (const [key, voice] of this.#videos)
      if (!slots.has(key)) this.#drop(this.#videos, key, voice);
    const overlays = new Set(
      edit.layers.filter((l) => l.kind === 'video').map((l) => l.id),
    );
    for (const [id, voice] of this.#overlays)
      if (!overlays.has(id) || !this.#clips.has(this.#layerClip(id)))
        this.#drop(this.#overlays, id, voice);
    for (const id of this.#images.keys())
      if (!this.#clips.has(id)) this.#images.delete(id);
    const items = new Set(edit.audio.map((item) => item.id));
    for (const [id, voice] of this.#sounds)
      if (!items.has(id) || !this.#clips.has(this.#itemClip(id)))
        this.#drop(this.#sounds, id, voice);
    // everything loads now, so it starts on time when the playhead reaches it
    for (const item of edit.audio) this.#sound(item);
    edit.pieces.forEach((piece, index) => {
      if (this.#isPhoto(piece.clip)) this.#image(piece.clip);
      else this.#video(piece.clip, index);
    });
    for (const layer of edit.layers)
      if (layer.kind === 'video') this.#overlay(layer);
      else if (layer.kind === 'picture' && layer.clip) this.#image(layer.clip);
    this.time = Math.min(this.time, this.duration);
    if (this.playing) {
      // the edit changed under the playhead: carry on from the same time
      this.#restart(this.time);
    } else {
      void this.#show(this.time);
    }
  }

  /** Binds the canvas the frames are drawn on. */
  register = modifier((canvas: HTMLCanvasElement) => {
    this.#canvas = canvas;
    this.#size();
    // read outside the modifier: reading `time` here would rerun it every frame
    requestAnimationFrame(() => {
      if (this.#canvas === canvas && !this.playing) void this.#show(this.time);
    });
    return () => {
      if (this.#canvas === canvas) this.#canvas = undefined;
    };
  });

  /** A new frame shape: the canvas is resized and redrawn. */
  shape(aspect: number, fit: Fit) {
    if (aspect === this.aspect && fit === this.fit) return;
    this.aspect = aspect;
    this.fit = fit;
    this.#size();
    if (!this.playing) void this.#show(this.time);
  }

  toggle = () => (this.playing ? this.pause() : this.play());

  play = () => {
    if (this.duration <= 0) return;
    void this.#audio()?.resume();
    if (this.time >= this.duration - 1 / 60) this.time = 0;
    this.playing = true;
    this.paused = false;
    this.#restart(this.time);
  };

  pause = () => {
    if (!this.playing) return;
    this.#halt();
    this.paused = true;
    void this.#show(this.time);
  };

  stop = () => {
    this.#halt();
    this.paused = false;
    this.scrub(0);
  };

  toggleLoop = () => (this.looping = !this.looping);

  /** Shows timeline second `t`; playback carries on from there. */
  scrub = (t: number) => {
    const time = Math.min(Math.max(t, 0), this.duration);
    this.time = time;
    if (this.playing) this.#restart(time);
    else {
      if (time > 0) this.paused = true;
      void this.#show(time);
    }
  };

  /** Pauses and moves by `seconds`, for frame steps. */
  stepBy = (seconds: number) => {
    this.pause();
    this.scrub(this.time + seconds);
  };

  destroy() {
    this.#halt();
    for (const map of [this.#videos, this.#overlays, this.#sounds])
      for (const [id, voice] of map) this.#drop(map, id, voice);
    void this.#context?.close();
  }

  // ----- media -----

  #audio(): AudioContext | undefined {
    if (!this.#context && typeof AudioContext !== 'undefined')
      this.#context = new AudioContext();
    return this.#context;
  }

  /** Routes an element through a gain, so its volume can pass 100 %. */
  #voice(media: HTMLMediaElement): Voice {
    const context = this.#audio();
    let gain: GainNode | null = null;
    if (context) {
      try {
        gain = context.createGain();
        context.createMediaElementSource(media).connect(gain);
        gain.connect(context.destination);
      } catch {
        gain = null;
      }
    }
    return { media, gain, settled: 0 };
  }

  #drop(map: Map<string, Voice>, id: string, voice: Voice) {
    voice.media.pause();
    voice.media.removeAttribute('src');
    voice.media.load();
    voice.gain?.disconnect();
    map.delete(id);
  }

  #itemClip(id: string) {
    return this.#edit.audio.find((item) => item.id === id)?.clip ?? '';
  }

  #layerClip(id: string) {
    return this.#edit.layers.find((layer) => layer.id === id)?.clip ?? '';
  }

  #videoElement(url: string): HTMLVideoElement {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    video.src = url;
    video.addEventListener('seeked', () => {
      if (!this.playing) this.#paintAt(this.time);
    });
    return video;
  }

  /** The main track's video for piece `index`. */
  #video(clipId: string, index: number): Voice | undefined {
    const key = slotOf(clipId, index);
    let voice = this.#videos.get(key);
    const clip = this.#clips.get(clipId);
    if (!clip) return undefined;
    if (!voice) {
      voice = this.#voice(this.#videoElement(clip.url));
      this.#videos.set(key, voice);
    }
    return voice;
  }

  #overlay(layer: Layer): Voice | undefined {
    let voice = this.#overlays.get(layer.id);
    const clip = this.#clips.get(layer.clip ?? '');
    if (!clip) return undefined;
    if (!voice) {
      voice = this.#voice(this.#videoElement(clip.url));
      this.#overlays.set(layer.id, voice);
    }
    return voice;
  }

  #sound(item: AudioItem): Voice | undefined {
    let voice = this.#sounds.get(item.id);
    const clip = this.#clips.get(item.clip);
    if (!clip) return undefined;
    if (!voice) {
      const audio = document.createElement('audio');
      audio.preload = 'auto';
      audio.src = clip.url;
      voice = this.#voice(audio);
      this.#sounds.set(item.id, voice);
    }
    return voice;
  }

  /** A photo, loaded once; it draws itself when it arrives. */
  #image(clipId: string): HTMLImageElement | undefined {
    let image = this.#images.get(clipId);
    const clip = this.#clips.get(clipId);
    if (!clip) return undefined;
    if (!image) {
      image = new Image();
      image.decoding = 'async';
      image.src = clip.url;
      image.addEventListener('load', () => {
        if (!this.playing) this.#paintAt(this.time);
      });
      this.#images.set(clipId, image);
    }
    return image;
  }

  #isPhoto(clipId: string) {
    return this.#clips.get(clipId)?.kind === 'image';
  }

  #ready(media: HTMLMediaElement): Promise<void> {
    if (media.readyState >= 1) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => resolve();
      media.addEventListener('loadedmetadata', done, { once: true });
      media.addEventListener('error', done, { once: true });
    });
  }

  /** Sets a voice's loudness, with 1 the element's own. */
  #level(voice: Voice, value: number) {
    const gain = Math.max(0, Math.min(4, value));
    if (voice.gain) {
      voice.media.volume = 1;
      voice.gain.gain.value = gain;
    } else {
      voice.media.volume = Math.min(1, gain);
    }
  }

  #showing(t: number): Showing | null {
    return showingAt(this.#edit.pieces, t);
  }

  /** The pieces on show and how much of the sound each has. */
  #places(show: Showing | null): { place: Place; weight: number }[] {
    if (!show) return [];
    if (!show.b) return [{ place: show.a, weight: 1 }];
    return [
      { place: show.a, weight: 1 - show.p },
      { place: show.b, weight: show.p },
    ];
  }

  // ----- still frames -----

  async #show(t: number) {
    const seek = ++this.#seek;
    const waits: Promise<void>[] = [];
    const goTo = async (voice: Voice, at: number) => {
      await this.#ready(voice.media);
      if (seek === this.#seek)
        await seekTo(voice.media as HTMLVideoElement, at);
    };
    for (const { place } of this.#places(this.#showing(t))) {
      if (this.#isPhoto(place.piece.clip)) continue;
      const voice = this.#video(place.piece.clip, place.index);
      if (voice) waits.push(goTo(voice, place.clipTime));
    }
    for (const layer of layersAt(this.#edit.layers, t)) {
      if (layer.kind !== 'video') continue;
      const voice = this.#overlay(layer);
      if (voice) waits.push(goTo(voice, layer.in + (t - layer.start)));
    }
    // text and shapes change at once; videos follow when sought
    this.#paintAt(t);
    if (!waits.length) return;
    await Promise.all(waits);
    if (seek === this.#seek && !this.playing) this.#paintAt(t);
  }

  // ----- playing -----

  #restart(time: number) {
    cancelAnimationFrame(this.#frame);
    this.#seek++;
    this.#base = time;
    this.#startedAt = performance.now();
    // every element is sought again on the next frame
    for (const map of [this.#videos, this.#overlays, this.#sounds])
      for (const voice of map.values()) {
        voice.media.pause();
        voice.settled = 0;
      }
    this.#frame = requestAnimationFrame(this.#tick);
  }

  #tick = () => {
    cancelAnimationFrame(this.#frame);
    if (!this.playing) return;
    const now = performance.now();
    let time = this.#base + (now - this.#startedAt) / 1000;
    const end = this.duration;
    if (time >= end) {
      if (this.looping && end > 0) {
        this.loops += 1;
        this.#restart(0);
        return;
      }
      this.time = end;
      this.#halt();
      this.paused = true;
      return;
    }
    time = Math.max(0, time);
    this.time = time;
    const show = this.#showing(time);
    this.#playVideo(time, now, show);
    this.#playSounds(time, now);
    this.#paint(time, show);
    this.#frame = requestAnimationFrame(this.#tick);
  };

  /** Keeps the right videos playing at the clock's time, each at its loudness. */
  #playVideo(time: number, now: number, show: Showing | null) {
    const playing = new Set<Voice>();
    const videoLevel = levelGain(this.#edit.mix.video);
    for (const { place, weight } of this.#places(show)) {
      if (this.#isPhoto(place.piece.clip)) continue;
      const voice = this.#video(place.piece.clip, place.index);
      if (!voice) continue;
      playing.add(voice);
      // a faster or slower piece plays at its speed; the browser keeps the pitch
      const speed = place.piece.speed || 1;
      if (voice.media.playbackRate !== speed) {
        voice.media.playbackRate = speed;
        voice.media.preservesPitch = true;
      }
      this.#follow(voice, place.clipTime, now);
      this.#level(
        voice,
        (place.piece.muted ? 0 : place.piece.volume) *
          videoLevel *
          fadeOf(place) *
          weight,
      );
    }
    for (const layer of layersAt(this.#edit.layers, time)) {
      if (layer.kind !== 'video') continue;
      const voice = this.#overlay(layer);
      if (!voice) continue;
      playing.add(voice);
      this.#follow(voice, layer.in + (time - layer.start), now);
      this.#level(voice, (layer.muted ? 0 : layer.volume) * videoLevel);
    }
    for (const map of [this.#videos, this.#overlays])
      for (const voice of map.values())
        if (!playing.has(voice) && !voice.media.paused) voice.media.pause();
    this.#preseek(time, show);
  }

  /** The next piece's and the next overlay's videos seek ahead of time. */
  #preseek(time: number, show: Showing | null) {
    const pieces = this.#edit.pieces;
    const current = show ? (show.b ?? show.a).index : -1;
    const nextIndex = current + 1;
    const next = pieces[nextIndex];
    if (next && current >= 0 && !this.#isPhoto(next.clip)) {
      const begin = starts(pieces)[nextIndex] ?? 0;
      const upcoming = this.#video(next.clip, nextIndex);
      if (
        upcoming &&
        begin - time < preseek &&
        upcoming.media.paused &&
        Math.abs(upcoming.media.currentTime - next.in) > 0.05
      )
        upcoming.media.currentTime = next.in;
    }
    for (const layer of this.#edit.layers) {
      if (layer.kind !== 'video') continue;
      const ahead = layer.start - time;
      if (ahead <= 0 || ahead >= preseek) continue;
      const voice = this.#overlay(layer);
      if (
        voice?.media.paused &&
        Math.abs(voice.media.currentTime - layer.in) > 0.05
      )
        voice.media.currentTime = layer.in;
    }
  }

  /** Plays each sound that the clock is inside, at its place, with its gain. */
  #playSounds(time: number, now: number) {
    for (const item of this.#edit.audio) {
      const inside = time >= item.start && time < endOf(item);
      const voice = inside ? this.#sound(item) : this.#sounds.get(item.id);
      if (!voice) continue;
      if (!inside) {
        voice.media.pause();
        continue;
      }
      const local = time - item.start;
      this.#follow(voice, item.in + local, now);
      const level = this.#edit.mix[item.lane];
      this.#level(
        voice,
        (item.muted ? 0 : item.volume) *
          levelGain(level) *
          fadeAt(local, item.out - item.in, item.fadeIn, item.fadeOut) *
          (item.lane === 'music' ? duckAt(this.#edit, time) : 1),
      );
    }
  }

  /** Plays an element at `at` seconds, seeking only when it has drifted. */
  #follow(voice: Voice, at: number, now: number) {
    const media = voice.media;
    if (media.readyState < 1) return;
    const off = Math.abs(media.currentTime - at);
    if ((media.paused || off > driftLimit) && now >= voice.settled) {
      if (off > 0.05) media.currentTime = at;
      voice.settled = now + settleMs;
    }
    if (media.paused) media.play().catch(() => undefined);
  }

  #halt() {
    cancelAnimationFrame(this.#frame);
    this.#seek++;
    for (const map of [this.#videos, this.#overlays, this.#sounds])
      for (const voice of map.values()) voice.media.pause();
    this.playing = false;
  }

  // ----- drawing -----

  #size() {
    const canvas = this.#canvas;
    if (!canvas) return;
    const width = 1280;
    canvas.width = width;
    canvas.height = Math.round(width / this.aspect);
  }

  /** Draws timeline second `t`, still. */
  #paintAt(t: number) {
    this.#paint(t, this.#showing(t));
  }

  /** The current picture of a piece: its photo, or its video's frame. */
  #picture(place: Place): Picture | null {
    const piece = place.piece;
    if (this.#isPhoto(piece.clip)) {
      const image = this.#image(piece.clip);
      return image?.naturalWidth
        ? {
            source: image,
            width: image.naturalWidth,
            height: image.naturalHeight,
          }
        : null;
    }
    const video = this.#videos.get(slotOf(piece.clip, place.index))?.media as
      HTMLVideoElement | undefined;
    return video?.videoWidth
      ? { source: video, width: video.videoWidth, height: video.videoHeight }
      : null;
  }

  #shot(place: Place): Shot {
    return {
      picture: this.#picture(place),
      look: place.piece.look,
      fade: fadeOf(place),
    };
  }

  /** A layer's current image and its shape, for pictures and videos. */
  #layerSource(layer: Layer): {
    source: CanvasImageSource | null;
    aspect: number;
  } {
    if (layer.kind === 'picture') {
      const image = this.#image(layer.clip ?? '');
      return image?.naturalWidth
        ? { source: image, aspect: image.naturalWidth / image.naturalHeight }
        : { source: null, aspect: 1 };
    }
    if (layer.kind === 'video') {
      const video = this.#overlays.get(layer.id)?.media as
        HTMLVideoElement | undefined;
      return video?.videoWidth && video.readyState >= 2
        ? { source: video, aspect: video.videoWidth / video.videoHeight }
        : { source: null, aspect: 1 };
    }
    return { source: null, aspect: 1 };
  }

  /** The video track at `t`, then the layers over it. */
  #paint(t: number, show: Showing | null) {
    const canvas = this.#canvas;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const W = canvas.width;
    const H = canvas.height;
    if (show) {
      drawShots(
        context,
        this.#shot(show.a),
        show.b ? this.#shot(show.b) : null,
        show.kind,
        show.p,
        W,
        H,
        this.fit,
        this.#edit.background,
      );
    } else {
      context.save();
      context.globalAlpha = 1;
      context.filter = 'none';
      context.fillStyle = '#000';
      context.fillRect(0, 0, W, H);
      context.restore();
    }
    for (const layer of layersAt(this.#edit.layers, t)) {
      const { source, aspect } = this.#layerSource(layer);
      drawLayer(context, layer, source, aspect, W, H, t);
    }
  }
}
