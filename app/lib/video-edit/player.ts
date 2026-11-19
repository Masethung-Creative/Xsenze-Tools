import { tracked } from '@glimmer/tracking';
import { modifier } from 'ember-modifier';
import type { XzTransport } from 'xsenze-tools/components/xz/readout-band';
import { seekTo } from 'xsenze-tools/lib/video';
import {
  placeAt,
  starts,
  total,
  type Clip,
  type Piece,
} from 'xsenze-tools/lib/video-edit/timeline';

/** How the picture sits in a frame of another shape. */
export type Fit = 'contain' | 'cover';

/** Where a picture of `w`×`h` is drawn in a `W`×`H` frame. */
export function fitBox(
  w: number,
  h: number,
  W: number,
  H: number,
  fit: Fit = 'contain',
) {
  const scale =
    fit === 'contain' ? Math.min(W / w, H / h) : Math.max(W / w, H / h);
  const dw = w * scale;
  const dh = h * scale;
  return { x: (W - dw) / 2, y: (H - dh) / 2, w: dw, h: dh };
}

// seconds before a piece ends that the next clip is sought, so the switch is quick
const preseek = 0.5;
// a piece is done this close to its out point (a frame at 60 fps)
const endSlack = 1 / 60;

/**
 * Plays an edit: the pieces in order, across clips, onto one canvas. One
 * hidden video element per clip; the one playing gives the sound. The
 * transport fields match the single-file Playback, so the same footer
 * drives it.
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
  #videos = new Map<string, HTMLVideoElement>();
  #pieces: readonly Piece[] = [];
  #canvas?: HTMLCanvasElement;
  #index = -1;
  #frame = 0;
  #seek = 0;

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
    return total(this.#pieces);
  }

  /** The clips and pieces to play; the frame on show is redrawn. */
  load(clips: readonly Clip[], pieces: readonly Piece[]) {
    this.#clips = new Map(clips.map((clip) => [clip.id, clip]));
    for (const [id, video] of this.#videos) {
      if (this.#clips.has(id)) continue;
      video.pause();
      video.removeAttribute('src');
      video.load();
      this.#videos.delete(id);
    }
    this.#pieces = pieces;
    const end = total(pieces);
    if (!pieces.length) {
      this.#halt();
      this.time = 0;
      this.#blank();
      return;
    }
    if (this.playing) {
      // the edit changed under the playhead: carry on from the same time
      this.#halt();
      this.time = Math.min(this.time, end);
      this.play();
    } else {
      this.time = Math.min(this.time, end);
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
    if (!this.#pieces.length) return;
    if (this.time >= this.duration - endSlack) this.time = 0;
    const place = placeAt(this.#pieces, this.time);
    if (!place) return;
    this.playing = true;
    this.paused = false;
    void this.#start(place.index, place.clipTime);
  };

  pause = () => {
    if (!this.playing) return;
    this.#halt();
    this.paused = true;
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
    if (this.playing) {
      const place = placeAt(this.#pieces, time);
      if (place) void this.#start(place.index, place.clipTime);
    } else {
      if (time > 0) this.paused = true;
      void this.#show(time);
    }
  };

  /** Pauses and moves by `seconds`, for frame steps. */
  stepBy = (seconds: number) => {
    this.pause();
    this.scrub(this.time + seconds);
  };

  /** Frames a second of the clip on show. */
  get fps() {
    const place = placeAt(this.#pieces, this.time);
    return (place && this.#clips.get(place.piece.clip)?.fps) || 30;
  }

  destroy() {
    this.#halt();
    for (const video of this.#videos.values()) {
      video.removeAttribute('src');
      video.load();
    }
    this.#videos.clear();
  }

  #video(clipId: string): HTMLVideoElement | undefined {
    let video = this.#videos.get(clipId);
    const clip = this.#clips.get(clipId);
    if (!clip) return undefined;
    if (!video) {
      const created = document.createElement('video');
      created.preload = 'auto';
      created.playsInline = true;
      created.src = clip.url;
      // a new frame of a paused video is drawn once it is there
      created.addEventListener('seeked', () => {
        if (!this.playing && this.#current() === created) this.#draw(created);
      });
      this.#videos.set(clipId, created);
      video = created;
    }
    return video;
  }

  #current(): HTMLVideoElement | undefined {
    const piece = this.#pieces[this.#index];
    return piece ? this.#videos.get(piece.clip) : undefined;
  }

  #sound(video: HTMLVideoElement, piece: Piece) {
    video.muted = piece.muted;
    video.volume = Math.min(1, Math.max(0, piece.volume));
  }

  async #show(t: number) {
    const place = placeAt(this.#pieces, t);
    if (!place) return this.#blank();
    const video = this.#video(place.piece.clip);
    if (!video) return;
    this.#index = place.index;
    const seek = ++this.#seek;
    await this.#ready(video);
    if (seek !== this.#seek) return;
    await seekTo(video, place.clipTime);
    if (seek === this.#seek && !this.playing) this.#draw(video);
  }

  #ready(video: HTMLVideoElement): Promise<void> {
    if (video.readyState >= 1) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => resolve();
      video.addEventListener('loadedmetadata', done, { once: true });
      video.addEventListener('error', done, { once: true });
    });
  }

  async #start(index: number, clipTime: number) {
    cancelAnimationFrame(this.#frame);
    const piece = this.#pieces[index];
    if (!piece) return;
    const video = this.#video(piece.clip);
    if (!video) return;
    for (const other of this.#videos.values())
      if (other !== video) other.pause();
    this.#index = index;
    const seek = ++this.#seek;
    this.#sound(video, piece);
    await this.#ready(video);
    if (seek !== this.#seek || !this.playing) return;
    if (Math.abs(video.currentTime - clipTime) > 0.05)
      video.currentTime = clipTime;
    video.play().catch(() => this.pause());
    this.#tick();
  }

  #tick = () => {
    cancelAnimationFrame(this.#frame);
    if (!this.playing) return;
    const index = this.#index;
    const piece = this.#pieces[index];
    const video = this.#current();
    if (!piece || !video) return;
    const begin = starts(this.#pieces)[index] ?? 0;
    const at = Math.min(video.currentTime, piece.out);
    this.time = begin + Math.max(0, at - piece.in);
    this.#draw(video);
    const next = this.#pieces[index + 1];
    // the next clip seeks ahead of time
    if (next && next.clip !== piece.clip && piece.out - at < preseek) {
      const upcoming = this.#video(next.clip);
      if (upcoming && Math.abs(upcoming.currentTime - next.in) > 0.05)
        upcoming.currentTime = next.in;
    }
    if (at >= piece.out - endSlack || video.ended) {
      this.#advance(index + 1, video);
      return;
    }
    this.#frame = requestAnimationFrame(this.#tick);
  };

  #advance(index: number, from: HTMLVideoElement) {
    const piece = this.#pieces[index];
    if (!piece) {
      if (this.looping && this.#pieces.length) {
        this.loops += 1;
        void this.#start(0, this.#pieces[0]!.in);
        return;
      }
      from.pause();
      this.playing = false;
      this.paused = true;
      this.time = this.duration;
      return;
    }
    const video = this.#video(piece.clip);
    // the next piece carries straight on in the same clip: no seek
    if (video === from && Math.abs(from.currentTime - piece.in) < 0.05) {
      this.#index = index;
      this.#sound(from, piece);
      this.#frame = requestAnimationFrame(this.#tick);
      return;
    }
    void this.#start(index, piece.in);
  }

  #halt() {
    cancelAnimationFrame(this.#frame);
    this.#seek++;
    for (const video of this.#videos.values()) video.pause();
    this.playing = false;
  }

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

  #draw(video: HTMLVideoElement) {
    const canvas = this.#canvas;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !video.videoWidth) return;
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const box = fitBox(
      video.videoWidth,
      video.videoHeight,
      canvas.width,
      canvas.height,
      this.fit,
    );
    context.drawImage(video, box.x, box.y, box.w, box.h);
  }
}
