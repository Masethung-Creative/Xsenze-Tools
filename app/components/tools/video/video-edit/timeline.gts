import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { htmlSafe } from '@ember/template';
import { modifier } from 'ember-modifier';
import { formatTimestamp } from 'xsenze-tools/lib/subtitles/subtitles';
import type { WaveformPeaks } from 'xsenze-tools/lib/audio/audio';
import {
  LANES,
  editLength,
  endOf,
  lengthOf,
  starts,
  total,
  type AudioItem,
  type Clip,
  type Edit,
  type Lane,
} from 'xsenze-tools/lib/video/edit/timeline';
import './timeline.css';

export type ItemKind = 'video' | 'audio';

export interface Selection {
  kind: ItemKind;
  id: string;
}

interface TimelineSignature {
  Args: {
    clips: ReadonlyMap<string, Clip>;
    edit: Edit;
    selected: Selection | null;
    /** Timeline seconds of the playhead. */
    time: number;
    /** Marked in and out, timeline seconds. */
    range: [number, number] | null;
    /** 1 fits the whole edit in view; more zooms in. */
    zoom: number;
    playing: boolean;
    onSelect: (selection: Selection | null) => void;
    onScrub: (seconds: number) => void;
    /** A trim drag begins: the edit before it goes into the history. */
    onTrimStart: () => void;
    onTrim: (id: string, inPoint: number, outPoint: number) => void;
    onMove: (id: string, index: number) => void;
    onAudioTrim: (id: string, inPoint: number, outPoint: number) => void;
    onAudioMove: (id: string, start: number, lane: Lane) => void;
  };
  Element: HTMLDivElement;
}

// px the pointer must travel before a press on an item becomes a drag
const dragStart = 5;
// px from a mark that a time snaps to it
const snapPx = 8;
/** The video lane's height in px, for thumbnail widths. */
const videoLaneHeight = 64;

const LANE_NAMES: Record<Lane, string> = { music: 'Music', voice: 'Voice' };

/** 0:05, 1:30, 1:02:00; with tenths when marks are under a second apart. */
function rulerTime(t: number, tenths: boolean): string {
  const whole = Math.floor(t + 1e-6);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const ss = String(whole % 60).padStart(2, '0');
  const head = h ? `${h}:${String(m).padStart(2, '0')}` : `${m}`;
  const tail = tenths ? `.${Math.round((t - whole) * 10) % 10}` : '';
  return `${head}:${ss}${tail}`;
}

/** Seconds between ruler marks for a scale of `pps` pixels a second. */
function tickEvery(pps: number): number {
  const steps = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  return steps.find((step) => step * pps >= 70) ?? 1200;
}

/** Draws the part of a waveform between `from` and `to` of a clip. */
const wave = modifier(
  (
    canvas: HTMLCanvasElement,
    [peaks, from, to, duration, width]: [
      WaveformPeaks | null,
      number,
      number,
      number,
      number,
    ],
  ) => {
    const context = canvas.getContext('2d');
    if (!context) return;
    const w = Math.max(1, Math.min(4096, Math.round(width)));
    const h = canvas.clientHeight || 32;
    canvas.width = w;
    canvas.height = h;
    context.clearRect(0, 0, w, h);
    if (!peaks || duration <= 0) return;
    const columns = peaks.min.length;
    const a = Math.floor((from / duration) * columns);
    const b = Math.max(a + 1, Math.ceil((to / duration) * columns));
    const count = b - a;
    context.fillStyle = getComputedStyle(canvas).color;
    const mid = h / 2;
    for (let x = 0; x < count; x++) {
      const i = a + x;
      if (i >= columns) break;
      const px = (x * w) / count;
      const top = mid - peaks.max[i]! * mid;
      const bottom = mid - peaks.min[i]! * mid;
      context.fillRect(
        px,
        top,
        Math.max(1, w / count),
        Math.max(1, bottom - top),
      );
    }
  },
);

interface Drag {
  kind: 'scrub' | 'piece' | 'sound' | 'in' | 'out';
  item?: ItemKind;
  id?: string;
  x: number;
  moved: boolean;
  /** The item's in and out when a trim began. */
  from?: [number, number];
  /** A sound's start and layer when a move began. */
  start?: number;
  lane?: Lane;
}

/**
 * The layers of an edit: the video track (pieces in play order, as
 * filmstrips) and the Music and Voice layers (sounds placed in time, as
 * waveforms), with the playhead, the marked range and trim handles on the
 * selected item. Pieces drag to a new place in the order; sounds drag to a
 * new time or layer.
 */
export default class Timeline extends Component<TimelineSignature> {
  @tracked width = 0;
  /** Where a dragged piece would land, as an index, or null. */
  @tracked dropIndex: number | null = null;
  @tracked dragId: string | null = null;
  /** A sound being dragged, where it would land. */
  @tracked ghost: { id: string; start: number; lane: Lane } | null = null;

  #drag: Drag | null = null;

  get length() {
    return editLength(this.args.edit);
  }

  /** Pixels a second. */
  get pps() {
    const fit =
      this.length > 0 ? Math.max(this.width - 2, 1) / this.length : 50;
    return fit * Math.max(1, this.args.zoom);
  }

  get trackStyle() {
    return htmlSafe(
      `width: ${Math.max(this.length * this.pps, this.width - 2)}px`,
    );
  }

  #isSelected(kind: ItemKind, id: string) {
    const s = this.args.selected;
    return !!s && s.kind === kind && s.id === id;
  }

  get pieces() {
    const pieces = this.args.edit.pieces;
    const begins = starts(pieces);
    const pps = this.pps;
    return pieces.map((piece, index) => {
      const clip = this.args.clips.get(piece.clip);
      // a photo's strip covers only what shows; a video's the whole clip
      const duration =
        clip?.kind === 'image'
          ? piece.out
          : (clip?.duration ?? lengthOf(piece));
      const frames = clip?.frames ?? [];
      // a faster piece squeezes its clip onto the timeline
      const speed = piece.speed || 1;
      const filmWidth = (duration * pps) / speed;
      // thumbnails keep their shape: one per slot, the nearest in time
      const aspect = clip?.width ? clip.width / clip.height : 16 / 9;
      const slot = Math.max(24, videoLaneHeight * aspect);
      const count = frames.length ? Math.ceil(filmWidth / slot) : 0;
      const slots = Array.from({ length: count }, (_, i) => {
        const at = ((i + 0.5) * slot) / Math.max(filmWidth, 1);
        return frames[
          Math.min(frames.length - 1, Math.floor(at * frames.length))
        ]!;
      });
      const width = lengthOf(piece) * pps;
      return {
        piece,
        index,
        width,
        duration,
        peaks: clip?.peaks ?? null,
        name: clip?.name ?? '',
        selected: this.#isSelected('video', piece.id),
        dragging: piece.id === this.dragId,
        quiet: piece.muted || piece.volume === 0,
        style: htmlSafe(`left: ${begins[index]! * pps}px; width: ${width}px`),
        filmStyle: htmlSafe(
          `width: ${filmWidth}px; transform: translateX(${(-piece.in * pps) / speed}px)`,
        ),
        frameStyle: htmlSafe(`width: ${slot}px`),
        frames: slots,
        label: `${clip?.name ?? 'Clip'}, ${formatTimestamp(lengthOf(piece) * 1000, '.')}`,
      };
    });
  }

  get lanes() {
    const pps = this.pps;
    const ghost = this.ghost;
    return LANES.map((lane) => ({
      lane,
      name: LANE_NAMES[lane],
      sounds: this.args.edit.audio
        .map((item) => {
          const moved = ghost?.id === item.id ? ghost : null;
          return {
            item,
            start: moved?.start ?? item.start,
            lane: moved?.lane ?? item.lane,
          };
        })
        .filter((at) => at.lane === lane)
        .map(({ item, start }) => this.#sound(item, start, pps)),
    }));
  }

  #sound(item: AudioItem, start: number, pps: number) {
    const clip = this.args.clips.get(item.clip);
    const width = (item.out - item.in) * pps;
    return {
      item,
      width,
      duration: clip?.duration ?? item.out,
      peaks: clip?.peaks ?? null,
      name: clip?.name ?? '',
      selected: this.#isSelected('audio', item.id),
      dragging: this.ghost?.id === item.id,
      quiet: item.muted || item.volume === 0,
      style: htmlSafe(`left: ${start * pps}px; width: ${width}px`),
      label: `${clip?.name ?? 'Sound'}, ${formatTimestamp((item.out - item.in) * 1000, '.')}`,
    };
  }

  get ticks() {
    const every = tickEvery(this.pps);
    const marks = [];
    for (let t = 0; t <= this.length + 1e-6; t += every)
      marks.push({
        style: htmlSafe(`left: ${t * this.pps}px`),
        text: rulerTime(t, every < 1),
      });
    return marks;
  }

  get playheadStyle() {
    return htmlSafe(`left: ${this.args.time * this.pps}px`);
  }

  get rangeStyle() {
    const range = this.args.range;
    if (!range) return null;
    const [a, b] = range[0] <= range[1] ? range : [range[1], range[0]];
    return htmlSafe(`left: ${a * this.pps}px; width: ${(b - a) * this.pps}px`);
  }

  get dropStyle() {
    if (this.dropIndex === null) return null;
    const pieces = this.args.edit.pieces;
    const begins = [...starts(pieces), total(pieces)];
    return htmlSafe(`left: ${(begins[this.dropIndex] ?? 0) * this.pps}px`);
  }

  get hasItems() {
    return this.args.edit.pieces.length > 0 || this.args.edit.audio.length > 0;
  }

  /** Timeline seconds under a client x. */
  #timeAt(track: HTMLElement, clientX: number) {
    const box = track.getBoundingClientRect();
    return Math.max((clientX - box.left) / this.pps, 0);
  }

  /** The times a moving edge or playhead snaps to. */
  #marks(except?: string) {
    const pieces = this.args.edit.pieces;
    const marks = [...starts(pieces), total(pieces), 0];
    // a moving sound snaps to the playhead; the playhead itself does not
    if (except) marks.push(this.args.time);
    for (const item of this.args.edit.audio)
      if (item.id !== except) marks.push(item.start, endOf(item));
    return marks;
  }

  #snap(t: number, except?: string) {
    const near = this.#marks(except)
      .map((mark) => ({ mark, off: Math.abs(mark - t) * this.pps }))
      .filter((m) => m.off <= snapPx)
      .sort((a, b) => a.off - b.off)[0];
    return near ? near.mark : t;
  }

  #landing(track: HTMLElement, clientX: number) {
    const t = this.#timeAt(track, clientX);
    const pieces = this.args.edit.pieces;
    const begins = starts(pieces);
    let index = 0;
    pieces.forEach((piece, i) => {
      if (t > begins[i]! + lengthOf(piece) / 2) index = i + 1;
    });
    return index;
  }

  measure = modifier((scroller: HTMLElement) => {
    const observer = new ResizeObserver(() => {
      this.width = scroller.clientWidth;
    });
    observer.observe(scroller);
    this.width = scroller.clientWidth;
    return () => observer.disconnect();
  });

  /** While playing, the view keeps the playhead in sight. */
  follow = modifier(
    (scroller: HTMLElement, [time, playing]: [number, boolean]) => {
      if (!playing) return;
      const x = time * this.pps;
      const { scrollLeft, clientWidth } = scroller;
      if (x < scrollLeft || x > scrollLeft + clientWidth - 24)
        scroller.scrollLeft = Math.max(0, x - clientWidth * 0.2);
    },
  );

  pointer = modifier((track: HTMLElement) => {
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      const handle = target.closest<HTMLElement>('[data-edge]');
      const block = target.closest<HTMLElement>('[data-item]');
      const id = (handle ?? block)?.dataset['item'];
      const item = (handle ?? block)?.dataset['kind'] as ItemKind | undefined;
      track.setPointerCapture(event.pointerId);
      if (handle && id && item) {
        const found =
          item === 'video'
            ? this.args.edit.pieces.find((p) => p.id === id)
            : this.args.edit.audio.find((a) => a.id === id);
        this.#drag = {
          kind: handle.dataset['edge'] === 'in' ? 'in' : 'out',
          item,
          id,
          x: event.clientX,
          moved: false,
          from: found ? [found.in, found.out] : undefined,
        };
        this.args.onTrimStart();
        event.preventDefault();
        return;
      }
      if (block && id && item === 'video') {
        this.#drag = { kind: 'piece', id, x: event.clientX, moved: false };
        this.args.onSelect({ kind: 'video', id });
        this.args.onScrub(this.#timeAt(track, event.clientX));
        return;
      }
      if (block && id && item === 'audio') {
        const sound = this.args.edit.audio.find((a) => a.id === id);
        this.#drag = {
          kind: 'sound',
          id,
          x: event.clientX,
          moved: false,
          start: sound?.start ?? 0,
          lane: sound?.lane ?? 'music',
        };
        this.args.onSelect({ kind: 'audio', id });
        return;
      }
      if (target.closest('[data-lane]')) this.args.onSelect(null);
      this.#drag = { kind: 'scrub', x: event.clientX, moved: false };
      this.args.onScrub(this.#snap(this.#timeAt(track, event.clientX)));
    };

    const move = (event: PointerEvent) => {
      const drag = this.#drag;
      if (!drag) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < dragStart) return;
      drag.moved = true;
      if (drag.kind === 'scrub') {
        this.args.onScrub(this.#snap(this.#timeAt(track, event.clientX)));
      } else if (drag.kind === 'piece' && drag.id) {
        this.dragId = drag.id;
        this.dropIndex = this.#landing(track, event.clientX);
      } else if (drag.kind === 'sound' && drag.id) {
        const under = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>('[data-lane]')?.dataset['lane'] as
          Lane | undefined;
        this.ghost = {
          id: drag.id,
          start: Math.max(
            0,
            this.#snap((drag.start ?? 0) + dx / this.pps, drag.id),
          ),
          lane: under ?? this.ghost?.lane ?? drag.lane ?? 'music',
        };
      } else if (drag.from && drag.id) {
        const [a, b] = drag.from;
        // a handle moves in clip seconds: a faster piece moves further
        const speed =
          drag.item === 'video'
            ? this.args.edit.pieces.find((p) => p.id === drag.id)?.speed || 1
            : 1;
        const seconds = (dx / this.pps) * speed;
        const trim =
          drag.item === 'audio' ? this.args.onAudioTrim : this.args.onTrim;
        if (drag.kind === 'in') trim(drag.id, a + seconds, b);
        else trim(drag.id, a, b + seconds);
      }
    };

    const up = () => {
      const drag = this.#drag;
      this.#drag = null;
      if (drag?.kind === 'piece' && drag.moved && drag.id) {
        const from = this.args.edit.pieces.findIndex((p) => p.id === drag.id);
        const landing = this.dropIndex ?? from;
        // dropping after itself counts the piece's own old place
        const index = landing > from ? landing - 1 : landing;
        if (index !== from) this.args.onMove(drag.id, index);
      }
      if (drag?.kind === 'sound' && drag.moved && drag.id && this.ghost)
        this.args.onAudioMove(drag.id, this.ghost.start, this.ghost.lane);
      this.dragId = null;
      this.dropIndex = null;
      this.ghost = null;
    };

    track.addEventListener('pointerdown', down);
    track.addEventListener('pointermove', move);
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);
    return () => {
      track.removeEventListener('pointerdown', down);
      track.removeEventListener('pointermove', move);
      track.removeEventListener('pointerup', up);
      track.removeEventListener('pointercancel', up);
    };
  });

  <template>
    <div class="ve-timeline" ...attributes>
      <div class="ve-labels" aria-hidden="true">
        <span></span>
        <span>Video</span>
        {{#each this.lanes as |lane|}}
          <span>{{lane.name}}</span>
        {{/each}}
      </div>
      <div class="ve-scroll" {{this.measure}} {{this.follow @time @playing}}>
        <div
          class="ve-track"
          style={{this.trackStyle}}
          role="presentation"
          {{this.pointer}}
        >
          <div class="ve-ruler" aria-hidden="true">
            {{#each this.ticks as |tick|}}
              <span class="ve-tick" style={{tick.style}}>{{tick.text}}</span>
            {{/each}}
          </div>

          <div class="ve-lane ve-lane--video" data-lane="video">
            {{#each this.pieces key="piece.id" as |block|}}
              <div
                class="ve-item ve-piece
                  {{if block.selected 've-item--selected'}}
                  {{if block.dragging 've-item--dragging'}}"
                style={{block.style}}
                data-item={{block.piece.id}}
                data-kind="video"
                title={{block.label}}
              >
                <div class="ve-film" style={{block.filmStyle}}>
                  {{#each block.frames as |frame|}}
                    <img src={{frame}} alt="" style={{block.frameStyle}} />
                  {{/each}}
                </div>
                {{#if block.peaks}}
                  <canvas
                    class="ve-wave ve-wave--under"
                    {{wave
                      block.peaks
                      block.piece.in
                      block.piece.out
                      block.duration
                      block.width
                    }}
                  ></canvas>
                {{/if}}
                <span class="ve-item__name">{{block.name}}</span>
                {{#if block.quiet}}
                  <span class="ve-item__muted">muted</span>
                {{/if}}
                {{#if block.selected}}
                  <span
                    class="ve-handle ve-handle--in"
                    data-edge="in"
                    data-kind="video"
                    data-item={{block.piece.id}}
                  ></span>
                  <span
                    class="ve-handle ve-handle--out"
                    data-edge="out"
                    data-kind="video"
                    data-item={{block.piece.id}}
                  ></span>
                {{/if}}
              </div>
            {{/each}}
          </div>

          {{#each this.lanes as |lane|}}
            <div class="ve-lane ve-lane--audio" data-lane={{lane.lane}}>
              {{#each lane.sounds key="item.id" as |sound|}}
                <div
                  class="ve-item ve-sound ve-sound--{{lane.lane}}
                    {{if sound.selected 've-item--selected'}}
                    {{if sound.dragging 've-item--dragging'}}"
                  style={{sound.style}}
                  data-item={{sound.item.id}}
                  data-kind="audio"
                  title={{sound.label}}
                >
                  <canvas
                    class="ve-wave"
                    {{wave
                      sound.peaks
                      sound.item.in
                      sound.item.out
                      sound.duration
                      sound.width
                    }}
                  ></canvas>
                  <span class="ve-item__name">{{sound.name}}</span>
                  {{#if sound.quiet}}
                    <span class="ve-item__muted">muted</span>
                  {{/if}}
                  {{#if sound.selected}}
                    <span
                      class="ve-handle ve-handle--in"
                      data-edge="in"
                      data-kind="audio"
                      data-item={{sound.item.id}}
                    ></span>
                    <span
                      class="ve-handle ve-handle--out"
                      data-edge="out"
                      data-kind="audio"
                      data-item={{sound.item.id}}
                    ></span>
                  {{/if}}
                </div>
              {{/each}}
            </div>
          {{/each}}

          {{#if this.rangeStyle}}
            <div class="ve-range" style={{this.rangeStyle}}></div>
          {{/if}}
          {{#if this.dropStyle}}
            <div class="ve-drop" style={{this.dropStyle}}></div>
          {{/if}}
          {{#if this.hasItems}}
            <div class="ve-playhead" style={{this.playheadStyle}}></div>
          {{/if}}
        </div>
      </div>
    </div>
  </template>
}
