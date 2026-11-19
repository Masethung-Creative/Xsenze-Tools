import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import type Owner from '@ember/owner';
import XzCodeBlock from 'xsenze-tools/components/xz/code-block';
import XzEmptyRow from 'xsenze-tools/components/xz/empty-row';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzRow from 'xsenze-tools/components/xz/row';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSegmented from 'xsenze-tools/components/xz/segmented';
import XzSplit from 'xsenze-tools/components/xz/split';
import XzStatus from 'xsenze-tools/components/xz/status';
import XzTextCell from 'xsenze-tools/components/xz/text-cell';
import XzTiles, { type XzTile } from 'xsenze-tools/components/xz/tiles';
import TabBar from 'xsenze-tools/components/tools/story-studio/tab-bar';
import type { ProjectStore } from 'xsenze-tools/lib/story/project-store';
import {
  modelsOf,
  picturePrompts,
  shapesOf,
  type AssetPrompts,
} from 'xsenze-tools/lib/story/prompts';
import { imageModel } from 'xsenze-tools/lib/story/targets';
import type { Project } from 'xsenze-tools/lib/story/types';

const SHOW = ['Still to do', 'All'];

const join = (items: readonly string[]) => items.join(', ');

interface Card extends AssetPrompts {
  heading: string;
  done: boolean;
  filePlaceholder: string;
}

export interface AssetsTabSignature {
  Args: {
    project: Project;
    store: ProjectStore;
    tab: number;
    onTab: (index: number) => void;
  };
}

/** A prompt for every picture still to make, written for the chosen model and shape. */
export default class AssetsTab extends Component<AssetsTabSignature> {
  @tracked modelIndex = 0;
  @tracked shapeIndex = 0;
  @tracked showIndex = 0;
  /**
   * Cards already linked when Still to do was picked. Taken once, so a card
   * stays while its link is being typed.
   */
  @tracked hidden: string[] = [];

  show = SHOW;

  constructor(owner: Owner, args: AssetsTabSignature['Args']) {
    super(owner, args);
    this.hidden = this.linked();
  }

  linked(): string[] {
    return this.all.filter((c) => c.done).map((c) => c.id);
  }

  get models() {
    return modelsOf(this.args.project);
  }

  get modelNames(): string[] {
    return this.models.map((m) => imageModel(m)?.name ?? m);
  }

  get model() {
    return (
      this.models[Math.min(this.modelIndex, this.models.length - 1)] ?? 'gemini'
    );
  }

  get shapes() {
    return shapesOf(this.args.project);
  }

  get shapeNames(): string[] {
    return [...this.shapes];
  }

  get shape() {
    return (
      this.shapes[Math.min(this.shapeIndex, this.shapes.length - 1)] ?? '16:9'
    );
  }

  get manyShapes() {
    return this.shapes.length > 1;
  }

  get midjourney() {
    return this.model === 'midjourney';
  }

  get all(): Card[] {
    return picturePrompts(this.args.project, this.model, this.shape).map(
      (g) => ({
        ...g,
        heading:
          g.id === 'style'
            ? g.name
            : `${g.id} ${g.name || '(no name)'} · ${g.what}`,
        done: !!(g.ref.link.trim() || g.ref.file.trim()),
        filePlaceholder: g.prompts[0]?.saveAs ?? 'my-picture.png',
      }),
    );
  }

  get cards(): Card[] {
    return this.showIndex === 0
      ? this.all.filter((c) => !this.hidden.includes(c.id))
      : this.all;
  }

  get tiles(): XzTile[] {
    const all = this.all;
    return [
      {
        label: 'To make',
        value: String(all.filter((c) => !c.have && !c.done).length),
      },
      { label: 'You have', value: String(all.filter((c) => c.have).length) },
      { label: 'Linked', value: String(all.filter((c) => c.done).length) },
    ];
  }

  get noList() {
    return !this.args.project.assets.length;
  }

  get allDone() {
    return !this.cards.length && this.showIndex === 0;
  }

  pickModel = (index: number) => (this.modelIndex = index);
  pickShape = (index: number) => (this.shapeIndex = index);
  pickShow = (index: number) => {
    this.showIndex = index;
    if (index === 0) this.hidden = this.linked();
  };

  setRef = (id: string, field: 'link' | 'file', value: string) => {
    const { project, store } = this.args;
    if (id === 'style')
      store.put({ ...project, style: { ...project.style, [field]: value } });
    else
      store.put({
        ...project,
        assets: project.assets.map((a) =>
          a.id === id ? { ...a, [field]: value } : a,
        ),
      });
  };

  <template>
    <XzSplit class="story-studio">
      <:sidebar>
        <TabBar @selected={{@tab}} @onChange={{@onTab}} />
        <XzRows @framed={{true}}>
          <XzHeading @text="Picture prompts" />
          <XzRow @title="Image model" @form="stacked">
            <XzSegmented
              aria-label="Image model"
              @items={{this.modelNames}}
              @selected={{this.modelIndex}}
              @onChange={{this.pickModel}}
            />
          </XzRow>
          {{#if this.manyShapes}}
            <XzRow @title="Screen shape" @form="stacked">
              <XzSegmented
                aria-label="Screen shape"
                @items={{this.shapeNames}}
                @selected={{this.shapeIndex}}
                @onChange={{this.pickShape}}
              />
            </XzRow>
          {{/if}}
          <XzRow @title="Show" @form="stacked">
            <XzSegmented
              aria-label="Show"
              @items={{this.show}}
              @selected={{this.showIndex}}
              @onChange={{this.pickShow}}
            />
          </XzRow>
          <XzTiles @items={{this.tiles}} />
          <XzStatus
            @text="Make the style frame first, then the characters, background people, places and props. After each picture, add its web link (Midjourney) or file name (Gemini, GPT): later prompts use it to keep everything the same."
            @tone="muted"
            @row={{true}}
          />
          <XzStatus
            @text="Sheets are always 16:9 and props 1:1: they are references, not frames. Portraits, places and the style frame follow the screen shape."
            @tone="muted"
            @row={{true}}
          />
        </XzRows>
      </:sidebar>
      <:main>
        {{#if this.noList}}
          <XzRows @framed={{true}}>
            <XzHeading @text="Pictures" />
            <XzEmptyRow
              @text="Read the story on the Story tab first: the characters, places and props come from there."
            />
          </XzRows>
        {{/if}}
        {{#if this.allDone}}
          <XzRows @framed={{true}}>
            <XzHeading @text="Pictures" />
            <XzEmptyRow
              @text="Every picture has a link or file name. Pick All to see them."
            />
          </XzRows>
        {{/if}}
        {{#each this.cards key="id" as |card|}}
          <XzRows @framed={{true}}>
            <XzHeading @text={{card.heading}} />
            {{#if card.have}}
              <XzStatus
                @text="You have this picture. Add its link or file name, so later prompts can use it."
                @tone="muted"
                @row={{true}}
              />
            {{/if}}
            {{#each card.prompts key="key" as |p|}}
              <XzRow @title={{p.title}} @detail="Save as {{p.saveAs}}" />
              <XzCodeBlock class="ss-prompt" @code={{p.text}} />
              {{#if p.attach.length}}
                <XzStatus
                  @text="Attach: {{join p.attach}}"
                  @tone="muted"
                  @row={{true}}
                />
              {{/if}}
              {{#each p.notes as |note|}}
                <XzStatus @text={{note}} @tone="warn" @row={{true}} />
              {{/each}}
            {{/each}}
            <XzRow
              @title="Web link"
              @detail="For Midjourney --oref and --sref"
              @form="flush"
              as |titleId|
            >
              <XzTextCell
                @value={{card.ref.link}}
                @placeholder="https://…"
                @onChange={{fn this.setRef card.id "link"}}
                aria-labelledby={{titleId}}
              />
            </XzRow>
            <XzRow
              @title="File name"
              @detail="For Gemini and GPT attachments"
              @form="flush"
              as |titleId|
            >
              <XzTextCell
                @value={{card.ref.file}}
                @placeholder={{card.filePlaceholder}}
                @onChange={{fn this.setRef card.id "file"}}
                aria-labelledby={{titleId}}
              />
            </XzRow>
          </XzRows>
        {{/each}}
      </:main>
    </XzSplit>
  </template>
}
