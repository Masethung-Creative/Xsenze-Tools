import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import XzMenuCell from 'xsenze-tools/components/xz/menu-cell';
import XzRow from 'xsenze-tools/components/xz/row';
import XzTextCell from 'xsenze-tools/components/xz/text-cell';
import { normalId, ranges } from 'xsenze-tools/lib/story/analysis';
import {
  choice,
  clock,
  list,
  planOf,
  typeInfo,
} from 'xsenze-tools/lib/story/project-types';
import type { Part, Project } from 'xsenze-tools/lib/story/types';

/** The part fields a person types. */
export type PartField =
  | 'title'
  | 'summary'
  | 'goal'
  | 'task'
  | 'recap'
  | 'quiz'
  | 'beat'
  | 'tool'
  | 'cast';

interface PartView {
  id: string;
  label: string;
  part: Part;
  cast: string;
  toolIndex: number;
}

interface GroupView {
  key: string;
  title: string;
  meta: string;
  open: boolean;
  parts: PartView[];
}

export interface PartsEditorSignature {
  Args: {
    project: Project;
    onChange: (id: string, field: PartField, value: string | string[]) => void;
  };
}

/** Every lesson, chapter or scene with what the chatbot filled in, all editable. */
export default class PartsEditor extends Component<PartsEditorSignature> {
  /** "In it" as typed, so a half-typed list keeps its commas. */
  @tracked drafts: Record<string, string> = {};

  get course() {
    return this.args.project.type === 'course';
  }

  get movie() {
    return this.args.project.type === 'movie';
  }

  get showsTools() {
    return this.course && this.args.project.tools.length > 0;
  }

  get toolItems(): string[] {
    return ['None', ...this.args.project.tools.map((t) => `${t.id} ${t.name}`)];
  }

  has = (id: string) =>
    list(this.args.project.answers, 'lessonHas').includes(id);

  get showsTask() {
    return this.course && this.has('try');
  }

  get showsRecap() {
    return this.course && this.has('recap');
  }

  get showsQuiz() {
    return this.course && this.has('quiz');
  }

  get showsBeat() {
    return (
      this.movie &&
      ['beats-15', 'hero-12'].includes(
        choice(this.args.project.answers, 'structure'),
      )
    );
  }

  get groups(): GroupView[] {
    const { project } = this.args;
    const plan = planOf(project.type, project.answers);
    const info = typeInfo(project.type);
    const spans = ranges(plan);
    return plan.groups.map((g, gi) => {
      const [first, last] = spans[gi]!;
      const parts: PartView[] = [];
      for (let n = first; n <= last; n++) {
        const part = project.parts[n - 1];
        if (!part) continue;
        const number = project.type === 'story' ? n - first + 1 : n;
        parts.push({
          id: part.id,
          label: `${info.part} ${number}`,
          part,
          cast: this.drafts[part.id] ?? part.cast.join(', '),
          toolIndex: Math.max(
            0,
            project.tools.findIndex((t) => t.id === part.tool) + 1,
          ),
        });
      }
      return {
        key: `g${gi}`,
        title: g.title || info.parts,
        meta: [g.subtitle, `${info.parts} ${first}–${last}`, clock(g.seconds)]
          .filter(Boolean)
          .join(' · '),
        open: gi === 0,
        parts,
      };
    });
  }

  set = (id: string, field: PartField, value: string) =>
    this.args.onChange(id, field, value);

  pickTool = (id: string, index: number) =>
    this.args.onChange(
      id,
      'tool',
      this.args.project.tools[index - 1]?.id ?? '',
    );

  setCast = (id: string, text: string) => {
    this.drafts = { ...this.drafts, [id]: text };
    this.args.onChange(
      id,
      'cast',
      text
        .split(/[,;\s]+/)
        .map((s) => normalId(s))
        .filter(Boolean),
    );
  };

  <template>
    {{#each this.groups key="key" as |group|}}
      <details class="ss-group" open={{group.open}}>
        <summary class="ss-group-head">
          <span class="ss-group-title">{{group.title}}</span>
          <span class="ss-group-meta">{{group.meta}}</span>
        </summary>
        {{#each group.parts key="id" as |p|}}
          <div class="ss-card">
            <XzRow @title={{p.label}} @form="flush" as |titleId|>
              <XzTextCell
                @value={{p.part.title}}
                @placeholder="Title"
                @onChange={{fn this.set p.id "title"}}
                aria-labelledby={{titleId}}
              />
            </XzRow>
            <XzRow @title="What happens" @form="stacked" as |titleId|>
              <XzTextCell
                @value={{p.part.summary}}
                @placeholder="A sentence or two"
                @onChange={{fn this.set p.id "summary"}}
                aria-labelledby={{titleId}}
              />
            </XzRow>
            {{#if this.course}}
              <XzRow @title="Goal" @form="flush" as |titleId|>
                <XzTextCell
                  @value={{p.part.goal}}
                  @placeholder="What it teaches"
                  @onChange={{fn this.set p.id "goal"}}
                  aria-labelledby={{titleId}}
                />
              </XzRow>
            {{/if}}
            {{#if this.showsTools}}
              <XzRow @title="AI tool" @form="flush" as |titleId|>
                <XzMenuCell
                  @items={{this.toolItems}}
                  @selected={{p.toolIndex}}
                  @labelledBy={{titleId}}
                  @onChange={{fn this.pickTool p.id}}
                />
              </XzRow>
            {{/if}}
            {{#if this.showsTask}}
              <XzRow @title="Try it" @form="flush" as |titleId|>
                <XzTextCell
                  @value={{p.part.task}}
                  @placeholder="The try-it task"
                  @onChange={{fn this.set p.id "task"}}
                  aria-labelledby={{titleId}}
                />
              </XzRow>
            {{/if}}
            {{#if this.showsRecap}}
              <XzRow @title="Recap" @form="flush" as |titleId|>
                <XzTextCell
                  @value={{p.part.recap}}
                  @placeholder="One recap line"
                  @onChange={{fn this.set p.id "recap"}}
                  aria-labelledby={{titleId}}
                />
              </XzRow>
            {{/if}}
            {{#if this.showsQuiz}}
              <XzRow @title="Quiz" @form="flush" as |titleId|>
                <XzTextCell
                  @value={{p.part.quiz}}
                  @placeholder="One quiz question"
                  @onChange={{fn this.set p.id "quiz"}}
                  aria-labelledby={{titleId}}
                />
              </XzRow>
            {{/if}}
            {{#if this.showsBeat}}
              <XzRow @title="Beat" @form="flush" as |titleId|>
                <XzTextCell
                  @value={{p.part.beat}}
                  @placeholder="The beat it covers"
                  @onChange={{fn this.set p.id "beat"}}
                  aria-labelledby={{titleId}}
                />
              </XzRow>
            {{/if}}
            <XzRow @title="In it" @form="flush" as |titleId|>
              <XzTextCell
                @value={{p.cast}}
                @placeholder="IDs, such as C1, P2, M1"
                @onChange={{fn this.setCast p.id}}
                aria-labelledby={{titleId}}
              />
            </XzRow>
          </div>
        {{/each}}
      </details>
    {{/each}}
  </template>
}
