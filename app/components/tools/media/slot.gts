import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { modifier } from 'ember-modifier';
import CanonButton from 'delphicanon/components/canon-button';
import { IconSvg } from 'xsenze-tools/components/icon';
import { clipboardImages } from 'xsenze-tools/lib/clipboard-images';
import { matchesAccept } from 'xsenze-tools/modifiers/file-paste';
import './slot.css';

const Folder = <template><IconSvg @name="folder-open" /></template>;
const Upload = <template><IconSvg @name="upload" /></template>;
const Paste = <template><IconSvg @name="clipboard-paste" /></template>;

const IMAGE_EXTENSION = /^\.(png|jpe?g|gif|webp|avif|bmp|svg|ico|tiff?)$/i;

export interface SlotSignature {
  Args: {
    prompt: string;
    icon: string;
    /** As the file input's accept attribute. */
    accept?: string;
    /** The dashed image slot; `fills` covers the positioned parent. */
    dashed?: boolean;
    fills?: boolean;
    /** One row tall, icon beside the prompt and a Files cell: the Source row before a file. */
    row?: boolean;
    multiple?: boolean;
    /** A file is dragged over the tool. */
    over?: boolean;
    onFile?: (file: File) => void;
    /** Every picked file, in place of `onFile`. */
    onFiles?: (files: File[]) => void;
    /** Opens the tool's own file input instead of the slot's. */
    onChoose?: () => void;
  };
  Element: HTMLElement;
}

/**
 * The empty picture: a drop target with Upload and Paste. A click anywhere
 * opens the file picker. Paste reads clipboard images when `accept` takes
 * images; with `onChoose` and no file callback it fires a document paste,
 * which the tool's own paste handler loads.
 */
export default class Slot extends Component<SlotSignature> {
  #input?: HTMLInputElement;
  #root?: HTMLElement;

  keep = modifier((input: HTMLInputElement) => {
    this.#input = input;
  });

  root = modifier((element: HTMLElement) => {
    this.#root = element;
  });

  choose = () =>
    this.args.onChoose ? this.args.onChoose() : this.#input?.click();

  picked = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    // the same file twice fires change again
    input.value = '';
    if (!files.length) return;
    if (this.args.onFiles) this.args.onFiles(files);
    else this.args.onFile?.(files[0]!);
  };

  get ownInput() {
    return !this.args.onChoose && (this.args.onFile || this.args.onFiles);
  }

  /** The clipboard API reads images only. */
  get pastes() {
    const { accept } = this.args;
    return (
      !accept ||
      accept.split(',').some((part) => {
        const p = part.trim();
        return p.startsWith('image/') || IMAGE_EXTENSION.test(p);
      })
    );
  }

  paste = async () => {
    const { accept, onFile, onFiles } = this.args;
    const files = (await clipboardImages()).filter(
      (file) => !accept || matchesAccept(file, accept),
    );
    if (!files.length) return;
    if (onFiles) onFiles(files);
    else if (onFile) onFile(files[0]!);
    else this.#root?.dispatchEvent(pasteEvent(files));
  };

  <template>
    {{#if @row}}
      <div class="media-slot-bar" {{this.root}}>
        <button
          type="button"
          class="media-slot media-slot--row {{if @over 'media-slot--over'}}"
          tabindex="-1"
          {{on "click" this.choose}}
          ...attributes
        >
          <span class="media-slot-icon"><IconSvg @name={{@icon}} /></span>
          <span class="media-slot-prompt">{{@prompt}}</span>
        </button>
        <CanonButton
          class="media-slot-files"
          @kind="cell"
          @text="Files"
          @icon={{Folder}}
          @onClick={{this.choose}}
        />
        {{#if this.pastes}}
          <CanonButton
            class="media-slot-paste"
            @kind="cell"
            @text="Paste"
            @icon={{Paste}}
            @onClick={{this.paste}}
          />
        {{/if}}
      </div>
    {{else}}
      <div
        class="media-slot
          {{if @dashed 'media-slot--dashed'}}
          {{if @fills 'media-slot--fills'}}
          {{if @over 'media-slot--over'}}"
        {{this.root}}
        ...attributes
      >
        {{! the pointer's whole-slot target; Upload is the keyboard's }}
        <button
          type="button"
          class="media-slot-target"
          tabindex="-1"
          aria-hidden="true"
          {{on "click" this.choose}}
        ></button>
        <span class="media-slot-icon"><IconSvg @name={{@icon}} /></span>
        <span class="media-slot-prompt">{{@prompt}}</span>
        <span class="media-slot-actions">
          <CanonButton
            class="media-slot-upload"
            @kind="cell"
            @text="Upload"
            @icon={{Upload}}
            @onClick={{this.choose}}
          />
          {{#if this.pastes}}
            <CanonButton
              class="media-slot-paste"
              @kind="cell"
              @text="Paste"
              @icon={{Paste}}
              @onClick={{this.paste}}
            />
          {{/if}}
        </span>
      </div>
    {{/if}}
    {{#if this.ownInput}}
      {{! the slot is its label }}
      {{! template-lint-disable require-input-label }}
      <input
        type="file"
        accept={{@accept}}
        multiple={{@multiple}}
        hidden
        {{this.keep}}
        {{on "change" this.picked}}
      />
    {{/if}}
  </template>
}

function pasteEvent(files: File[]): ClipboardEvent {
  const data = new DataTransfer();
  for (const file of files) data.items.add(file);
  return new ClipboardEvent('paste', {
    clipboardData: data,
    bubbles: true,
    cancelable: true,
  });
}
