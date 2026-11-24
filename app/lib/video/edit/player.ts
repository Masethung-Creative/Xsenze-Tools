import { tracked } from '@glimmer/tracking';
import { modifier } from 'ember-modifier';
import type { XzTransport } from 'xsenze-tools/components/xz/readout-band';
import { seekTo } from 'xsenze-tools/lib/video/video';
import {
  editLength,
  emptyEdit,
  endOf,
  fadeAt,
  lengthOf,
  placeAt,
  starts,
  total,
  type AudioItem,
  type Clip,
  type Edit,
  type Level,
  type Piece,
} from 'xsenze-tools/lib/video/edit/timeline';
import {
  drawPicture,
  type Fit,
  type Picture,
} from 'xsenze-tools/lib/video/edit/draw';

export type { Fit };

/** Timeline seconds into a piece, from the clip second it is at. */
const localOf = (piece: Piece, clipTime: number) =>
  (clipTime - piece.in) / (piece.speed || 1);

// seconds before a piece ends that the next clip is sought, so the switch is quick
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
 * Plays an edit on one clock: the video track onto one canvas (black bars,
 * fades to black), and every sound through its own gain, so volume can go
 * to 200 % and fade. One hidden video per clip, one audio element per sound
 * on the layers. The transport fields match the single-file Playback.
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
  #videos = new Map<string, Voice>();
  #images = new Map<string, HTMLImageElement>();
  #sounds = new Map<string, Voice>();
  #context?: AudioContext;
  #canvas?: HTMLCanvasElement;
  #frame = 0;
  #seek = 0;
  /** Clock: timeline seconds at `#startedAt`. */
  #base = 0;
  #startedAt = 0;
  #index = -1;

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

  /** The media and the edit to play; the frame on show is redrawn. */
  load(clips: readonly Clip[], edit: Edit) {
    this.#clips = new Map(clips.map((clip) => [clip.id, clip]));
    this.#edit = edit;
    for (const [id, voice] of this.#videos)
      if (!this.#clips.has(id)) this.#drop(this.#videos, id, voice);
    for (const id of this.#images.keys())
      if (!this.#clips.has(id)) this.#images.delete(id);
    const items = new Set(edit.audio.map((item) => item.id));
    for (const [id, voice] of this.#sounds)
      if (!items.has(id) || !this.#clips.has(this.#itemClip(id)))
        this.#drop(this.#sounds, id, voice);
    // every sound loads now, so it starts on time when the playhead reaches it
    for (const item of edit.audio) this.#sound(item);
    for (const piece of edit.pieces)
      if (this.#isPhoto(piece.clip)) this.#image(piece.clip);
      else this.#video(piece.clip);
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
    for (const [id, voice] of this.#videos) this.#drop(this.#videos, id, voice);
    for (const [id, voice] of this.#sounds) this.#drop(this.#sounds, id, voice);
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

  #video(clipId: string): Voice | undefined {
    let voice = this.#videos.get(clipId);
    const clip = this.#clips.get(clipId);
    if (!clip) return undefined;
    if (!voice) {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.playsInline = true;
      video.src = clip.url;
      video.addEventListener('seeked', () => {
        if (!this.playing && this.#shown() === video) this.#paintAt(this.time);
      });
      voice = this.#voice(video);
      this.#videos.set(clipId, voice);
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

  #shown(): HTMLVideoElement | undefined {
    const piece = this.#edit.pieces[this.#index];
    const media = piece ? this.#videos.get(piece.clip)?.media : undefined;
    return media as HTMLVideoElement | undefined;
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

  // ----- still frames -----

  async #show(t: number) {
    const place =
      t < total(this.#edit.pieces) ? placeAt(this.#edit.pieces, t) : null;
    if (!place) {
      this.#index = -1;
      return this.#blank();
    }
    this.#index = place.index;
    if (this.#isPhoto(place.piece.clip)) {
      this.#image(place.piece.clip);
      this.#paintAt(t);
      return;
    }
    const voice = this.#video(place.piece.clip);
    if (!voice) return;
    const seek = ++this.#seek;
    await this.#ready(voice.media);
    if (seek !== this.#seek) return;
    await seekTo(voice.media as HTMLVideoElement, place.clipTime);
    if (seek === this.#seek && !this.playing) this.#paintAt(t);
  }

  // ----- playing -----

  #restart(time: number) {
    cancelAnimationFrame(this.#frame);
    this.#seek++;
    this.#base = time;
    this.#startedAt = performance.now();
    // every element is sought again on the next frame
    for (const voice of [...this.#videos.values(), ...this.#sounds.values()]) {
      voice.media.pause();
      voice.settled = 0;
    }
    this.#index = -1;
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
    this.#playVideo(time, now);
    this.#playSounds(time, now);
    this.#frame = requestAnimationFrame(this.#tick);
  };

  /** Keeps the right video playing at the clock's time and draws it. */
  #playVideo(time: number, now: number) {
    const pieces = this.#edit.pieces;
    const place = time < total(pieces) ? placeAt(pieces, time) : null;
    if (!place) {
      for (const voice of this.#videos.values()) voice.media.pause();
      this.#index = -1;
      this.#blank();
      return;
    }
    const local = localOf(place.piece, place.clipTime);
    const fade = fadeAt(
      local,
      lengthOf(place.piece),
      place.piece.fadeIn,
      place.piece.fadeOut,
    );
    if (this.#isPhoto(place.piece.clip)) {
      for (const other of this.#videos.values()) other.media.pause();
      this.#index = place.index;
      this.#paint(place.piece, fade);
    } else {
      const voice = this.#video(place.piece.clip);
      if (!voice) return;
      if (this.#index !== place.index) {
        for (const other of this.#videos.values())
          if (other !== voice) other.media.pause();
        this.#index = place.index;
      }
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
          levelGain(this.#edit.mix.video) *
          fade,
      );
      this.#paint(place.piece, fade);
    }
    // the next clip seeks ahead of time
    const next = pieces[place.index + 1];
    if (next && next.clip !== place.piece.clip && !this.#isPhoto(next.clip)) {
      const begin = starts(pieces)[place.index] ?? 0;
      if (begin + lengthOf(place.piece) - time < preseek) {
        const upcoming = this.#video(next.clip);
        if (
          upcoming &&
          upcoming.media.paused &&
          Math.abs(upcoming.media.currentTime - next.in) > 0.05
        )
          upcoming.media.currentTime = next.in;
      }
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
          fadeAt(local, item.out - item.in, item.fadeIn, item.fadeOut),
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
    for (const voice of [...this.#videos.values(), ...this.#sounds.values()])
      voice.media.pause();
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

  #blank() {
    const canvas = this.#canvas;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  /** Draws the piece at timeline second `t`, still. */
  #paintAt(t: number) {
    const pieces = this.#edit.pieces;
    const place = t < total(pieces) ? placeAt(pieces, t) : null;
    if (!place) return this.#blank();
    this.#paint(
      place.piece,
      fadeAt(
        localOf(place.piece, place.clipTime),
        lengthOf(place.piece),
        place.piece.fadeIn,
        place.piece.fadeOut,
      ),
    );
  }

  /** The current picture of a piece: its photo, or its video's frame. */
  #picture(piece: Piece): Picture | null {
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
    const video = this.#videos.get(piece.clip)?.media as
      HTMLVideoElement | undefined;
    return video?.videoWidth
      ? { source: video, width: video.videoWidth, height: video.videoHeight }
      : null;
  }

  /** Draws a piece with its look, with a fade towards black below 1. */
  #paint(piece: Piece, fade: number) {
    const canvas = this.#canvas;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    drawPicture(
      context,
      this.#picture(piece),
      piece.look,
      canvas.width,
      canvas.height,
      this.fit,
      this.#edit.background,
      fade,
    );
  }
}
