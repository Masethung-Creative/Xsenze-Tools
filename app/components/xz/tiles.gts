import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { htmlSafe } from '@ember/template';
import { modifier } from 'ember-modifier';
import { balanced } from 'xsenze-tools/lib/xz/grid';
import './tiles.css';

export interface XzTile {
  label: string;
  value: string;
  /** Share of a level bar along the tile's bottom edge, 0 to 1; none draws no bar. */
  level?: number;
}

export interface XzTilesSignature {
  Args: { items: XzTile[] };
  Element: HTMLDivElement;
}

/** Least width of a tile; the grid never goes below two columns. */
export const tileWidth = 168;

function levelStyle(level: number | undefined) {
  return level === undefined
    ? ''
    : `--xz-level: ${Math.min(Math.max(level, 0), 1) * 100}%`;
}

/**
 * Read-only values as a hairline grid of tiles (the kit's xz-readings), label
 * over value. As many columns as fit; a short last row stretches its last tile.
 */
export default class XzTiles extends Component<XzTilesSignature> {
  @tracked columns = 2;

  measure = modifier((element: HTMLElement) => {
    let frame = 0;
    // a new column count changes the height; set it next frame, outside this observation
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      const columns = Math.max(2, Math.floor(width / tileWidth));
      cancelAnimationFrame(frame);
      if (columns !== this.columns)
        frame = requestAnimationFrame(() => (this.columns = columns));
    });
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });

  get widest() {
    const count = this.args.items.length;
    return balanced(count, this.columns)[0] ?? 1;
  }

  get style() {
    return htmlSafe(`--xz-cols: ${this.widest}`);
  }

  /** The last tile of a short row spans the rest of it. */
  spanOf = (index: number) => {
    const rows = balanced(this.args.items.length, this.columns);
    const widest = rows[0] ?? 1;
    let start = 0;
    for (const size of rows) {
      if (index < start + size) {
        return index === start + size - 1 && widest > size
          ? `grid-column: span ${widest - size + 1}`
          : '';
      }
      start += size;
    }
    return '';
  };

  tileStyle = (index: number, level: number | undefined) => {
    const parts = [this.spanOf(index), levelStyle(level)].filter(Boolean);
    return parts.length ? htmlSafe(parts.join('; ')) : undefined;
  };

  <template>
    <div class="xz-tilegroup" {{this.measure}} ...attributes>
      <dl class="xz-readings" style={{this.style}}>
        {{#each @items as |item index|}}
          <div
            class="xz-readings__item"
            style={{this.tileStyle index item.level}}
          >
            <dt>{{item.label}}</dt>
            <dd>{{item.value}}</dd>
          </div>
        {{/each}}
      </dl>
    </div>
  </template>
}
