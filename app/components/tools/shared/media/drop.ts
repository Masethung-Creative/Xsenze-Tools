import { tracked } from '@glimmer/tracking';
import { matchesAccept } from 'xsenze-tools/modifiers/file-paste';

/**
 * Drop anywhere in a tool: the first accepted file loads, `over` lights the slot.
 * `multiple` loads every accepted file and skips drops an inner target took.
 */
export default class Drop {
  @tracked over = false;

  #accept: string;
  #load: (files: File[]) => void;
  #multiple: boolean;

  constructor(accept: string, load: (file: File) => void);
  constructor(accept: string, load: (files: File[]) => void, multiple: true);
  constructor(
    accept: string,
    load: ((file: File) => void) | ((files: File[]) => void),
    multiple = false,
  ) {
    this.#accept = accept;
    this.#multiple = multiple;
    this.#load = multiple
      ? (load as (files: File[]) => void)
      : (files) => (load as (file: File) => void)(files[0]!);
  }

  enter = (event: DragEvent) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    this.over = true;
  };

  leave = (event: DragEvent) => {
    const root = event.currentTarget as Element;
    if (!root.contains(event.relatedTarget as Node | null)) this.over = false;
  };

  drop = (event: DragEvent) => {
    this.over = false;
    if (this.#multiple && event.defaultPrevented) return;
    const files = [...(event.dataTransfer?.files ?? [])].filter((f) =>
      matchesAccept(f, this.#accept),
    );
    if (!files.length) return;
    event.preventDefault();
    this.#load(files);
  };
}
