import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import XzSegmented from 'xsenze-tools/components/xz/segmented';
import PropSlider from 'xsenze-tools/components/tools/video/video-edit/prop-slider';
import { ANIMS, ANIM_IDS } from 'xsenze-tools/lib/video/edit/anim';
import type { Anim } from 'xsenze-tools/lib/video/edit/timeline';
import './anim-picker.css';

export type AnimSide = 'in' | 'out';

const SIDE_LABELS = ['In', 'Out'];
const seconds = (value: number) => `${value.toFixed(1)} s`;

interface AnimPickerSignature {
  Element: HTMLDivElement;
  Args: {
    animIn: Anim;
    animOut: Anim;
    seconds: number;
    /** Offers the typewriter: titles only. */
    typing?: boolean;
    onPick: (side: AnimSide, anim: Anim) => void;
    onSeconds: (seconds: number, dragging: boolean) => void;
  };
}

/**
 * How an item comes in and goes out: an In / Out switch over a grid of
 * tiles, each a small picture of its animation that plays on hover or
 * focus, and how long they take.
 */
export default class AnimPicker extends Component<AnimPickerSignature> {
  @tracked side: AnimSide = 'in';

  get sideIndex() {
    return this.side === 'in' ? 0 : 1;
  }

  get isOut() {
    return this.side === 'out';
  }

  get chosen(): Anim {
    return this.isOut ? this.args.animOut : this.args.animIn;
  }

  get tiles() {
    // typing only comes in, and only for titles
    const ids = ANIM_IDS.filter(
      (id) => id !== 'typewriter' || (!this.isOut && this.args.typing),
    );
    return ids.map((id) => ({
      id,
      label: ANIMS[id],
      on: id === this.chosen,
      none: id === 'none',
      typing: id === 'typewriter',
    }));
  }

  get groupLabel() {
    return this.isOut ? 'Goes out' : 'Comes in';
  }

  pickSide = (index: number) => (this.side = index === 1 ? 'out' : 'in');

  pick = (anim: Anim) => this.args.onPick(this.side, anim);

  /** Arrow keys move along the tiles, as in a radio group. */
  move = (event: KeyboardEvent) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (!step) return;
    event.preventDefault();
    // the editor steps frames with the arrows: not while picking here
    event.stopPropagation();
    const tiles = this.tiles;
    const at = tiles.findIndex((tile) => tile.on);
    const next = tiles[(at + step + tiles.length) % tiles.length];
    if (!next) return;
    this.pick(next.id);
    const group = event.currentTarget as HTMLElement;
    // the new tile itself now, so the next arrow goes on from it
    group.querySelector<HTMLElement>(`[data-anim="${next.id}"]`)?.focus();
  };

  <template>
    <div
      class="ve-anim-picker {{if this.isOut 've-anim-picker--out'}}"
      ...attributes
    >
      <XzSegmented
        class="ve-anim-side"
        @items={{SIDE_LABELS}}
        @selected={{this.sideIndex}}
        @onChange={{this.pickSide}}
      />
      {{! template-lint-disable no-invalid-interactive }}
      <div
        class="ve-anim-grid"
        role="radiogroup"
        aria-label={{this.groupLabel}}
        {{on "keydown" this.move}}
      >
        {{#each this.tiles key="id" as |tile|}}
          <button
            type="button"
            role="radio"
            class="ve-anim-tile {{if tile.on 'is-on'}}"
            aria-checked={{if tile.on "true" "false"}}
            tabindex={{if tile.on "0" "-1"}}
            data-anim={{tile.id}}
            {{on "click" (fn this.pick tile.id)}}
          >
            <span class="ve-anim-tile__pic" aria-hidden="true">
              {{#if tile.none}}
                <span class="ve-anim-tile__none"></span>
              {{else if tile.typing}}
                <span
                  class="ve-anim-tile__box ve-anim-tile__box--text"
                >Abc</span>
              {{else}}
                <span class="ve-anim-tile__box"></span>
              {{/if}}
            </span>
            <span class="ve-anim-tile__name">{{tile.label}}</span>
          </button>
        {{/each}}
      </div>
      <PropSlider
        class="ve-anim-seconds"
        @label="Takes"
        @value={{@seconds}}
        @min={{0.1}}
        @max={{3}}
        @step={{0.1}}
        @nudge={{0.1}}
        @readout={{seconds}}
        @onChange={{@onSeconds}}
      />
    </div>
  </template>
}
