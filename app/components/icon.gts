import type { TOC } from '@ember/component/template-only';
import { htmlSafe } from '@ember/template';
import { icons } from 'xsenze-tools/lib/icons';

// icon strings are static lucide svgs bundled with the app, never user input
const markup = (name: string) => htmlSafe(icons[name] ?? '');

const Icon: TOC<{ Args: { name: string }; Element: HTMLSpanElement }> =
  <template>
    <span class="icon" aria-hidden="true" ...attributes>{{markup @name}}</span>
  </template>;

/** Bare svg, for UI kit icon slots that size it themselves. */
export const IconSvg: TOC<{ Args: { name: string } }> = <template>
  {{markup @name}}
</template>;

export default Icon;
