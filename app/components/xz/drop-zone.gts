import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { guidFor } from '@ember/object/internals';
import type { ComponentLike } from '@glint/template';
import { modifier } from 'ember-modifier';
import Icon from 'xsenze-tools/components/icon';
import { accepts, stem } from 'xsenze-tools/lib/xz/files';
import './drop-zone.css';

export interface XzDropZoneSignature {
  Args: {
    /** Shown in the drop target under the icon. */
    prompt: string;
    /** Default a picture. */
    icon?: ComponentLike;
    /** As the file input's accept attribute; default image/*. Empty takes any file. */
    accept?: string;
    multiple?: boolean;
    /** Shows Paste, which reads images from the clipboard; default true. */
    paste?: boolean;
    /** Decoded images, EXIF orientation applied, with their file names less the extension; no names after a paste. */
    onImages?: (images: ImageBitmap[], names: string[]) => void;
    /** The files themselves, when `onImages` is not set. */
    onFiles?: (files: File[]) => void;
  };
  Element: HTMLDivElement;
}

/**
 * Import area: a drop target over a flush bar of sources. Pasting while
 * focus is inside it imports too.
 */
export default class XzDropZone extends Component<XzDropZoneSignature> {
  @tracked over = false;
  #depth = 0;
  input?: HTMLInputElement;
  id = guidFor(this);

  get accept() {
    return this.args.accept ?? 'image/*';
  }

  get showsPaste() {
    return this.args.paste !== false;
  }

  keep = modifier((input: HTMLInputElement) => {
    this.input = input;
  });

  chooseFiles = () => this.input?.click();

  picked = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';
    void this.deliver(files, false);
  };

  pasteImages = async () => {
    const blobs: File[] = [];
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type)
          blobs.push(new File([await item.getType(type)], 'pasted', { type }));
      }
    } catch {
      return;
    }
    await this.deliver(blobs, true);
  };

  pasted = (event: ClipboardEvent) => {
    const files = [...(event.clipboardData?.files ?? [])];
    if (files.length === 0) return;
    event.preventDefault();
    void this.deliver(files, true);
  };

  enter = (event: DragEvent) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    this.#depth += 1;
    this.over = true;
  };

  hover = (event: DragEvent) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  leave = () => {
    this.#depth = Math.max(0, this.#depth - 1);
    if (this.#depth === 0) this.over = false;
  };

  drop = (event: DragEvent) => {
    event.preventDefault();
    this.#depth = 0;
    this.over = false;
    void this.deliver([...(event.dataTransfer?.files ?? [])], false);
  };

  async deliver(all: File[], pasted: boolean) {
    const matching = all.filter((file) => accepts(file, this.accept));
    const files = this.args.multiple ? matching : matching.slice(0, 1);
    if (files.length === 0) return;
    const { onImages } = this.args;
    if (!onImages) {
      this.args.onFiles?.(files);
      return;
    }
    const decoded = await Promise.all(
      files.map((file) =>
        createImageBitmap(file, {
          imageOrientation: 'from-image',
        }).then(
          (image) => ({ image, name: stem(file.name) }),
          () => undefined,
        ),
      ),
    );
    const images = decoded.filter((d) => d !== undefined);
    if (images.length === 0) return;
    onImages(
      images.map((d) => d.image),
      pasted ? [] : images.map((d) => d.name),
    );
  }

  <template>
    <div
      class="xz-dropzone xz-drop {{if this.over 'is-dragover'}}"
      ...attributes
      {{on "paste" this.pasted}}
    >
      {{! template-lint-disable require-input-label }}
      <input
        class="xz-sr-only"
        id="{{this.id}}-file"
        type="file"
        accept={{this.accept}}
        multiple={{@multiple}}
        tabindex="-1"
        {{this.keep}}
        {{on "change" this.picked}}
      />
      {{! a click on the area opens the picker; the Files button below is the keyboard route }}
      {{! template-lint-disable no-invalid-interactive }}
      <div
        class="xz-dropzone__area"
        role="presentation"
        {{on "click" this.chooseFiles}}
        {{on "dragenter" this.enter}}
        {{on "dragover" this.hover}}
        {{on "dragleave" this.leave}}
        {{on "drop" this.drop}}
      >
        <span class="xz-drop__icon" aria-hidden="true">
          {{#if @icon}}
            {{#let @icon as |CustomIcon|}}<CustomIcon />{{/let}}
          {{else}}
            <Icon @name="image" />
          {{/if}}
        </span>
        <span class="xz-dropzone__title">{{@prompt}}</span>
      </div>
      <div class="xz-drop__bar">
        <button
          type="button"
          class="xz-btn xz-drop__source"
          {{on "click" this.chooseFiles}}
        >
          <Icon @name="folder" />Files
        </button>
        {{#if this.showsPaste}}
          <button
            type="button"
            class="xz-btn xz-drop__source"
            {{on "click" this.pasteImages}}
          >
            <Icon @name="clipboard" />Paste
          </button>
        {{/if}}
      </div>
    </div>
  </template>
}
