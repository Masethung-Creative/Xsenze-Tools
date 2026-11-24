import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { htmlSafe } from '@ember/template';
import { modifier } from 'ember-modifier';
import { layerBox } from 'xsenze-tools/lib/video/edit/layers';
import {
  layersAt,
  type Clip,
  type Layer,
} from 'xsenze-tools/lib/video/edit/timeline';
import './frame-box.css';

interface FrameBoxSignature {
  Args: {
    layers: readonly Layer[];
    /** Timeline seconds on show. */
    time: number;
    clips: ReadonlyMap<string, Clip>;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    /** A drag has begun: the edit before it goes into the history. */
    onBegin: () => void;
    onChange: (id: string, change: Partial<Layer>) => void;
    onEnd: () => void;
  };
}

// px the pointer travels before a press becomes a drag
const dragStart = 3;
// px from the frame's middle that a moved item's middle snaps to it
const snapPx = 8;

interface Drag {
  kind: 'move' | 'size';
  id: string;
  /** The layer as the drag began. */
  layer: Layer;
  x: number;
  y: number;
  /** Pointer to the item's middle, px, for a move. */
  offX: number;
  offY: number;
  /** Pointer's distance from the middle when a resize began. */
  reach: number;
  begun: boolean;
}

const clamp = (x: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, x));

/**
 * The text and overlays on the preview, as things to grab: a press picks
 * the top one under the pointer, a drag moves it (snapping to the middle
 * lines), and the corner handle sizes it.
 */
export default class FrameBox extends Component<FrameBoxSignature> {
  @tracked W = 0;
  @tracked H = 0;
  @tracked guideX = false;
  @tracked guideY = false;
  #drag: Drag | null = null;

  #aspect(layer: Layer) {
    const clip = this.args.clips.get(layer.clip ?? '');
    return clip?.width ? clip.width / clip.height : 1;
  }

  get selected(): Layer | null {
    const id = this.args.selectedId;
    if (!id) return null;
    return (
      layersAt(this.args.layers, this.args.time).find((l) => l.id === id) ??
      null
    );
  }

  get boxStyle() {
    const layer = this.selected;
    if (!layer || !this.W) return null;
    const box = layerBox(layer, this.W, this.H, this.#aspect(layer));
    return htmlSafe(
      `left: ${box.x}px; top: ${box.y}px; width: ${box.w}px; height: ${box.h}px; transform: rotate(${layer.angle}deg)`,
    );
  }

  measure = modifier((element: HTMLElement) => {
    const observer = new ResizeObserver(() => {
      this.W = element.clientWidth;
      this.H = element.clientHeight;
    });
    observer.observe(element);
    this.W = element.clientWidth;
    this.H = element.clientHeight;
    return () => observer.disconnect();
  });

  /** The top layer under a point, in the element's px. */
  #hit(x: number, y: number): Layer | null {
    const on = layersAt(this.args.layers, this.args.time).reverse();
    return (
      on.find((layer) => {
        const box = layerBox(layer, this.W, this.H, this.#aspect(layer));
        return (
          x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h
        );
      }) ?? null
    );
  }

  pointer = modifier((element: HTMLElement) => {
    const at = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const down = (event: PointerEvent) => {
      if (event.button !== 0 || !this.W) return;
      const { x, y } = at(event);
      const handle = (event.target as HTMLElement).closest('[data-size]');
      const current = this.selected;
      const layer = handle && current ? current : this.#hit(x, y);
      if (!layer) {
        if (this.args.selectedId) this.args.onSelect(null);
        return;
      }
      if (layer.id !== this.args.selectedId) this.args.onSelect(layer.id);
      const cx = layer.x * this.W;
      const cy = layer.y * this.H;
      this.#drag = {
        kind: handle ? 'size' : 'move',
        id: layer.id,
        layer,
        x,
        y,
        offX: x - cx,
        offY: y - cy,
        reach: Math.max(1, Math.hypot(x - cx, y - cy)),
        begun: false,
      };
      element.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const move = (event: PointerEvent) => {
      const drag = this.#drag;
      if (!drag) return;
      const { x, y } = at(event);
      if (!drag.begun) {
        if (Math.hypot(x - drag.x, y - drag.y) < dragStart) return;
        drag.begun = true;
        this.args.onBegin();
      }
      const start = drag.layer;
      if (drag.kind === 'move') {
        let px = x - drag.offX;
        let py = y - drag.offY;
        this.guideX = Math.abs(px - this.W / 2) <= snapPx;
        this.guideY = Math.abs(py - this.H / 2) <= snapPx;
        if (this.guideX) px = this.W / 2;
        if (this.guideY) py = this.H / 2;
        this.args.onChange(drag.id, {
          x: clamp(px / this.W, 0, 1),
          y: clamp(py / this.H, 0, 1),
        });
        return;
      }
      const cx = start.x * this.W;
      const cy = start.y * this.H;
      const k = Math.hypot(x - cx, y - cy) / drag.reach;
      if (start.kind === 'text')
        this.args.onChange(drag.id, {
          style: {
            ...start.style,
            size: clamp(start.style.size * k, 0.02, 0.3),
          },
        });
      else if (start.kind === 'shape')
        this.args.onChange(drag.id, {
          w: clamp(start.w * k, 0.02, 1),
          h: clamp(start.h * k, 0.02, 1),
        });
      else this.args.onChange(drag.id, { w: clamp(start.w * k, 0.03, 1) });
    };

    const up = () => {
      const drag = this.#drag;
      this.#drag = null;
      this.guideX = false;
      this.guideY = false;
      if (drag?.begun) this.args.onEnd();
    };

    element.addEventListener('pointerdown', down);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);
    return () => {
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
    };
  });

  <template>
    <div class="ve-boxes" role="presentation" {{this.measure}} {{this.pointer}}>
      {{#if this.guideX}}
        <span class="ve-guide ve-guide--x"></span>
      {{/if}}
      {{#if this.guideY}}
        <span class="ve-guide ve-guide--y"></span>
      {{/if}}
      {{#if this.boxStyle}}
        <div class="ve-box" style={{this.boxStyle}}>
          <span class="ve-box__size" data-size="true"></span>
        </div>
      {{/if}}
    </div>
  </template>
}
