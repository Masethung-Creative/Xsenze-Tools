import type { TOC } from '@ember/component/template-only';
import './status.css';

export type XzStatusTone = 'ok' | 'warn' | 'muted';

export interface XzStatusSignature {
  Args: {
    text: string;
    tone: XzStatusTone;
    /** A padded row of its own for an XzRows. */
    row?: boolean;
  };
  Element: HTMLDivElement;
}

const toneClass: Record<XzStatusTone, string> = {
  ok: 'xz-status--success',
  warn: 'xz-status--danger',
  muted: '',
};

function tone(value: XzStatusTone) {
  return toneClass[value];
}

/** A short state word with a dot in the colour of its tone: ok, warn or muted. */
const XzStatus: TOC<XzStatusSignature> = <template>
  <div
    class="xz-status {{tone @tone}} {{if @row 'xz-status--row'}}"
    role="status"
    ...attributes
  >{{@text}}</div>
</template>;

export default XzStatus;
