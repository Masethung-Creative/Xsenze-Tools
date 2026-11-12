import { tracked } from '@glimmer/tracking';
import { modifier } from 'ember-modifier';
import type { CanonTransport } from 'delphicanon/components/canon-readout-band';

/**
 * Play, Pause, Stop, Loop and
 * scrub, with the playhead a readout band shows. Stop parks at the start.
 */
export default class Playback {
  @tracked playing = false;
  @tracked paused = false;
  @tracked looping = false;
  @tracked loops = 0;
  @tracked playhead: number | null = null;
  /**
   * In and out seconds: Play starts at the in point unless the playhead is
   * inside, stops at the out point, Loop wraps between them, Stop parks at
   * the in point. None plays the whole file.
   */
  range: [number, number] | null = null;

  #media?: HTMLMediaElement;
  #frame = 0;

  get transport(): CanonTransport {
    return {
      playhead: this.playhead,
      playing: this.playing,
      paused: this.paused,
      looping: this.looping,
      loops: this.loops,
    };
  }

  get active() {
    return this.playing || this.paused;
  }

  get #start() {
    return this.range?.[0] ?? 0;
  }

  /** Binds the element that plays; a new source resets the transport. */
  register = modifier((media: HTMLMediaElement) => {
    this.#media = media;
    const ended = () => {
      if (!this.looping) return this.stop();
      this.#wrap(media);
    };
    const reset = () => this.#idle();
    media.addEventListener('ended', ended);
    media.addEventListener('emptied', reset);
    return () => {
      media.removeEventListener('ended', ended);
      media.removeEventListener('emptied', reset);
      if (this.#media === media) this.#media = undefined;
      this.#idle();
    };
  });

  toggle = () => (this.playing ? this.pause() : this.play());

  play = () => {
    const media = this.#media;
    if (!media) return;
    const range = this.range;
    if (
      range &&
      (media.currentTime < range[0] || media.currentTime >= range[1])
    )
      media.currentTime = range[0];
    this.playing = true;
    this.paused = false;
    this.playhead = media.currentTime;
    media.play().catch(() => this.#idle());
    this.#tick();
  };

  pause = () => {
    if (!this.playing) return;
    this.#media?.pause();
    this.playing = false;
    this.paused = true;
    cancelAnimationFrame(this.#frame);
    this.#read();
  };

  stop = () => {
    const media = this.#media;
    if (media) {
      media.pause();
      media.currentTime = this.#start;
    }
    this.#idle();
  };

  /** Drops the source before its object URL goes, so no load is left to fail. */
  unload = () => {
    const media = this.#media;
    if (media) {
      media.pause();
      media.removeAttribute('src');
      media.load();
    }
    this.#idle();
  };

  toggleLoop = () => (this.looping = !this.looping);

  scrub = (seconds: number) => {
    const media = this.#media;
    if (!media) return;
    media.currentTime = seconds;
    this.playhead = seconds;
    if (!this.playing) this.paused = true;
  };

  /** Pauses and moves by `seconds` inside the file, for frame steps. */
  stepBy = (seconds: number) => {
    const media = this.#media;
    if (!media) return;
    this.pause();
    const end = Number.isFinite(media.duration) ? media.duration : Infinity;
    this.scrub(Math.min(Math.max(media.currentTime + seconds, 0), end));
  };

  #wrap(media: HTMLMediaElement) {
    this.loops += 1;
    media.currentTime = this.#start;
    void media.play();
  }

  #idle() {
    cancelAnimationFrame(this.#frame);
    this.playing = false;
    this.paused = false;
    this.playhead = null;
  }

  #read() {
    if (this.#media) this.playhead = this.#media.currentTime;
  }

  // ponytail: the out point is read once a frame, so playback can overrun it by up to 16 ms
  #tick = () => {
    cancelAnimationFrame(this.#frame);
    if (!this.playing) return;
    const media = this.#media;
    const end = this.range?.[1];
    if (media && end !== undefined && media.currentTime >= end) {
      if (!this.looping) return this.stop();
      this.#wrap(media);
    }
    this.#read();
    this.#frame = requestAnimationFrame(this.#tick);
  };
}
