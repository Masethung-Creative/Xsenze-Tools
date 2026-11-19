import type { TOC } from '@ember/component/template-only';
import XzTimecode from 'xsenze-tools/components/xz/timecode';

interface PictureSignature {
  Args: { a: string; b: string; subtracts: boolean; result: string };
}

const size = 30;
const halo = 'var(--xz-surface)';

/** The sum as it is written out: A, then the sign and B, a rule, and the result under it, all in the segment font. */
const Picture: TOC<PictureSignature> = <template>
  <div class="tcc-picture">
    <div class="tcc-sum">
      <XzTimecode
        class="tcc-line tcc-operand"
        @text={{@a}}
        @size={{size}}
        @halo={{halo}}
        @label="Timecode A"
      />
      <div class="tcc-row">
        <span class="tcc-sign">{{if @subtracts "−" "+"}}</span>
        <XzTimecode
          class="tcc-line tcc-operand"
          @text={{@b}}
          @size={{size}}
          @halo={{halo}}
          @label="Timecode B"
        />
      </div>
      <div class="tcc-rule"></div>
      <XzTimecode
        class="tcc-line"
        @text={{@result}}
        @size={{size}}
        @halo={{halo}}
        @label="Result"
      />
    </div>
  </div>
</template>;

export default Picture;
