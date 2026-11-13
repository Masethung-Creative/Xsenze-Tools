import Component from '@glimmer/component';
import CanonFigure from 'delphicanon/components/canon-figure';
import type { WaveformPeaks } from 'xsenze-tools/lib/audio';
import type { Cue } from 'xsenze-tools/lib/subtitles';
import CueTimeline, {
  type CueLane,
} from 'xsenze-tools/components/tools/media/cue-timeline';
import Strips from 'xsenze-tools/components/tools/media/strips';

export interface PictureSignature {
  Args: {
    peaks: WaveformPeaks | null;
    /** Seconds of the file; 0 before it decodes. */
    duration: number;
    cues: Cue[];
    /** The run finished: the waveform lights up. */
    done: boolean;
    /** The figure's number; empty hides it. */
    figure: string;
    unit: string;
    label: string;
  };
}

const noFrames: string[] = [];

/** The file's waveform over a lane of the cues, a figure at the trailing end. */
export default class Picture extends Component<PictureSignature> {
  get lanes(): CueLane[] {
    return [{ cues: this.args.cues, lit: true }];
  }

  get span() {
    return this.args.duration * 1000 || undefined;
  }

  <template>
    <div class="as-picture {{if @done 'as-picture--done'}}">
      <div
        class="as-picture-name"
        role="img"
        aria-label={{@label}}
        aria-hidden={{unless @label "true"}}
      ></div>
      <Strips
        class="as-wave"
        aria-hidden="true"
        @thumbnails={{noFrames}}
        @waveform={{true}}
        @peaks={{@peaks}}
        @duration={{@duration}}
      />
      <CueTimeline
        class="as-lane"
        aria-hidden="true"
        @lanes={{this.lanes}}
        @span={{this.span}}
      />
      {{#if @figure}}
        <CanonFigure
          class="as-figure"
          aria-hidden="true"
          @text={{@figure}}
          @unit={{@unit}}
          @halo="var(--canon-muted)"
        />
      {{/if}}
    </div>
  </template>
}
