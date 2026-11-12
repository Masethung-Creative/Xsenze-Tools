import type { TOC } from '@ember/component/template-only';
import Icon from 'xsenze-tools/components/icon';
import type { IconName } from 'xsenze-tools/lib/icons';

// faint repeating icon wallpaper behind the home hero (decorative only)
const SET: IconName[] = [
  'audio-waveform',
  'mic',
  'headphones',
  'music',
  'scissors',
  'volume-2',
  'file-music',
  'disc-3',
  'radio',
  'sliders-horizontal',
  'audio-lines',
  'speaker',
  'gauge',
  'repeat',
];
const ICONS: IconName[] = Array.from(
  { length: 84 },
  (_, i) => SET[(i * 5) % SET.length] ?? 'music',
);

const IconBackdrop: TOC<{ Element: HTMLDivElement }> = <template>
  <div class="icon-backdrop" aria-hidden="true" ...attributes>
    {{#each ICONS as |name|}}
      <Icon @name={{name}} />
    {{/each}}
  </div>
</template>;

export default IconBackdrop;
