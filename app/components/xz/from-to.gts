import type { TOC } from '@ember/component/template-only';
import XzMenuCell from 'xsenze-tools/components/xz/menu-cell';
import { IconSvg } from 'xsenze-tools/components/icon';
import './from-to.css';

export interface XzFromToSignature {
  Args: {
    items: string[];
    from?: number;
    to?: number;
    /** Accessible names of the two menus; default From and To. */
    fromLabel?: string;
    toLabel?: string;
    disabled?: boolean;
    onFromChange?: (index: number) => void;
    onToChange?: (index: number) => void;
  };
  Element: HTMLDivElement;
}

/** Two menus of the same choices with an arrow between: a conversion from one to the other. */
const XzFromTo: TOC<XzFromToSignature> = <template>
  <div
    class="xz-panel__cells xz-panel__cells--keep xz-from-to"
    role="group"
    ...attributes
  >
    <div class="xz-panel__row">
      <XzMenuCell
        @items={{@items}}
        @selected={{@from}}
        @label={{if @fromLabel @fromLabel "From"}}
        @disabled={{@disabled}}
        @onChange={{@onFromChange}}
      />
    </div>
    <div class="xz-panel__row">
      <span class="xz-from-to__arrow" aria-hidden="true"><IconSvg
          @name="arrow-right"
        /></span>
      <XzMenuCell
        @items={{@items}}
        @selected={{@to}}
        @label={{if @toLabel @toLabel "To"}}
        @disabled={{@disabled}}
        @onChange={{@onToChange}}
      />
    </div>
  </div>
</template>;

export default XzFromTo;
