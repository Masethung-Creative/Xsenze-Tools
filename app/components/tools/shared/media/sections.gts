import type { TOC } from '@ember/component/template-only';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzTiles from 'xsenze-tools/components/xz/tiles';
import type { Section } from 'xsenze-tools/lib/video/mediainfo';

/** MediaInfo's report as headed tiles, one block per track. */
const Sections: TOC<{
  Args: { sections: Section[] };
  Element: HTMLDivElement;
}> = <template>
  {{#if @sections.length}}
    <XzRows class="media-sections" @framed={{true}} ...attributes>
      {{#each @sections as |section|}}
        <XzHeading @text={{section.title}} />
        <XzTiles @items={{section.rows}} />
      {{/each}}
    </XzRows>
  {{/if}}
</template>;

export default Sections;
