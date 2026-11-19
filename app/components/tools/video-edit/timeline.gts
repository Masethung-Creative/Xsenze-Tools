import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { htmlSafe } from '@ember/template';
import { modifier } from 'ember-modifier';
import { formatTimestamp } from 'xsenze-tools/lib/subtitles';
import {
  lengthOf,
  starts,
  total,
  type Clip,
  type Piece,
} from 'xsenze-tools/lib/video-edit/timeline';
import './timeline.css';

export type TrimEdge = 'in' | 'out';

interface TimelineSignature {
  Args: {
    clips: ReadonlyMap<string, Clip>;
    pieces: readonly Piece[];
    selectedId: string | null;
    /** Timeline seconds of the playhead. */
    time: number;
    /** Marked in and out, timeline seconds. */
    range: [number, number] | null;
    /** 1 fits the whole edit in view; more zooms in. */
    zoom: number;
    playing: boolean;
    onSelect: (id: string | null) => void;
    onScrub: (seconds: number) => void;
    /** A trim drag begins: the edit before it goes into the history. */
    onTrimStart: () => void;
    onTrim: (id: string, inPoint: number, outPoint: number) => void;
    onMove: (id: string, index: number) => void;
  };
  Element: HTMLDivElement;
}

// px the pointer must travel before a press on a piece becomes a drag
const dragStart = 5;
// px from a join that the playhead snaps to it
const snapPx = 8;

/** The lane's height in px, for thumbnail widths. */
const laneHeight = 92;

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

interface Drag {
  kind: 'scrub' | 'piece' | 'in' | 'out';
  id?: string;
  x: number;
  moved: boolean;
  /** The piece's in and out when a trim began. */
  from?: [number, number];
}

/**
 * One video track: the pieces in play order as filmstrips, the playhead,
 * the marked range, and trim handles on the selected piece. Pieces drag to
 * a new place; the ruler and the pieces scrub.
 */
export default class Timeline extends Component<TimelineSignature> {
  @tracked width = 0;
  /** Where a dragged piece would land, as an index, or null. */
  @tracked dropIndex: number | null = null;
  @tracked dragId: string | null = null;

  #drag: Drag | null = null;

  get total() {
    return total(this.args.pieces);
  }

  /** Pixels a second. */
  get pps() {
    const fit = this.total > 0 ? Math.max(this.width - 2, 1) / this.total : 50;
    return fit * Math.max(1, this.args.zoom);
  }

  get trackStyle() {
    return htmlSafe(
      `width: ${Math.max(this.total * this.pps, this.width - 2)}px`,
    );
  }

  get blocks() {
    const begins = starts(this.args.pieces);
    const pps = this.pps;
    return this.args.pieces.map((piece, index) => {
      const clip = this.args.clips.get(piece.clip);
      const duration = clip?.duration ?? lengthOf(piece);
      const frames = clip?.frames ?? [];
      const filmWidth = duration * pps;
      // thumbnails keep their shape: one per slot, the nearest in time
      const aspect = clip ? clip.width / clip.height : 16 / 9;
      const slot = Math.max(24, laneHeight * aspect);
      const count = frames.length ? Math.ceil(filmWidth / slot) : 0;
      const slots = Array.from({ length: count }, (_, i) => {
        const at = ((i + 0.5) * slot) / Math.max(filmWidth, 1);
        return frames[
          Math.min(frames.length - 1, Math.floor(at * frames.length))
        ]!;
      });
      return {
        piece,
        index,
        name: clip?.name ?? '',
        selected: piece.id === this.args.selectedId,
        dragging: piece.id === this.dragId,
        muted: piece.muted,
        style: htmlSafe(
          `left: ${begins[index]! * pps}px; width: ${lengthOf(piece) * pps}px`,
        ),
        filmStyle: htmlSafe(
          `width: ${filmWidth}px; transform: translateX(${-piece.in * pps}px)`,
        ),
        frameStyle: htmlSafe(`width: ${slot}px`),
        frames: slots,
        label: `${clip?.name ?? 'Clip'}, ${formatTimestamp(lengthOf(piece) * 1000, '.')}`,
      };
    });
  }

  get ticks() {
    const every = tickEvery(this.pps);
    const marks = [];
    for (let t = 0; t <= this.total + 1e-6; t += every)
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
    const begins = [...starts(this.args.pieces), this.total];
    return htmlSafe(`left: ${(begins[this.dropIndex] ?? 0) * this.pps}px`);
  }

  /** Timeline seconds under a client x. */
  #timeAt(track: HTMLElement, clientX: number) {
    const box = track.getBoundingClientRect();
    return Math.min(Math.max((clientX - box.left) / this.pps, 0), this.total);
  }

  /** Snaps a time to a join between pieces when it is near one. */
  #snap(t: number) {
    const joins = [...starts(this.args.pieces), this.total];
    const near = joins.find((join) => Math.abs(join - t) * this.pps <= snapPx);
    return near ?? t;
  }

  #landing(track: HTMLElement, clientX: number) {
    const t = this.#timeAt(track, clientX);
    const begins = starts(this.args.pieces);
    let index = 0;
    this.args.pieces.forEach((piece, i) => {
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
      const block = target.closest<HTMLElement>('[data-piece]');
      const id = (handle ?? block)?.dataset['piece'];
      track.setPointerCapture(event.pointerId);
      if (handle && id) {
        const piece = this.args.pieces.find((p) => p.id === id);
        this.#drag = {
          kind: handle.dataset['edge'] === 'in' ? 'in' : 'out',
          id,
          x: event.clientX,
          moved: false,
          from: piece ? [piece.in, piece.out] : undefined,
        };
        this.args.onTrimStart();
        event.preventDefault();
        return;
      }
      if (block && id) {
        this.#drag = { kind: 'piece', id, x: event.clientX, moved: false };
        this.args.onSelect(id);
        this.args.onScrub(this.#timeAt(track, event.clientX));
        return;
      }
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
      } else if (drag.from && drag.id) {
        const seconds = dx / this.pps;
        const [a, b] = drag.from;
        if (drag.kind === 'in') this.args.onTrim(drag.id, a + seconds, b);
        else this.args.onTrim(drag.id, a, b + seconds);
      }
    };

    const up = () => {
      const drag = this.#drag;
      this.#drag = null;
      if (drag?.kind === 'piece' && drag.moved && drag.id) {
        const from = this.args.pieces.findIndex((p) => p.id === drag.id);
        const landing = this.dropIndex ?? from;
        // dropping after itself counts the piece's own old place
        const index = landing > from ? landing - 1 : landing;
        if (index !== from) this.args.onMove(drag.id, index);
      }
      this.dragId = null;
      this.dropIndex = null;
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
    <div
      class="ve-timeline"
      {{this.measure}}
      {{this.follow @time @playing}}
      ...attributes
    >
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
        <div class="ve-lane">
          {{#each this.blocks key="piece.id" as |block|}}
            <div
              class="ve-piece
                {{if block.selected 've-piece--selected'}}
                {{if block.dragging 've-piece--dragging'}}"
              style={{block.style}}
              data-piece={{block.piece.id}}
              title={{block.label}}
            >
              <div class="ve-film" style={{block.filmStyle}}>
                {{#each block.frames as |frame|}}
                  <img src={{frame}} alt="" style={{block.frameStyle}} />
                {{/each}}
              </div>
              <span class="ve-piece__name">{{block.name}}</span>
              {{#if block.muted}}
                <span class="ve-piece__muted">muted</span>
              {{/if}}
              {{#if block.selected}}
                <span
                  class="ve-handle ve-handle--in"
                  data-edge="in"
                  data-piece={{block.piece.id}}
                ></span>
                <span
                  class="ve-handle ve-handle--out"
                  data-edge="out"
                  data-piece={{block.piece.id}}
                ></span>
              {{/if}}
            </div>
          {{/each}}
        </div>
        {{#if this.rangeStyle}}
          <div class="ve-range" style={{this.rangeStyle}}></div>
        {{/if}}
        {{#if this.dropStyle}}
          <div class="ve-drop" style={{this.dropStyle}}></div>
        {{/if}}
        {{#if @pieces.length}}
          <div class="ve-playhead" style={{this.playheadStyle}}></div>
        {{/if}}
      </div>
    </div>
  </template>
}
