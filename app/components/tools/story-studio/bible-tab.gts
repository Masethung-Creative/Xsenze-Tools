import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import CanonButton from 'delphicanon/components/canon-button';
import CanonEmptyRow from 'delphicanon/components/canon-empty-row';
import CanonGrid from 'delphicanon/components/canon-grid';
import CanonHeading from 'delphicanon/components/canon-heading';
import CanonMenuCell from 'delphicanon/components/canon-menu-cell';
import CanonRow from 'delphicanon/components/canon-row';
import CanonRows from 'delphicanon/components/canon-rows';
import CanonSplit from 'delphicanon/components/canon-split';
import CanonStatus from 'delphicanon/components/canon-status';
import CanonSwitch from 'delphicanon/components/canon-switch';
import CanonTextArea from 'delphicanon/components/canon-text-area';
import CanonTextCell from 'delphicanon/components/canon-text-cell';
import CanonTiles, { type CanonTile } from 'delphicanon/components/canon-tiles';
import TabBar from 'xsenze-tools/components/tools/story-studio/tab-bar';
import { nextId, usesTools } from 'xsenze-tools/lib/story/analysis';
import type { ProjectStore } from 'xsenze-tools/lib/story/project-store';
import { list } from 'xsenze-tools/lib/story/project-types';
import {
  ID_LETTER,
  type AiTool,
  type Asset,
  type AssetKind,
  type Project,
} from 'xsenze-tools/lib/story/types';

type AssetText = 'name' | 'role' | 'look';
type ToolText = 'name' | 'does' | 'use' | 'age' | 'safety';

interface Group {
  kind: AssetKind;
  heading: string;
  one: string;
  items: Asset[];
}

const GROUPS: readonly { kind: AssetKind; heading: string; one: string }[] = [
  { kind: 'character', heading: 'Characters', one: 'character' },
  { kind: 'background', heading: 'Background people', one: 'background group' },
  { kind: 'place', heading: 'Places', one: 'place' },
  { kind: 'prop', heading: 'Props', one: 'prop' },
];

const HAVE_SWITCH: Record<AssetKind, string> = {
  character: 'characters',
  background: 'background',
  place: 'places',
  prop: 'props',
};

export interface BibleTabSignature {
  Args: {
    project: Project;
    store: ProjectStore;
    tab: number;
    onTab: (index: number) => void;
  };
}

/**
 * The story's bible: everything that must look the same in every picture,
 * and a course's free AI tools. Every field is editable; the look is what
 * each prompt repeats word for word.
 */
export default class BibleTab extends Component<BibleTabSignature> {
  /** An id whose Delete was tapped once and waits for a second tap. */
  @tracked deleting: string | undefined;

  get groups(): Group[] {
    return GROUPS.map((g) => ({
      ...g,
      items: this.args.project.assets.filter((a) => a.kind === g.kind),
    }));
  }

  get showsTools() {
    return usesTools(this.args.project) || this.args.project.tools.length > 0;
  }

  get characters() {
    return this.args.project.assets.filter((a) => a.kind === 'character');
  }

  get byItems(): string[] {
    return ['Nobody yet', ...this.characters.map((c) => `${c.id} ${c.name}`)];
  }

  byIndex = (tool: AiTool) =>
    Math.max(0, this.characters.findIndex((c) => c.id === tool.by) + 1);

  get movie() {
    return this.args.project.type === 'movie';
  }

  get tiles(): CanonTile[] {
    const tiles = this.groups.map((g) => ({
      label: g.heading,
      value: String(g.items.length),
    }));
    if (this.showsTools)
      tiles.push({
        label: 'AI tools',
        value: String(this.args.project.tools.length),
      });
    return tiles;
  }

  get empty() {
    return !this.args.project.assets.length && !this.args.project.tools.length;
  }

  put(change: Partial<Project>) {
    this.args.store.put({ ...this.args.project, ...change });
  }

  setSynopsis = (synopsis: string) => this.put({ synopsis });
  setLogline = (logline: string) => this.put({ logline });

  setAsset = (id: string, field: AssetText, value: string) =>
    this.put({
      assets: this.args.project.assets.map((a) =>
        a.id === id ? { ...a, [field]: value } : a,
      ),
    });

  setHave = (id: string, have: boolean) =>
    this.put({
      assets: this.args.project.assets.map((a) =>
        a.id === id ? { ...a, have } : a,
      ),
    });

  add = (kind: AssetKind) => {
    const { project } = this.args;
    const id = nextId(
      ID_LETTER[kind],
      project.assets.map((a) => a.id),
    );
    this.put({
      assets: [
        ...project.assets,
        {
          id,
          kind,
          name: '',
          role: '',
          look: '',
          have: list(project.answers, 'have').includes(HAVE_SWITCH[kind]),
          link: '',
          file: '',
        },
      ],
    });
  };

  /** The first tap arms Delete; the second removes it and its mentions. */
  remove = (id: string) => {
    if (this.deleting !== id) {
      this.deleting = id;
      return;
    }
    this.deleting = undefined;
    const { project } = this.args;
    this.put({
      assets: project.assets.filter((a) => a.id !== id),
      tools: project.tools
        .filter((t) => t.id !== id)
        .map((t) => (t.by === id ? { ...t, by: '' } : t)),
      parts: project.parts.map((p) => ({
        ...p,
        cast: p.cast.filter((x) => x !== id),
        tool: p.tool === id ? '' : p.tool,
      })),
    });
  };

  deleteText = (id: string) =>
    this.deleting === id ? `Tap again to delete ${id}` : `Delete ${id}`;

  setTool = (id: string, field: ToolText, value: string) =>
    this.put({
      tools: this.args.project.tools.map((t) =>
        t.id === id ? { ...t, [field]: value } : t,
      ),
    });

  pickBy = (id: string, index: number) =>
    this.put({
      tools: this.args.project.tools.map((t) =>
        t.id === id ? { ...t, by: this.characters[index - 1]?.id ?? '' } : t,
      ),
    });

  addTool = () => {
    const { project } = this.args;
    const id = nextId(
      'T',
      project.tools.map((t) => t.id),
    );
    this.put({
      tools: [
        ...project.tools,
        { id, name: '', does: '', use: '', age: '', safety: '', by: '' },
      ],
    });
  };

  <template>
    <CanonSplit class="story-studio">
      <:sidebar>
        <TabBar @selected={{@tab}} @onChange={{@onTab}} />
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Story summary" />
          {{#if this.movie}}
            <CanonRow @title="Logline" @form="stacked" as |titleId|>
              <CanonTextCell
                @value={{@project.logline}}
                @placeholder="The film in one sentence"
                @onChange={{this.setLogline}}
                aria-labelledby={{titleId}}
              />
            </CanonRow>
          {{/if}}
          <CanonTextArea
            @value={{@project.synopsis}}
            @placeholder="The story in a few sentences"
            @height={{140}}
            @onChange={{this.setSynopsis}}
            aria-label="Story summary"
          />
          <CanonTiles @items={{this.tiles}} />
        </CanonRows>
        <CanonRows @framed={{true}}>
          <CanonHeading @text="Add" />
          <CanonStatus
            @text="The look is repeated word for word in every prompt, so keep it short and visual. Switch on I have a picture for anything you already have."
            @tone="muted"
            @row={{true}}
          />
          <CanonGrid @columns={{2}}>
            {{#each this.groups as |g|}}
              <CanonButton
                @text="+ {{g.one}}"
                @onClick={{fn this.add g.kind}}
              />
            {{/each}}
            {{#if this.showsTools}}
              <CanonButton @text="+ AI tool" @onClick={{this.addTool}} />
            {{/if}}
          </CanonGrid>
        </CanonRows>
      </:sidebar>
      <:main>
        {{#if this.empty}}
          <CanonRows @framed={{true}}>
            <CanonHeading @text="The list" />
            <CanonEmptyRow
              @text="Nothing yet. Read the story with a chatbot on the Story tab, or add items on the left."
            />
          </CanonRows>
        {{/if}}
        {{#each this.groups as |g|}}
          {{#if g.items.length}}
            <CanonRows @framed={{true}}>
              <CanonHeading @text={{g.heading}} />
              {{#each g.items key="id" as |item|}}
                <div class="ss-card">
                  <CanonRow @title={{item.id}} @form="flush" as |titleId|>
                    <CanonTextCell
                      @value={{item.name}}
                      @placeholder="Name"
                      @onChange={{fn this.setAsset item.id "name"}}
                      aria-labelledby={{titleId}}
                    />
                  </CanonRow>
                  <CanonRow @title="Role" @form="flush" as |titleId|>
                    <CanonTextCell
                      @value={{item.role}}
                      @placeholder="Who or what it is in the story"
                      @onChange={{fn this.setAsset item.id "role"}}
                      aria-labelledby={{titleId}}
                    />
                  </CanonRow>
                  <CanonRow @title="Look" @form="stacked">
                    <CanonTextArea
                      @value={{item.look}}
                      @placeholder="25 to 45 words a picture model can draw"
                      @height={{84}}
                      @onChange={{fn this.setAsset item.id "look"}}
                      aria-label="Look of {{item.id}}"
                    />
                  </CanonRow>
                  <CanonRow @title="I have a picture" as |titleId|>
                    <CanonSwitch
                      @on={{item.have}}
                      @onChange={{fn this.setHave item.id}}
                      aria-labelledby={{titleId}}
                    />
                  </CanonRow>
                  <CanonButton
                    @text={{this.deleteText item.id}}
                    @onClick={{fn this.remove item.id}}
                  />
                </div>
              {{/each}}
            </CanonRows>
          {{/if}}
        {{/each}}
        {{#if this.showsTools}}
          {{#if @project.tools.length}}
            <CanonRows @framed={{true}}>
              <CanonHeading @text="Free AI tools" />
              {{#each @project.tools key="id" as |tool|}}
                <div class="ss-card">
                  <CanonRow @title={{tool.id}} @form="flush" as |titleId|>
                    <CanonTextCell
                      @value={{tool.name}}
                      @placeholder="Name"
                      @onChange={{fn this.setTool tool.id "name"}}
                      aria-labelledby={{titleId}}
                    />
                  </CanonRow>
                  <CanonRow @title="What it does" @form="stacked" as |titleId|>
                    <CanonTextCell
                      @value={{tool.does}}
                      @onChange={{fn this.setTool tool.id "does"}}
                      aria-labelledby={{titleId}}
                    />
                  </CanonRow>
                  <CanonRow
                    @title="How a kid uses it"
                    @form="stacked"
                    as |titleId|
                  >
                    <CanonTextCell
                      @value={{tool.use}}
                      @onChange={{fn this.setTool tool.id "use"}}
                      aria-labelledby={{titleId}}
                    />
                  </CanonRow>
                  <CanonRow @title="Age limit" @form="flush" as |titleId|>
                    <CanonTextCell
                      @value={{tool.age}}
                      @placeholder="From the tool’s own terms"
                      @onChange={{fn this.setTool tool.id "age"}}
                      aria-labelledby={{titleId}}
                    />
                  </CanonRow>
                  <CanonRow @title="Safety tip" @form="stacked" as |titleId|>
                    <CanonTextCell
                      @value={{tool.safety}}
                      @placeholder="For parents and teachers"
                      @onChange={{fn this.setTool tool.id "safety"}}
                      aria-labelledby={{titleId}}
                    />
                  </CanonRow>
                  <CanonRow @title="Shown by" @form="flush" as |titleId|>
                    <CanonMenuCell
                      @items={{this.byItems}}
                      @selected={{this.byIndex tool}}
                      @labelledBy={{titleId}}
                      @onChange={{fn this.pickBy tool.id}}
                    />
                  </CanonRow>
                  <CanonButton
                    @text={{this.deleteText tool.id}}
                    @onClick={{fn this.remove tool.id}}
                  />
                </div>
              {{/each}}
            </CanonRows>
          {{/if}}
        {{/if}}
      </:main>
    </CanonSplit>
  </template>
}
