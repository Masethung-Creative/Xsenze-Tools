import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import CanonRow from 'delphicanon/components/canon-row';
import CanonTextCell from 'delphicanon/components/canon-text-cell';
import {
  choice,
  clock,
  planOf,
  typeInfo,
} from 'xsenze-tools/lib/story/project-types';
import type { Answers, Part, ProjectType } from 'xsenze-tools/lib/story/types';

interface RowView {
  id: string;
  label: string;
  hint: string;
  title: string;
}

interface GroupView {
  key: string;
  title: string;
  meta: string;
  open: boolean;
  rows: RowView[];
}

export interface OutlineSignature {
  Args: {
    type: ProjectType;
    answers: Answers;
    parts: readonly Part[];
    /** Only the group lines, no part rows: the New project preview. */
    compact?: boolean;
    onRename?: (id: string, title: string) => void;
  };
}

/** The modules and lessons, episodes and chapters, or acts and scenes the plan lays out. */
export default class Outline extends Component<OutlineSignature> {
  get groups(): GroupView[] {
    const { type, answers: a, parts } = this.args;
    const plan = planOf(type, a);
    const info = typeInfo(type);
    const storyFirst = ['story-tool', 'story-only'].includes(
      choice(a, 'lessonStyle'),
    );
    let index = 0;
    return plan.groups.map((group, g) => {
      const rows: RowView[] = [];
      for (let k = 0; k < group.parts; k++, index++) {
        const part = parts[index];
        const n = type === 'story' ? k + 1 : index + 1;
        const last = k === group.parts - 1;
        let hint = 'Title, optional';
        if (type === 'course') {
          if (index === 0 && storyFirst) hint = 'Opens the story';
          else if (last && plan.moduleEnd) hint = plan.moduleEnd;
        } else if (type === 'story') {
          if (k === 0 && index === 0) hint = 'Opens the story';
          else if (last && group.parts > 1) hint = 'Ending';
        }
        rows.push({
          id: part?.id ?? `missing-${index}`,
          label: `${info.part} ${n}`,
          hint,
          title: part?.title ?? '',
        });
      }
      const first = type === 'story' ? 1 : index - group.parts + 1;
      const range =
        group.parts === 1
          ? `${info.part} ${first}`
          : `${info.parts} ${first}–${first + group.parts - 1}`;
      const meta = [group.subtitle, range, clock(group.seconds)]
        .filter(Boolean)
        .join(' · ');
      return {
        key: `g${g}`,
        title: group.title || info.parts,
        meta,
        open: g === 0,
        rows,
      };
    });
  }

  rename = (id: string, title: string) => this.args.onRename?.(id, title);

  <template>
    {{#each this.groups key="key" as |group|}}
      {{#if @compact}}
        <CanonRow @title={{group.title}} @detail={{group.meta}} />
      {{else}}
        <details class="ss-group" open={{group.open}}>
          <summary class="ss-group-head">
            <span class="ss-group-title">{{group.title}}</span>
            <span class="ss-group-meta">{{group.meta}}</span>
          </summary>
          {{#each group.rows key="id" as |row|}}
            <CanonRow @title={{row.label}} @form="flush" as |titleId|>
              <CanonTextCell
                @value={{row.title}}
                @placeholder={{row.hint}}
                @onChange={{fn this.rename row.id}}
                aria-labelledby={{titleId}}
              />
            </CanonRow>
          {{/each}}
        </details>
      {{/if}}
    {{/each}}
  </template>
}
