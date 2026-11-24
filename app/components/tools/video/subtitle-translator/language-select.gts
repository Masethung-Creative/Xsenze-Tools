import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import type { ComponentLike } from '@glint/template';
import XzButton from 'xsenze-tools/components/xz/button';
import XzCommand, {
  type XzCommandItem,
} from 'xsenze-tools/components/xz/command';
import XzDialog, {
  type XzDialogClose,
} from 'xsenze-tools/components/xz/dialog';
import XzRow from 'xsenze-tools/components/xz/row';
import { IconSvg } from 'xsenze-tools/components/icon';
import {
  TRANSLATE_LANGUAGES,
  type Language,
} from 'xsenze-tools/lib/ai/translate';

export interface LanguageSelectSignature {
  Args: {
    /** The row's title and the dialog's name: From, To. */
    title: string;
    /** Codes picked; one unless `multiple`. */
    selected: string[];
    /** Tick several; the dialog stays open until Done. */
    multiple?: boolean;
    /** A code that cannot be picked here (the other side). */
    exclude?: string;
    disabled?: boolean;
    /** Offer Auto-detect as the first row; nothing selected means auto. */
    auto?: boolean;
    /** Codes listed but not pickable yet, marked Coming soon. */
    unavailable?: ReadonlySet<string>;
    onChange: (codes: string[]) => void;
  };
}

/** The first rows of the list: the languages most people here want. */
const COMMON_COUNT = 13;

const AUTO = 'Auto-detect';

const Globe = <template><IconSvg @name="globe" /></template>;
const Soon = <template><IconSvg @name="clock" /></template>;
const Tick = <template>
  <span class="st-tick"><IconSvg @name="check" /></span>
</template>;

const flag = (language: Language): ComponentLike => <template>
  <img
    class="st-flag"
    src="/flags/{{if language.flag language.flag language.code}}.svg"
    width="16"
    height="16"
    alt=""
    loading="lazy"
  />
</template>;

const FLAGS = new Map(TRANSLATE_LANGUAGES.map((l) => [l.code, flag(l)]));

export const flagOf = (code: string) => FLAGS.get(code) ?? Globe;

export const languageOf = (code: string) =>
  TRANSLATE_LANGUAGES.find((l) => l.code === code);

/**
 * A kit row that opens a searchable language list. One pick closes it; with
 * `multiple` each pick ticks or unticks a language and Done closes it.
 */
export default class LanguageSelect extends Component<LanguageSelectSignature> {
  @tracked open = false;
  @tracked query = '';

  get text() {
    const picked = this.args.selected;
    if (picked.length === 0) return this.args.auto ? AUTO : 'Choose…';
    if (picked.length === 1) return languageOf(picked[0]!)?.name ?? picked[0]!;
    return `${picked.length} languages`;
  }

  get icon() {
    const picked = this.args.selected;
    return picked.length === 1 ? flagOf(picked[0]!) : Globe;
  }

  get doneText() {
    const n = this.args.selected.length;
    return n ? `Done · ${n} picked` : 'Done';
  }

  #item(language: Language, group: string, prefix = ''): XzCommandItem {
    const ticked = this.args.selected.includes(language.code);
    if (this.args.unavailable?.has(language.code))
      return {
        id: prefix + language.code,
        title: language.name,
        group,
        keywords: [language.code],
        icon: Soon,
        detail: 'Coming soon',
      };
    return {
      id: prefix + language.code,
      title: language.name,
      group,
      keywords: [language.code],
      icon: this.args.multiple && ticked ? Tick : flagOf(language.code),
      detail: this.args.multiple && ticked ? 'Picked' : undefined,
    };
  }

  // a query lists each language once; picked ones lead in multiple mode
  get items(): XzCommandItem[] {
    const usable = TRANSLATE_LANGUAGES.filter(
      (l) => l.code !== this.args.exclude,
    );
    const all = [...usable]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((l) => this.#item(l, 'All languages'));
    if (this.query.trim()) return all;
    const picked =
      this.args.multiple && this.args.selected.length
        ? usable
            .filter((l) => this.args.selected.includes(l.code))
            .map((l) => this.#item(l, 'Picked', 'picked-'))
        : [];
    const common = usable
      .slice(0, COMMON_COUNT)
      .map((l) => this.#item(l, 'Common', 'common-'));
    const auto: XzCommandItem[] = this.args.auto
      ? [{ id: 'auto', title: AUTO, keywords: ['auto', 'detect'], icon: Globe }]
      : [];
    return [...auto, ...picked, ...common, ...all];
  }

  show = () => (this.open = true);

  closed = () => {
    this.open = false;
    this.query = '';
  };

  search = (query: string) => (this.query = query);

  pick = (close: XzDialogClose, item: XzCommandItem) => {
    const code = item.id.replace(/^(common|picked)-/, '');
    if (this.args.unavailable?.has(code)) return;
    if (code === 'auto') {
      this.args.onChange([]);
      close();
      return;
    }
    if (!this.args.multiple) {
      this.args.onChange([code]);
      close();
      return;
    }
    const picked = this.args.selected;
    this.args.onChange(
      picked.includes(code)
        ? picked.filter((c) => c !== code)
        : [...picked, code],
    );
  };

  <template>
    <XzRow class="st-language" @title={{@title}} @form="flush" as |titleId|>
      <XzButton
        class="st-language-pick"
        @kind="cell"
        @text={{this.text}}
        @icon={{this.icon}}
        @disabled={{@disabled}}
        aria-describedby={{titleId}}
        aria-haspopup="dialog"
        @onClick={{this.show}}
      />
    </XzRow>
    <XzDialog
      class="st-language-dialog"
      @open={{this.open}}
      @onClose={{this.closed}}
      aria-label={{@title}}
    >
      <:default as |close|>
        <XzCommand
          @items={{this.items}}
          @placeholder="Search languages…"
          @label={{@title}}
          @empty="No language found"
          @onSelect={{fn this.pick close}}
          @onQuery={{this.search}}
        />
        {{#if @multiple}}
          <XzButton
            class="st-language-done"
            @kind="primary"
            @text={{this.doneText}}
            @onClick={{close}}
          />
        {{/if}}
      </:default>
    </XzDialog>
  </template>
}
