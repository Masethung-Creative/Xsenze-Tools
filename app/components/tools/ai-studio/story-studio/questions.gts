import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzMenuCell from 'xsenze-tools/components/xz/menu-cell';
import XzNumberField from 'xsenze-tools/components/xz/number-field';
import XzRow from 'xsenze-tools/components/xz/row';
import XzStatus from 'xsenze-tools/components/xz/status';
import XzSwitch from 'xsenze-tools/components/xz/switch';
import XzTextCell from 'xsenze-tools/components/xz/text-cell';
import {
  CUSTOM,
  choice,
  customKey,
  customOf,
  list,
  optionsOf,
  settle,
  switchOptionsOf,
  visible,
  type Question,
} from 'xsenze-tools/lib/ai-studio/story/project-types';
import type {
  Answer,
  Answers,
  ProjectType,
} from 'xsenze-tools/lib/ai-studio/story/types';

interface ChoiceView {
  items: string[];
  ids: string[];
  selected: number | undefined;
  note?: string;
  customNumber?: {
    title: string;
    value: number;
    min: number;
    max: number;
    unit: string;
  };
  customText?: { value: string; placeholder: string };
}

interface SwitchView {
  id: string;
  label: string;
  on: boolean;
  /** The last one on, when at least one must stay on. */
  locked: boolean;
}

interface Row {
  id: string;
  title: string;
  showsTitle: boolean;
  choice?: ChoiceView;
  switches?: SwitchView[];
  text?: { value: string; placeholder: string; note?: string };
}

export interface QuestionsSignature {
  Args: {
    type: ProjectType;
    questions: readonly Question[];
    answers: Answers;
    /** The group's heading: a question with the same title shows none. */
    heading?: string;
    onChange: (answers: Answers) => void;
  };
}

/** One group of New project questions as kit rows: dropdowns, switches, text. */
export default class Questions extends Component<QuestionsSignature> {
  get rows(): Row[] {
    const { type, answers: a, heading } = this.args;
    return this.args.questions
      .filter((q) => visible(q, a, type))
      .map((q): Row => {
        const base = {
          id: q.id,
          title: q.title,
          showsTitle: q.title !== heading,
        };
        if (q.kind === 'choice') {
          const options = optionsOf(q, a, type);
          const picked = choice(a, q.id);
          const index = options.findIndex((o) => o.id === picked);
          const view: ChoiceView = {
            items: options.map((o) => o.label),
            ids: options.map((o) => o.id),
            selected: index >= 0 ? index : undefined,
            note: options[index]?.note,
          };
          if (picked === CUSTOM && q.custom?.kind === 'number')
            view.customNumber = {
              title:
                q.custom.unit === 'min'
                  ? 'Minutes'
                  : q.custom.unit[0]!.toUpperCase() + q.custom.unit.slice(1),
              value: Number(customOf(a, q.id)) || q.custom.default,
              min: q.custom.min,
              max: q.custom.max,
              unit: q.custom.unit,
            };
          if (picked === CUSTOM && q.custom?.kind === 'text')
            view.customText = {
              value: String(customOf(a, q.id) ?? ''),
              placeholder: q.custom.placeholder,
            };
          return { ...base, choice: view };
        }
        if (q.kind === 'switches') {
          const on = list(a, q.id);
          const options = switchOptionsOf(q, a, type);
          const count = options.filter((o) => on.includes(o.id)).length;
          return {
            ...base,
            switches: options.map((o) => ({
              id: o.id,
              label: o.label,
              on: on.includes(o.id),
              locked: on.includes(o.id) && count <= (q.min ?? 0),
            })),
          };
        }
        return {
          ...base,
          text: {
            value: String(a[q.id] ?? ''),
            placeholder:
              typeof q.placeholder === 'function'
                ? q.placeholder(type)
                : q.placeholder,
            note: q.note,
          },
        };
      });
  }

  assign(id: string, value: Answer) {
    const { type, answers } = this.args;
    this.args.onChange(settle(type, { ...answers, [id]: value }, answers));
  }

  pick = (row: Row, index: number) => {
    const id = row.choice?.ids[index];
    if (id !== undefined) this.assign(row.id, id);
  };

  setCustom = (row: Row, value: Answer) =>
    this.assign(customKey(row.id), value);

  flip = (row: Row, option: string, on: boolean) => {
    const now = list(this.args.answers, row.id).filter((id) => id !== option);
    this.assign(row.id, on ? [...now, option] : now);
  };

  type = (row: Row, value: string) => this.assign(row.id, value);

  <template>
    {{#each this.rows key="id" as |row|}}
      {{#if row.choice}}
        <XzRow @title={{row.title}} @form="flush" as |titleId|>
          <XzMenuCell
            @items={{row.choice.items}}
            @selected={{row.choice.selected}}
            @labelledBy={{titleId}}
            @onChange={{fn this.pick row}}
          />
        </XzRow>
        {{#if row.choice.customNumber}}
          <XzRow
            class="ss-custom"
            @title={{row.choice.customNumber.title}}
            @form="flush"
            as |titleId|
          >
            <XzNumberField
              @value={{row.choice.customNumber.value}}
              @min={{row.choice.customNumber.min}}
              @max={{row.choice.customNumber.max}}
              @unit={{row.choice.customNumber.unit}}
              @labelledBy={{titleId}}
              @onChange={{fn this.setCustom row}}
            />
          </XzRow>
        {{/if}}
        {{#if row.choice.customText}}
          <XzRow class="ss-custom" @title="Custom" @form="flush" as |titleId|>
            <XzTextCell
              @value={{row.choice.customText.value}}
              @placeholder={{row.choice.customText.placeholder}}
              @onChange={{fn this.setCustom row}}
              aria-labelledby={{titleId}}
            />
          </XzRow>
        {{/if}}
        {{#if row.choice.note}}
          <XzStatus @text={{row.choice.note}} @tone="muted" @row={{true}} />
        {{/if}}
      {{else if row.switches}}
        {{#if row.showsTitle}}
          <XzHeading @text={{row.title}} />
        {{/if}}
        {{#each row.switches key="id" as |option|}}
          <XzRow @title={{option.label}} as |titleId|>
            <XzSwitch
              @on={{option.on}}
              @disabled={{option.locked}}
              @onChange={{fn this.flip row option.id}}
              aria-labelledby={{titleId}}
            />
          </XzRow>
        {{/each}}
      {{else if row.text}}
        <XzRow @title={{row.title}} @form="stacked" as |titleId|>
          <XzTextCell
            @value={{row.text.value}}
            @placeholder={{row.text.placeholder}}
            @onChange={{fn this.type row}}
            aria-labelledby={{titleId}}
          />
        </XzRow>
        {{#if row.text.note}}
          <XzStatus @text={{row.text.note}} @tone="muted" @row={{true}} />
        {{/if}}
      {{/if}}
    {{/each}}
  </template>
}
