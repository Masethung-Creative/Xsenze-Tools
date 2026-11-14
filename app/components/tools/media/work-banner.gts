import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import CanonBar from 'delphicanon/components/canon-bar';
import CanonButton from 'delphicanon/components/canon-button';
import CanonLoader from 'delphicanon/components/canon-loader';
import { IconSvg } from 'xsenze-tools/components/icon';
import './work-banner.css';

const Cancel = <template><IconSvg @name="x" /></template>;

// the countdown waits for this much time and progress before it guesses
const AFTER_MS = 2000;
const AFTER_SHARE = 0.02;

function clock(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

export interface WorkBannerSignature {
  Args: {
    title: string;
    /** 0 to 1. */
    progress: number;
    onCancel?: () => void;
  };
}

/**
 * A banner's busy state: the title, time left, percent, a bar and Cancel.
 * Render it only while the job runs: the clock starts when it appears.
 */
export default class WorkBanner extends Component<WorkBannerSignature> {
  @tracked now = Date.now();
  #started = this.now;
  #ticker = setInterval(() => (this.now = Date.now()), 500);

  willDestroy() {
    super.willDestroy();
    clearInterval(this.#ticker);
  }

  get percent() {
    return `${Math.round(this.args.progress * 100)}%`;
  }

  get countdown() {
    const elapsed = this.now - this.#started;
    const share = this.args.progress;
    if (elapsed < AFTER_MS || share < AFTER_SHARE) return 'Estimating…';
    return `${clock((elapsed * (1 - share)) / share / 1000)} left`;
  }

  <template>
    <div class="work-banner">
      <div class="work-banner-head">
        <span class="work-banner-title">
          <CanonLoader @cell={{5}} @gap={{1}} />
          {{@title}}
        </span>
        <span class="work-banner-time" role="status">
          <span class="work-banner-eta">{{this.countdown}}</span>
          <span class="work-banner-percent">{{this.percent}}</span>
        </span>
      </div>
      <CanonBar class="work-banner-bar" @share={{@progress}} />
      {{#if @onCancel}}
        <div class="work-banner-foot">
          <CanonButton
            class="work-banner-cancel"
            @kind="cell"
            @text="Cancel"
            @icon={{Cancel}}
            @onClick={{@onCancel}}
          />
        </div>
      {{/if}}
    </div>
  </template>
}
