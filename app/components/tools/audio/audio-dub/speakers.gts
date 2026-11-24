import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import XzButton from 'xsenze-tools/components/xz/button';
import XzDialog from 'xsenze-tools/components/xz/dialog';
import XzEmptyRow from 'xsenze-tools/components/xz/empty-row';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzRow from 'xsenze-tools/components/xz/row';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSegmented from 'xsenze-tools/components/xz/segmented';
import XzStatus from 'xsenze-tools/components/xz/status';
import XzTextCell from 'xsenze-tools/components/xz/text-cell';
import { IconSvg } from 'xsenze-tools/components/icon';
import { PRESETS, type Preset } from 'xsenze-tools/lib/ai/dub/engines';
import {
  VOICE_TYPES,
  VOICE_TYPE_LABELS,
  speakerLabel,
  type Speaker,
  type VoiceType,
} from 'xsenze-tools/lib/ai/dub/speakers';

export interface SpeakersSignature {
  Args: {
    speakers: Speaker[];
    /** The voice each speaker will get, as resolved now. */
    presets: Preset[];
    /** Lines per speaker. */
    lines: number[];
    /** Found speakers yet (or still to find). */
    found: boolean;
    /** The run's engines have one voice only: presets do not apply. */
    singleVoice: boolean;
    busy: boolean;
    canFind: boolean;
    /** A cue whose speaker is being picked; null when none. */
    moving: number | null;
    /** Speaker index of the cue being moved. */
    movingFrom: number;
    onFind: () => void;
    onRename: (index: number, name: string) => void;
    onType: (index: number, type: VoiceType) => void;
    onVoice: (index: number, voice: 'auto' | Preset) => void;
    onMerge: (from: number, into: number) => void;
    onSample: (index: number) => void;
    onMove: (cue: number, speaker: number) => void;
    onCloseMove: () => void;
  };
}

const TYPE_LABELS = VOICE_TYPES.map((t) => VOICE_TYPE_LABELS[t]);
const VOICE_CHOICES: ('auto' | Preset)[] = ['auto', ...PRESETS];
const VOICE_LABELS = ['Auto', ...PRESETS];

const Find = <template><IconSvg @name="users" /></template>;
const Play = <template><IconSvg @name="play" /></template>;
const Edit = <template><IconSvg @name="pencil" /></template>;
const Merge = <template><IconSvg @name="merge" /></template>;

/**
 * The people in the file: one row each with type, lines and voice, a sample
 * and an edit dialog (name, type, voice, merge). Also the dialog that moves a
 * script line to another speaker.
 */
export default class Speakers extends Component<SpeakersSignature> {
  @tracked editing: number | null = null;

  get rows() {
    const { speakers, presets, lines, singleVoice } = this.args;
    return speakers.map((s, index) => {
      const n = lines[index] ?? 0;
      const voice = singleVoice
        ? 'single voice'
        : `${s.voice === 'auto' ? 'Auto' : 'Chosen'}: ${presets[index] ?? ''}`;
      return {
        index,
        title: speakerLabel(s),
        detail: `${VOICE_TYPE_LABELS[s.type]} · ${n} ${n === 1 ? 'line' : 'lines'} · ${voice}`,
      };
    });
  }

  get heading() {
    const n = this.args.speakers.length;
    if (!this.args.found) return 'Speakers';
    return `Speakers · ${n} found`;
  }

  get findText() {
    return this.args.found ? 'Find again' : 'Find speakers';
  }

  get cannotFind() {
    return !this.args.canFind;
  }

  /* --- the edit dialog --- */

  get current(): Speaker | undefined {
    return this.editing === null ? undefined : this.args.speakers[this.editing];
  }

  get dialogOpen() {
    return this.current !== undefined;
  }

  get dialogTitle() {
    return this.current ? `Speaker ${speakerLabel(this.current)}` : '';
  }

  get typeIndex() {
    return this.current ? VOICE_TYPES.indexOf(this.current.type) : 0;
  }

  get voiceIndex() {
    return this.current ? VOICE_CHOICES.indexOf(this.current.voice) : 0;
  }

  get voiceNote() {
    if (this.args.singleVoice)
      return 'The voice engine for these languages has one voice, so every speaker sounds the same.';
    const preset = this.editing === null ? '' : this.args.presets[this.editing];
    return this.current?.voice === 'auto'
      ? `Auto picks ${preset}: a voice of the type above that no other speaker uses.`
      : `Always ${preset}.`;
  }

  get others() {
    const editing = this.editing;
    return this.args.speakers
      .map((s, index) => ({ index, title: speakerLabel(s) }))
      .filter((s) => s.index !== editing);
  }

  edit = (index: number) => (this.editing = index);

  closed = () => (this.editing = null);

  rename = (name: string) => {
    if (this.editing !== null) this.args.onRename(this.editing, name);
  };

  pickType = (index: number) => {
    const type = VOICE_TYPES[index];
    if (this.editing !== null && type) this.args.onType(this.editing, type);
  };

  pickVoice = (index: number) => {
    const voice = VOICE_CHOICES[index];
    if (this.editing !== null && voice) this.args.onVoice(this.editing, voice);
  };

  merge = (into: number) => {
    const from = this.editing;
    this.editing = null;
    if (from !== null) this.args.onMerge(from, into);
  };

  sample = () => {
    if (this.editing !== null) this.args.onSample(this.editing);
  };

  /* --- the move dialog --- */

  get moveOpen() {
    return this.args.moving !== null;
  }

  get moveTitle() {
    return this.args.moving === null ? '' : `Line ${this.args.moving + 1}`;
  }

  get speakerLabels() {
    return this.args.speakers.map(speakerLabel);
  }

  move = (speaker: number) => {
    if (this.args.moving !== null) this.args.onMove(this.args.moving, speaker);
  };

  <template>
    <XzRows class="ad-speakers" @framed={{true}}>
      <XzHeading @text={{this.heading}} />
      {{#each this.rows key="index" as |row|}}
        <XzRow class="ad-speaker" @title={{row.title}} @detail={{row.detail}}>
          <span class="ad-job-actions">
            <XzButton
              class="ad-speaker-sample"
              @kind="cell"
              @icon={{Play}}
              @label="Play {{row.title}}"
              @onClick={{fn @onSample row.index}}
            />
            <XzButton
              class="ad-speaker-edit"
              @kind="cell"
              @text="Edit"
              @icon={{Edit}}
              @disabled={{@busy}}
              aria-haspopup="dialog"
              @onClick={{fn this.edit row.index}}
            />
          </span>
        </XzRow>
      {{else}}
        <XzEmptyRow
          @text="Dub finds who speaks each line, or find them first to name them"
        />
      {{/each}}
      <XzButton
        class="ad-speakers-find"
        @text={{this.findText}}
        @icon={{Find}}
        @disabled={{this.cannotFind}}
        @onClick={{@onFind}}
      />
    </XzRows>

    <XzDialog
      class="ad-speaker-dialog"
      @open={{this.dialogOpen}}
      @title={{this.dialogTitle}}
      @onClose={{this.closed}}
    >
      <:default>
        {{#if this.current}}
          <XzRow
            class="ad-speaker-name"
            @title="Name"
            @form="flush"
            as |titleId|
          >
            <XzTextCell
              aria-labelledby={{titleId}}
              @value={{this.current.name}}
              @placeholder="Teacher, Mom…"
              @onChange={{this.rename}}
            />
          </XzRow>
          <XzHeading @text="Voice type" />
          <XzSegmented
            class="ad-speaker-type"
            aria-label="Voice type"
            @items={{TYPE_LABELS}}
            @columns={{3}}
            @selected={{this.typeIndex}}
            @onChange={{this.pickType}}
          />
          <XzHeading @text="Voice" />
          <XzSegmented
            class="ad-speaker-voice"
            aria-label="Voice"
            @items={{VOICE_LABELS}}
            @columns={{6}}
            @selected={{this.voiceIndex}}
            @disabled={{@singleVoice}}
            @onChange={{this.pickVoice}}
          />
          <XzStatus @text={{this.voiceNote}} @tone="muted" @row={{true}} />
          {{#if this.others.length}}
            <XzHeading @text="Same person as" />
            {{#each this.others key="index" as |other|}}
              <XzRow class="ad-speaker-merge" @title={{other.title}}>
                <XzButton
                  @kind="cell"
                  @text="Merge"
                  @icon={{Merge}}
                  @label="Merge into {{other.title}}"
                  @onClick={{fn this.merge other.index}}
                />
              </XzRow>
            {{/each}}
          {{/if}}
        {{/if}}
      </:default>
      <:footer as |close|>
        <XzButton @text="Play sample" @icon={{Play}} @onClick={{this.sample}} />
        <XzButton @kind="primary" @text="Done" @onClick={{close}} />
      </:footer>
    </XzDialog>

    <XzDialog
      class="ad-move-dialog"
      @open={{this.moveOpen}}
      @title={{this.moveTitle}}
      @message="Who says this line?"
      @onClose={{@onCloseMove}}
    >
      <:default as |close|>
        <XzSegmented
          class="ad-move"
          aria-label="Speaker"
          @items={{this.speakerLabels}}
          @columns={{2}}
          @selected={{@movingFrom}}
          @onChange={{this.move}}
        />
        <XzButton @kind="primary" @text="Done" @onClick={{close}} />
      </:default>
    </XzDialog>
  </template>
}
