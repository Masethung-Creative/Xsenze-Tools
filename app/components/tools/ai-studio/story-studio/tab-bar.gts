import type { TOC } from '@ember/component/template-only';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSegmented from 'xsenze-tools/components/xz/segmented';

/** Shots holds each shot's frame and video prompts. */
export const TABS = ['Plan', 'Story', 'Bible', 'Assets', 'Shots', 'Export'];
export const TAB = {
  plan: 0,
  story: 1,
  bible: 2,
  assets: 3,
  shots: 4,
  export: 5,
};
/** Tabs a later phase fills in. */
const LATER = [TAB.shots];

/** The project's steps, at the top of every tab's sidebar. */
const TabBar: TOC<{
  Args: { selected: number; onChange: (index: number) => void };
}> = <template>
  <XzRows @framed={{true}}>
    <XzSegmented
      class="ss-tabs"
      aria-label="Steps"
      @items={{TABS}}
      @selected={{@selected}}
      @columns={{3}}
      @disabledIndices={{LATER}}
      @onChange={{@onChange}}
    />
  </XzRows>
</template>;

export default TabBar;
