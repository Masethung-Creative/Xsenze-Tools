import Component from '@glimmer/component';
import CanonFigure from 'delphicanon/components/canon-figure';
import type { WaveformPeaks } from 'xsenze-tools/lib/audio';
import type { Cue } from 'xsenze-tools/lib/subtitles';
import CueTimeline, {
  type CueLane,
} from 'xsenze-tools/components/tools/media/cue-timeline';
import Strips from 'xsenze-tools/components/tools/media/strips';

export interface DubLane {
  /** Short label in the lane column, e.g. HI. */
  label: string;
  /** Lines voiced so far; all of them once done. */
  done: number;
}

/** One person's lines, in a lane of their own. */
export interface SpeakerLane {
  /** S1, S2… */
  label: string;
  cues: Cue[];
}

export interface PictureSignature {
  Args: {
    peaks: WaveformPeaks | null;
    /** Seconds of the file; 0 before it decodes. */
    duration: number;
    cues: Cue[];
    /** Short label of the source language, e.g. EN. */
    source: string;
    /** Two or more: a lane per speaker in place of the one source lane. */
    speakers?: SpeakerLane[];
    lanes: DubLane[];
    playhead?: number | null;
    onScrub?: (seconds: number) => void;
    /** The figure's number; empty hides it. */
    figure: string;
    unit: string;
    label: string;
  };
}

const noFrames: string[] = [];

/**
 * The file's waveform over its script lane (one per speaker when several speak) and one lane per dub language;
 * a language's blocks light up as its lines are voiced. A figure at the end.
 */
export default class Picture extends Component<PictureSignature> {
  get timeline(): CueLane[] {
    const cues = this.args.cues;
    const speakers = this.args.speakers ?? [];
    const sources: CueLane[] =
      speakers.length > 1
        ? speakers.map((s) => ({ cues: s.cues, label: s.label }))
        : [{ cues, label: this.args.source }];
    return [
      ...sources,
      ...this.args.lanes.map((lane) => ({
        cues,
        label: lane.label,
        lit: cues.length > 0 && lane.done >= cues.length,
        litThrough: lane.done,
      })),
    ];
  }

  get span() {
    return this.args.duration * 1000 || undefined;
  }

  <template>
    <div class="ad-picture">
      <div class="ad-picture-art">
        <Strips
          class="ad-wave"
          aria-hidden="true"
          @thumbnails={{noFrames}}
          @waveform={{true}}
          @peaks={{@peaks}}
          @duration={{@duration}}
          @playhead={{@playhead}}
          @onScrub={{@onScrub}}
        />
        <CueTimeline
          class="ad-timeline"
          @lanes={{this.timeline}}
          @span={{this.span}}
          @label={{@label}}
        />
      </div>
      {{#if @figure}}
        <CanonFigure
          class="ad-figure"
          aria-hidden="true"
          @text={{@figure}}
          @unit={{@unit}}
          @halo="var(--canon-muted)"
        />
      {{/if}}
    </div>
  </template>
}
