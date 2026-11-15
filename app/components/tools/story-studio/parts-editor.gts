import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import CanonMenuCell from 'delphicanon/components/canon-menu-cell';
import CanonRow from 'delphicanon/components/canon-row';
import CanonTextCell from 'delphicanon/components/canon-text-cell';
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
            <CanonRow @title={{p.label}} @form="flush" as |titleId|>
              <CanonTextCell
                @value={{p.part.title}}
                @placeholder="Title"
                @onChange={{fn this.set p.id "title"}}
                aria-labelledby={{titleId}}
              />
            </CanonRow>
            <CanonRow @title="What happens" @form="stacked" as |titleId|>
              <CanonTextCell
                @value={{p.part.summary}}
                @placeholder="A sentence or two"
                @onChange={{fn this.set p.id "summary"}}
                aria-labelledby={{titleId}}
              />
            </CanonRow>
            {{#if this.course}}
              <CanonRow @title="Goal" @form="flush" as |titleId|>
                <CanonTextCell
                  @value={{p.part.goal}}
                  @placeholder="What it teaches"
                  @onChange={{fn this.set p.id "goal"}}
                  aria-labelledby={{titleId}}
                />
              </CanonRow>
            {{/if}}
            {{#if this.showsTools}}
              <CanonRow @title="AI tool" @form="flush" as |titleId|>
                <CanonMenuCell
                  @items={{this.toolItems}}
                  @selected={{p.toolIndex}}
                  @labelledBy={{titleId}}
                  @onChange={{fn this.pickTool p.id}}
                />
              </CanonRow>
            {{/if}}
            {{#if this.showsTask}}
              <CanonRow @title="Try it" @form="flush" as |titleId|>
                <CanonTextCell
                  @value={{p.part.task}}
                  @placeholder="The try-it task"
                  @onChange={{fn this.set p.id "task"}}
                  aria-labelledby={{titleId}}
                />
              </CanonRow>
            {{/if}}
            {{#if this.showsRecap}}
              <CanonRow @title="Recap" @form="flush" as |titleId|>
                <CanonTextCell
                  @value={{p.part.recap}}
                  @placeholder="One recap line"
                  @onChange={{fn this.set p.id "recap"}}
                  aria-labelledby={{titleId}}
                />
              </CanonRow>
            {{/if}}
            {{#if this.showsQuiz}}
              <CanonRow @title="Quiz" @form="flush" as |titleId|>
                <CanonTextCell
                  @value={{p.part.quiz}}
                  @placeholder="One quiz question"
                  @onChange={{fn this.set p.id "quiz"}}
                  aria-labelledby={{titleId}}
                />
              </CanonRow>
            {{/if}}
            {{#if this.showsBeat}}
              <CanonRow @title="Beat" @form="flush" as |titleId|>
                <CanonTextCell
                  @value={{p.part.beat}}
                  @placeholder="The beat it covers"
                  @onChange={{fn this.set p.id "beat"}}
                  aria-labelledby={{titleId}}
                />
              </CanonRow>
            {{/if}}
            <CanonRow @title="In it" @form="flush" as |titleId|>
              <CanonTextCell
                @value={{p.cast}}
                @placeholder="IDs, such as C1, P2, M1"
                @onChange={{fn this.setCast p.id}}
                aria-labelledby={{titleId}}
              />
            </CanonRow>
          </div>
        {{/each}}
      </details>
    {{/each}}
  </template>
}
