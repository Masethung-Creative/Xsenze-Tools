import Component from '@glimmer/component';
import { guidFor } from '@ember/object/internals';
import type { ComponentLike } from '@glint/template';
import './row.css';

export type XzRowForm = 'plain' | 'flush' | 'stacked';

export interface XzRowSignature {
  Args: {
    title: string;
    detail?: string;
    /** Shown before the title in a plain row. */
    icon?: ComponentLike;
    /**
     * plain: the control keeps air around it. flush: the control meets the
     * row's top, bottom and trailing edge behind a hairline. stacked: the
     * control spans the row below the label.
     */
    form?: XzRowForm;
    /** Longest title among sibling rows, so a grid of rows stacks as one. */
    sizingTitle?: string;
  };
  /** The control; yields the title's id for aria-labelledby. */
  Blocks: { default: [titleId: string] };
  Element: HTMLDivElement;
}

/**
 * Label beside a control. A row too narrow for both puts the control below
 * the label.
 */
export default class XzRow extends Component<XzRowSignature> {
  titleId = `${guidFor(this)}-title`;

  get form(): XzRowForm {
    return this.args.form ?? 'plain';
  }

  get showsIcon() {
    return this.args.icon !== undefined && this.form === 'plain';
  }

  <template>
    <div class="xz-panel__row xz-prow xz-prow--{{this.form}}" ...attributes>
      <div class="xz-prow__label">
        {{#if this.showsIcon}}
          <span class="xz-prow__icon" aria-hidden="true">
            {{#let @icon as |Icon|}}{{#if Icon}}<Icon />{{/if}}{{/let}}
          </span>
        {{/if}}
        <div class="xz-prow__text">
          <span class="xz-panel__key" id={{this.titleId}}>{{@title}}</span>
          {{#if @detail}}
            <span class="xz-panel__hint">{{@detail}}</span>
          {{/if}}
          {{#if @sizingTitle}}
            <span
              class="xz-panel__key xz-prow__sizer"
              aria-hidden="true"
            >{{@sizingTitle}}</span>
          {{/if}}
        </div>
      </div>
      {{#if (has-block)}}
        <div class="xz-prow__control">{{yield this.titleId}}</div>
      {{/if}}
    </div>
  </template>
}
