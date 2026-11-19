import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';
import { modifier } from 'ember-modifier';
import './split.css';

export interface XzSplitSignature {
  Args: {
    /** Never splits: the sections stack at every width, sidebar first. */
    oneColumn?: boolean;
    /** Sidebar width in px beside the main pane, at most 40 % of the split. Default 340. */
    sidebarWidth?: number;
    /** In one column the banner stays at the top and the page scrolls under it. */
    bannerSticks?: boolean;
    /** In one column the main sections come before the sidebar's. */
    mainLeadsStacked?: boolean;
    /** Side by side the panes are equal; a sidebar of one canvas fills its pane. */
    halves?: boolean;
    /** In one column the picture shrinks as the page scrolls, down to this band height in px. */
    collapsesTo?: number;
    /** Beside or above a crease, a halves picture runs into the crease band up to the rule. */
    pictureMeetsCrease?: boolean;
    footerHidden?: boolean;
  };
  Blocks: {
    sidebar: [];
    main: [];
    /** An XzCanvas across every column, above the panes. */
    banner: [];
    /** A framed strip floating over the bottom of the main pane. */
    footer: [];
    /** Follows the main sections: after them in the main pane, last in one column. Collapses when empty. */
    end: [];
  };
  Element: HTMLDivElement;
}

/** Share of the height a collapsing picture takes before it shrinks. */
export const collapseLimit = 0.6;

function naturalHeight(canvas: HTMLElement, width: number): number {
  const fixed = Number(canvas.dataset['xzHeight']);
  if (fixed) return fixed;
  const aspect = Number(canvas.dataset['xzAspect']) || 1;
  const frame = parseFloat(
    getComputedStyle(canvas).getPropertyValue('--xz-canvas-frame'),
  );
  return width / aspect + (frame || 0) * 2;
}

const collapse = modifier(
  (split: HTMLElement, [collapsesTo]: [number | undefined]) => {
    if (collapsesTo === undefined) return;
    const body = split.querySelector<HTMLElement>(
      ':scope > .xz-tool-split__body',
    );
    if (!body) return;
    const update = () => {
      const stacked =
        getComputedStyle(body).getPropertyValue('--xz-split-layout').trim() !==
        'wide';
      const picture = split.querySelector<HTMLElement>(
        ':scope > .xz-tool-split__body > .xz-tool-split__banner .xz-canvas, .xz-tool-split--halves > .xz-tool-split__body > .xz-tool-split__sidebar > .xz-canvas:only-child',
      );
      split.toggleAttribute('data-collapsing', stacked && !!picture);
      if (!stacked || !picture) return;
      const full = Math.min(
        naturalHeight(picture, split.clientWidth),
        split.clientHeight * collapseLimit,
      );
      // stretches when pulled down
      const band = Math.max(Math.min(collapsesTo, full), full - body.scrollTop);
      split.style.setProperty('--xz-split-full', `${full}px`);
      split.style.setProperty('--xz-split-band', `${band}px`);
    };
    update();
    body.addEventListener('scroll', update, { passive: true });
    const size = new ResizeObserver(update);
    size.observe(split);
    const shape = new MutationObserver(update);
    shape.observe(body, {
      subtree: true,
      attributeFilter: ['data-xz-aspect', 'data-xz-height'],
    });
    return () => {
      body.removeEventListener('scroll', update);
      size.disconnect();
      shape.disconnect();
    };
  },
);

/**
 * Sidebar beside a main pane. Wide: a fixed sidebar on the leading side.
 * Narrower than 640 px or portrait: one column, sidebar first. On a
 * dual-screen device the panes meet at the crease. Sections that are an
 * XzCanvas span their column; the rest keep the panel padding. The split
 * fills its parent's height.
 */
export default class XzSplit extends Component<XzSplitSignature> {
  get style() {
    const width = this.args.sidebarWidth;
    return width === undefined
      ? undefined
      : htmlSafe(`--xz-split-sidebar: ${width}px`);
  }

  <template>
    <div
      class="xz-tool-split
        {{if @halves 'xz-tool-split--halves'}}
        {{if @bannerSticks 'xz-tool-split--sticks'}}
        {{if @mainLeadsStacked 'xz-tool-split--main-leads'}}
        {{if @pictureMeetsCrease 'xz-tool-split--meets-crease'}}
        {{if @oneColumn 'xz-tool-split--one-column'}}"
      style={{this.style}}
      {{collapse @collapsesTo}}
      ...attributes
    >
      <div class="xz-tool-split__body">
        {{#if (has-block "banner")}}
          <div class="xz-tool-split__banner">{{yield to="banner"}}</div>
        {{/if}}
        {{#if (has-block "sidebar")}}
          <div class="xz-tool-split__pane xz-tool-split__sidebar xz-tool-page">
            {{yield to="sidebar"}}
          </div>
        {{/if}}
        <div class="xz-tool-split__rule"></div>
        <div class="xz-tool-split__pane xz-tool-split__main xz-tool-page">
          {{yield to="main"}}
          <div class="xz-tool-split__end">{{yield to="end"}}</div>
          {{#if (has-block "footer")}}
            {{#unless @footerHidden}}
              <div class="xz-tool-split__footer">{{yield to="footer"}}</div>
            {{/unless}}
          {{/if}}
        </div>
      </div>
    </div>
  </template>
}
