import { modifier } from 'ember-modifier';
import type { TOC } from '@ember/component/template-only';
import { balanced, spans } from 'xsenze-tools/lib/xz/grid';
import './grid.css';

export interface XzGridSignature {
  Args: {
    /** Cells per row at most; default all in one row. */
    columns?: number;
    /** Draws the outer hairline; leave off inside XzRows or an XzRow. */
    boxed?: boolean;
  };
  Blocks: { default: [] };
  Element: HTMLDivElement;
}

// iOS: insets 24, symbol padding 6, slack 8
const titleRoom = 38;
let measure: CanvasRenderingContext2D | null | undefined;

/** A filling button marks itself `data-xz-fit` and names its label `.xz-btn__title`. */
const titleSelector = '.xz-btn__title, .xz-button__title, [data-xz-title]';

function titleFits(button: HTMLElement): boolean {
  const title = button.querySelector<HTMLElement>(titleSelector);
  measure ??= document.createElement('canvas').getContext('2d');
  if (!title || !measure) return true;
  measure.font = getComputedStyle(title).font;
  const iconWidth =
    parseFloat(getComputedStyle(button).getPropertyValue('--xz-icon-inline')) ||
    0;
  return (
    measure.measureText(title.textContent ?? '').width +
      iconWidth +
      titleRoom <=
    button.clientWidth
  );
}

const layout = modifier(
  (grid: HTMLElement, [columns]: [number | undefined]) => {
    const place = () => {
      // a popover or menu panel renders beside its trigger and is no cell
      const cells = [...grid.children].filter(
        (child) => !child.hasAttribute('popover'),
      ) as HTMLElement[];
      const perRow = spans(cells.length, columns ?? cells.length);
      const widest = balanced(cells.length, columns ?? cells.length)[0] ?? 1;
      grid.style.setProperty('--xz-cols', String(widest));
      cells.forEach((cell, i) => {
        const span = perRow[i] ?? 1;
        cell.style.gridColumn = span > 1 ? `span ${span}` : '';
      });
      fit();
    };
    // titles drop together
    const fit = () => {
      const tight = [...grid.children].some(
        (cell) =>
          cell instanceof HTMLElement &&
          cell.matches('[data-xz-fit]') &&
          !titleFits(cell),
      );
      grid.toggleAttribute('data-symbol-only', tight);
    };
    place();
    const children = new MutationObserver(place);
    children.observe(grid, { childList: true });
    const titles = new MutationObserver(fit);
    titles.observe(grid, { characterData: true, subtree: true });
    const size = new ResizeObserver(fit);
    size.observe(grid);
    void document.fonts?.ready.then(fit);
    return () => {
      children.disconnect();
      titles.disconnect();
      size.disconnect();
    };
  },
);

/**
 * Equal cells divided by hairlines (the kit's `xz-panel__cells`). Rows are
 * balanced, so four cells at three columns give two rows of two; the last
 * cell of a short row spans the rest. Filling buttons with a symbol all show
 * the symbol alone when any one title does not fit.
 */
const XzGrid: TOC<XzGridSignature> = <template>
  <div
    class="xz-panel__cells xz-panel__cells--keep xz-cellgrid
      {{if @boxed 'xz-cellgrid--boxed'}}"
    {{layout @columns}}
    ...attributes
  >{{yield}}</div>
</template>;

export default XzGrid;
