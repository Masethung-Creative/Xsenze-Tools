import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { isDestroying } from '@ember/destroyable';
import CanonButton from 'delphicanon/components/canon-button';
import { IconSvg } from 'xsenze-tools/components/icon';
import { JobProgress } from 'xsenze-tools/components/tools/media/job';
import { downloadBlob } from 'xsenze-tools/lib/download';
import { downloadIcon, passAlong } from 'xsenze-tools/lib/flow-hooks';
import { zipFiles, type NamedBlob } from 'xsenze-tools/lib/zip-files';
import './download-all.css';

const Save = <template><IconSvg @name={{(downloadIcon)}} /></template>;
const Archive = <template><IconSvg @name="archive" /></template>;

const isSet = (value: unknown) => value !== undefined;

// chrome drops some of a burst of anchor downloads
const GAP_MS = 150;

export interface DownloadAllSignature {
  Args: {
    /** The files, built when a button is pressed. */
    files: () => NamedBlob[] | Promise<NamedBlob[]>;
    /** The archive's file name, with `.zip`. */
    zipName: string;
    /** As CanonButton's kind for Download all; default primary. */
    kind?: 'primary' | 'secondary';
    disabled?: boolean;
    /** 0 to 1 while the caller builds the files; shows Job's busy rows below the buttons. */
    progress?: number;
    /** Shows Cancel while `progress` is set. */
    onCancel?: () => void;
  };
  Element: HTMLDivElement;
}

/** Download all, each file on its own, and a smaller Zip beside it. */
export default class DownloadAll extends Component<DownloadAllSignature> {
  @tracked busy = false;

  get off() {
    return this.args.disabled === true || this.busy;
  }

  all = () =>
    void this.#run(async (files) => {
      for (const [i, file] of files.entries()) {
        if (i) await new Promise((r) => setTimeout(r, GAP_MS));
        downloadBlob(file.blob, file.name);
      }
    });

  zip = () =>
    void this.#run(async (files) =>
      downloadBlob(await zipFiles(files), this.args.zipName),
    );

  async #run(save: (files: NamedBlob[]) => Promise<void>) {
    if (this.off) return;
    this.busy = true;
    try {
      const files = await this.args.files();
      if (files.length && !isDestroying(this)) await save(files);
    } finally {
      if (!isDestroying(this)) this.busy = false;
    }
  }

  <template>
    <div class="media-download-all" ...attributes>
      <CanonButton
        class="media-download-all-each"
        @kind={{if @kind @kind "primary"}}
        @text={{passAlong "Download all"}}
        @icon={{Save}}
        @disabled={{this.off}}
        @onClick={{this.all}}
      />
      <CanonButton
        class="media-download-all-zip"
        @kind="cell"
        @text="Zip"
        @icon={{Archive}}
        @disabled={{this.off}}
        @onClick={{this.zip}}
      />
    </div>
    {{#if (isSet @progress)}}
      <JobProgress @progress={{@progress}} @onCancel={{@onCancel}} />
    {{/if}}
  </template>
}
