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
import { LANGUAGES } from 'xsenze-tools/lib/transcribe';

export interface LanguagePickSignature {
  Args: {
    /** '' = auto-detect */
    value: string;
    disabled?: boolean;
    onChange: (code: string) => void;
  };
}

const AUTO = 'Auto-detect';
const COMMON_COUNT = 12;

const Globe = <template><IconSvg @name="globe" /></template>;

const flag = (code: string): ComponentLike => <template>
  <img
    class="as-flag"
    src="/flags/{{code}}.svg"
    width="16"
    height="16"
    alt=""
    loading="lazy"
  />
</template>;

const FLAGS = new Map(LANGUAGES.map(({ code }) => [code, flag(code)]));

const item = (
  id: string,
  code: string,
  name: string,
  group?: string,
): XzCommandItem => ({
  id,
  title: name,
  group,
  keywords: [code],
  icon: FLAGS.get(code),
  detail: group === 'All languages' ? code : undefined,
});

const autoItem: XzCommandItem = {
  id: 'auto',
  title: AUTO,
  keywords: ['auto', 'detect'],
  icon: Globe,
};
const COMMON = LANGUAGES.slice(0, COMMON_COUNT).map((l) =>
  item(`common-${l.code}`, l.code, l.name, 'Common'),
);
const ALL = [...LANGUAGES]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((l) => item(l.code, l.code, l.name, 'All languages'));

/** The web tool's language combobox as a kit row: the pick opens a searchable dialog. */
export default class LanguagePick extends Component<LanguagePickSignature> {
  @tracked open = false;
  @tracked query = '';

  get current() {
    return LANGUAGES.find((lang) => lang.code === this.args.value);
  }

  get text() {
    return this.current?.name ?? AUTO;
  }

  get icon() {
    const code = this.current?.code;
    return (code && FLAGS.get(code)) || Globe;
  }

  // a query lists each language once
  get items() {
    return this.query.trim()
      ? [autoItem, ...ALL]
      : [autoItem, ...COMMON, ...ALL];
  }

  show = () => (this.open = true);

  closed = () => {
    this.open = false;
    this.query = '';
  };

  search = (query: string) => (this.query = query);

  pick = (close: XzDialogClose, picked: XzCommandItem) => {
    this.args.onChange(
      picked.id === 'auto' ? '' : picked.id.replace(/^common-/, ''),
    );
    close();
  };

  <template>
    <XzRow class="as-language" @title="Language" @form="flush" as |titleId|>
      <XzButton
        class="as-language-pick"
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
      class="as-language-dialog"
      @open={{this.open}}
      @onClose={{this.closed}}
      aria-label="Language"
    >
      <:default as |close|>
        <XzCommand
          @items={{this.items}}
          @placeholder="Search languages…"
          @label="Language"
          @empty="No language found"
          @onSelect={{fn this.pick close}}
          @onQuery={{this.search}}
        />
      </:default>
    </XzDialog>
  </template>
}
