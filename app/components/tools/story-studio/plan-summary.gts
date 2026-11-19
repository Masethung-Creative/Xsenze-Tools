import Component from '@glimmer/component';
import XzRow from 'xsenze-tools/components/xz/row';
import XzStatus from 'xsenze-tools/components/xz/status';
import XzTiles, { type XzTile } from 'xsenze-tools/components/xz/tiles';
import {
  choice,
  clock,
  list,
  planOf,
  shotsOf,
  typeInfo,
} from 'xsenze-tools/lib/story/project-types';
import { IMAGE_MODELS } from 'xsenze-tools/lib/story/targets';
import type { Answers, ProjectType } from 'xsenze-tools/lib/story/types';

/** Asset groups the user may already have, and what is made for each if not. */
const ASSETS: readonly { id: string; have: string; make: string }[] = [
  { id: 'characters', have: 'Characters', make: 'Character sheets' },
  { id: 'background', have: 'Background people', make: 'Background people' },
  { id: 'places', have: 'Places', make: 'Places' },
  { id: 'props', have: 'Props', make: 'Props' },
  { id: 'style', have: 'Style picture', make: 'Style frame' },
];

const SHAPES: Record<string, string> = {
  '16:9': '16:9',
  '9:16': '9:16',
  both: '16:9 and 9:16',
  '21:9': '21:9 cinema',
};

/** Past this many parts the plan suggests starting small. */
const BIG = 60;

export interface PlanSummarySignature {
  Args: { type: ProjectType; answers: Answers };
}

/** The plan the answers add up to: tiles of counts, what you have, what gets made. */
export default class PlanSummary extends Component<PlanSummarySignature> {
  get plan() {
    return planOf(this.args.type, this.args.answers);
  }

  get tiles(): XzTile[] {
    const { type, answers: a } = this.args;
    const { plan } = this;
    const info = typeInfo(type);
    const tiles: XzTile[] = [
      { label: 'Running time', value: clock(plan.seconds) },
    ];
    if (type === 'course') {
      tiles.push(
        { label: info.parts, value: String(plan.parts) },
        { label: 'Modules', value: String(plan.groups.length) },
        { label: 'Lesson length', value: clock(plan.partLimit ?? 60) },
      );
    } else if (type === 'story') {
      const series = choice(a, 'storyFormat') === 'series';
      if (series)
        tiles.push({ label: 'Episodes', value: String(plan.groups.length) });
      tiles.push(
        {
          label: info.parts,
          value: series
            ? `${plan.parts} (${plan.groups[0]?.parts ?? 0} each)`
            : String(plan.parts),
        },
        { label: 'Chapter length', value: clock(plan.partLimit ?? 60) },
      );
    } else {
      tiles.push(
        { label: 'Acts', value: String(plan.groups.length) },
        { label: info.parts, value: `About ${plan.parts}` },
      );
    }
    for (const shots of shotsOf(type, a, plan))
      tiles.push({
        label: shots.label,
        value: `About ${shots.count.toLocaleString('en')}`,
      });
    tiles.push(
      {
        label: 'Pictures per shot',
        value:
          choice(a, 'motion') === 'storybook'
            ? '1 still'
            : '2: first and last frame',
      },
      {
        label: 'Image models',
        value:
          IMAGE_MODELS.filter((m) => list(a, 'imageModels').includes(m.id))
            .map((m) => m.name)
            .join(', ') || 'None',
      },
      { label: 'Screen shape', value: SHAPES[choice(a, 'shape')] ?? '16:9' },
    );
    return tiles;
  }

  get haveText(): string {
    const have = list(this.args.answers, 'have');
    const names = [
      ...(have.includes('story') ? ['Story'] : []),
      ...ASSETS.filter((x) => have.includes(x.id)).map((x) => x.have),
    ];
    return names.join(', ') || 'Nothing yet';
  }

  get makeText(): string {
    const have = list(this.args.answers, 'have');
    const names = ASSETS.filter((x) => !have.includes(x.id)).map((x) => x.make);
    return names.length ? names.join(', ') : 'Nothing: you have every asset';
  }

  get storyNote(): string | undefined {
    return list(this.args.answers, 'have').includes('story')
      ? undefined
      : 'No story yet: the chatbot writes one from your idea.';
  }

  get bigNote(): string | undefined {
    const { type, answers: a } = this.args;
    if (this.plan.parts <= BIG) return undefined;
    const first =
      type === 'course'
        ? 'Module 1'
        : type === 'movie'
          ? 'Act 1'
          : choice(a, 'storyFormat') === 'series'
            ? 'Episode 1'
            : 'the first chapters';
    return `${this.plan.parts} ${typeInfo(type).parts.toLowerCase()} is a big project. Start with ${first}; you can add the rest later.`;
  }

  <template>
    <XzTiles @items={{this.tiles}} />
    <XzRow @title="You have" @detail={{this.haveText}} />
    <XzRow @title="Prompts get made for" @detail={{this.makeText}} />
    {{#if this.storyNote}}
      <XzStatus @text={{this.storyNote}} @tone="muted" @row={{true}} />
    {{/if}}
    {{#if this.bigNote}}
      <XzStatus @text={{this.bigNote}} @tone="warn" @row={{true}} />
    {{/if}}
  </template>
}
