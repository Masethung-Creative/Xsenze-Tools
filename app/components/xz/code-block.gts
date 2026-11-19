import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import Icon from 'xsenze-tools/components/icon';
import type XzToastService from 'xsenze-tools/services/xz-toast';
import './code-block.css';

export interface XzCodeBlockSignature {
  Args: {
    code: string;
    /** Shown in a heading bar above the code; without it the copy button sits below. */
    language?: string;
    /** Taller code scrolls inside the block. */
    maxHeight?: number;
  };
  Element: HTMLElement;
}

const flashSeconds = 1.5;

/** Monospaced, selectable code with a copy button. Lines do not wrap; the block scrolls sideways. */
export default class XzCodeBlock extends Component<XzCodeBlockSignature> {
  @service('xz-toast') declare toast: XzToastService;
  @tracked copied = false;
  #timer?: number;

  get style() {
    const { maxHeight } = this.args;
    return maxHeight === undefined
      ? undefined
      : htmlSafe(`max-block-size: ${maxHeight}px`);
  }

  copy = async () => {
    try {
      await this.toast.write(this.args.code);
    } catch {
      return;
    }
    if (this.isDestroying) return;
    this.copied = true;
    window.clearTimeout(this.#timer);
    this.#timer = window.setTimeout(() => {
      this.copied = false;
    }, flashSeconds * 1000);
  };

  willDestroy() {
    super.willDestroy();
    window.clearTimeout(this.#timer);
  }

  <template>
    <figure
      class="xz-codeblock {{unless @language 'xz-codeblock--bare'}}"
      ...attributes
    >
      <figcaption class="xz-codeblock__bar">
        {{#if @language}}
          <span class="xz-codeblock__lang">{{@language}}</span>
        {{/if}}
        <button
          type="button"
          class="xz-btn xz-btn--ghost xz-btn--sm xz-codeblock__copy"
          aria-label="Copy code"
          {{on "click" this.copy}}
        >
          {{#if this.copied}}
            <Icon @name="check" />Copied
          {{else}}
            <Icon @name="copy" />Copy
          {{/if}}
        </button>
      </figcaption>
      <pre class="xz-codeblock__pre" tabindex="0" style={{this.style}}><code
        >{{@code}}</code></pre>
    </figure>
  </template>
}
