import Component from '@glimmer/component';
import XzFigure from 'xsenze-tools/components/xz/figure';
import type { Cue } from 'xsenze-tools/lib/subtitles';
import CueTimeline, {
  type CueLane,
} from 'xsenze-tools/components/tools/media/cue-timeline';

export interface TargetLane {
  /** Short label in the lane column, e.g. TA. */
  label: string;
  /** Lines translated so far; all of them once done. */
  done: number;
}

export interface PictureSignature {
  Args: {
    cues: Cue[];
    /** Short label of the source language, e.g. EN. */
    source: string;
    targets: TargetLane[];
    /** The figure's number; empty hides it. */
    figure: string;
    unit: string;
    label: string;
  };
}

/**
 * The original cues (dim) over one lane per target language; a target's
 * blocks light up as their lines are translated. A figure at the trailing end.
 */
export default class Picture extends Component<PictureSignature> {
  get lanes(): CueLane[] {
    const cues = this.args.cues;
    return [
      { cues, label: this.args.source },
      ...this.args.targets.map((target) => ({
        cues,
        label: target.label,
        lit: cues.length > 0 && target.done >= cues.length,
        litThrough: target.done,
      })),
    ];
  }

  <template>
    <div class="st-picture">
      <CueTimeline
        class="st-timeline"
        @lanes={{this.lanes}}
        @label={{@label}}
      />
      {{#if @figure}}
        <XzFigure
          class="st-figure"
          aria-hidden="true"
          @text={{@figure}}
          @unit={{@unit}}
          @halo="var(--xz-surface-2)"
        />
      {{/if}}
    </div>
  </template>
}
