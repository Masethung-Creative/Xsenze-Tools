import type { TOC } from '@ember/component/template-only';
import { htmlSafe } from '@ember/template';
import './bar.css';

export interface XzBarSignature {
  Args: {
    /** Filled share of the width, 0 to 1. */
    share: number;
    /** CSS colour of the fill; default the accent colour. */
    fill?: string;
    /** CSS colour of the track; default the muted surface. */
    track?: string;
  };
  Element: HTMLDivElement;
}

function style(share: number, fill?: string, track?: string) {
  const parts = [`--xz-bar-share: ${Math.min(Math.max(share, 0), 1)}`];
  if (fill) parts.push(`--xz-bar-fill: ${fill}`);
  if (track) parts.push(`--xz-bar-track: ${track}`);
  return htmlSafe(parts.join('; '));
}

/** A bar filled from the leading edge. */
const XzBar: TOC<XzBarSignature> = <template>
  <div class="xz-bar" style={{style @share @fill @track}} ...attributes><div
      class="xz-bar__fill"
    ></div></div>
</template>;

export default XzBar;
