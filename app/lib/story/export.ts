/**
 * Exports: the whole project as Markdown to read, and the picture prompts as
 * CSV, one row per prompt, for a spreadsheet.
 */
import {
  CUSTOM,
  allQuestions,
  choice,
  clock,
  customOf,
  list,
  optionsOf,
  planOf,
  switchOptionsOf,
  typeInfo,
  visible,
} from './project-types';
import { ranges } from './analysis';
import {
  modelsOf,
  picturePrompts,
  shapesOf,
  type PicturePrompt,
} from './prompts';
import { imageModel } from './targets';
import type { Asset, Project } from './types';

/** Every visible answer as "Question: answer". */
export function planText(project: Project): string[] {
  const { type, answers: a } = project;
  const lines: string[] = [];
  for (const q of allQuestions(type)) {
    if (!visible(q, a, type)) continue;
    let value = '';
    if (q.kind === 'choice') {
      const id = choice(a, q.id);
      value =
        id === CUSTOM
          ? String(customOf(a, q.id) ?? '')
          : (optionsOf(q, a, type).find((o) => o.id === id)?.label ?? '');
    } else if (q.kind === 'switches') {
      const on = list(a, q.id);
      value = switchOptionsOf(q, a, type)
        .filter((o) => on.includes(o.id))
        .map((o) => o.label)
        .join(', ');
    } else value = String(a[q.id] ?? '').trim();
    if (value) lines.push(`${q.title}: ${value}`);
  }
  return lines;
}

const nameOf = (project: Project, id: string) => {
  const found =
    project.assets.find((a) => a.id === id) ??
    project.tools.find((t) => t.id === id);
  return found ? `${id} ${found.name}` : id;
};

const GROUPS: readonly [Asset['kind'], string][] = [
  ['character', 'Characters'],
  ['background', 'Background people'],
  ['place', 'Places'],
  ['prop', 'Props'],
];

function fence(text: string): string {
  // a fence longer than any run of backticks inside
  const longest = Math.max(
    2,
    ...(text.match(/`+/g) ?? []).map((m) => m.length),
  );
  const mark = '`'.repeat(longest + 1);
  return `${mark}text\n${text}\n${mark}`;
}

/** Every prompt for every model and shape, each once. */
export function allPrompts(
  project: Project,
): { model: string; prompt: PicturePrompt; id: string; name: string }[] {
  const out: {
    model: string;
    prompt: PicturePrompt;
    id: string;
    name: string;
  }[] = [];
  const seen = new Set<string>();
  for (const model of modelsOf(project))
    for (const shape of shapesOf(project))
      for (const group of picturePrompts(project, model, shape))
        for (const prompt of group.prompts) {
          if (seen.has(prompt.key)) continue;
          seen.add(prompt.key);
          out.push({
            model: imageModel(model)?.name ?? model,
            prompt,
            id: group.id,
            name: group.name,
          });
        }
  return out;
}

export function projectMarkdown(project: Project): string {
  const info = typeInfo(project.type);
  const plan = planOf(project.type, project.answers);
  const out: string[] = [`# ${project.title}`, ''];
  out.push(
    `${info.name} · ${clock(plan.seconds)} · ${plan.parts} ${info.parts.toLowerCase()}`,
    '',
    '## Plan',
    '',
    ...planText(project).map((l) => `- ${l}`),
    '',
  );
  if (project.logline || project.synopsis) {
    out.push('## Story summary', '');
    if (project.logline) out.push(`*${project.logline}*`, '');
    if (project.synopsis) out.push(project.synopsis, '');
  }
  for (const [kind, heading] of GROUPS) {
    const items = project.assets.filter((x) => x.kind === kind);
    if (!items.length) continue;
    out.push(`## ${heading}`, '');
    for (const x of items) {
      out.push(`### ${x.id} ${x.name}`, '');
      if (x.role) out.push(`- Role: ${x.role}`);
      if (x.look) out.push(`- Look: ${x.look}`);
      out.push(`- Picture: ${x.have ? 'you have it' : 'to make'}`);
      if (x.link) out.push(`- Link: ${x.link}`);
      if (x.file) out.push(`- File: ${x.file}`);
      out.push('');
    }
  }
  if (project.tools.length) {
    out.push('## Free AI tools', '');
    for (const t of project.tools) {
      out.push(`### ${t.id} ${t.name}`, '');
      if (t.does) out.push(`- What it does: ${t.does}`);
      if (t.use) out.push(`- How a kid uses it: ${t.use}`);
      if (t.age) out.push(`- Age limit: ${t.age}`);
      if (t.safety) out.push(`- Safety tip: ${t.safety}`);
      if (t.by) out.push(`- Shown by: ${nameOf(project, t.by)}`);
      out.push('');
    }
  }
  out.push('## Outline', '');
  const spans = ranges(plan);
  plan.groups.forEach((g, gi) => {
    const [first, last] = spans[gi]!;
    if (g.title)
      out.push(
        `### ${g.title}${g.subtitle ? ` · ${g.subtitle}` : ''} · ${info.parts} ${first}–${last} · ${clock(g.seconds)}`,
        '',
      );
    for (let n = first; n <= last; n++) {
      const p = project.parts[n - 1];
      if (!p) continue;
      const label = project.type === 'story' ? n - first + 1 : n;
      out.push(
        `${label}. **${p.title || `${info.part} ${label}`}**${p.summary ? `: ${p.summary}` : ''}`,
      );
      const extra = [
        p.goal && `Goal: ${p.goal}`,
        p.tool && `Tool: ${nameOf(project, p.tool)}`,
        p.task && `Try it: ${p.task}`,
        p.recap && `Recap: ${p.recap}`,
        p.quiz && `Quiz: ${p.quiz}`,
        p.beat && `Beat: ${p.beat}`,
        p.cast.length &&
          `In it: ${p.cast.map((id) => nameOf(project, id)).join(', ')}`,
      ].filter(Boolean);
      for (const e of extra) out.push(`   - ${e as string}`);
    }
    out.push('');
  });
  const prompts = allPrompts(project);
  if (prompts.length) {
    out.push('## Picture prompts', '');
    let heading = '';
    for (const { model, prompt, id, name } of prompts) {
      const head = `### ${model}`;
      if (head !== heading) {
        out.push(head, '');
        heading = head;
      }
      const who = id === 'style' ? '' : `${id} ${name}: `;
      out.push(
        `#### ${who}${prompt.title} (${prompt.shape})`,
        '',
        `Save as: ${prompt.saveAs}`,
        '',
      );
      if (prompt.attach.length)
        out.push(`Attach: ${prompt.attach.join(', ')}`, '');
      out.push(fence(prompt.text), '');
      for (const note of prompt.notes) out.push(`> ${note}`, '');
    }
  }
  if (project.story.trim())
    out.push('## The story', '', project.story.trim(), '');
  return out.join('\n');
}

const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;

/** The picture prompts, one row each; the BOM makes spreadsheets read UTF-8. */
export function promptsCsv(project: Project): string {
  const rows = [
    [
      'ID',
      'Name',
      'Picture',
      'Model',
      'Shape',
      'Save as',
      'Attach',
      'Notes',
      'Prompt',
    ],
    ...allPrompts(project).map(({ model, prompt, id, name }) => [
      id === 'style' ? '' : id,
      name,
      prompt.title,
      model,
      prompt.shape,
      prompt.saveAs,
      prompt.attach.join('; '),
      prompt.notes.join(' '),
      prompt.text,
    ]),
  ];
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

/** A file name stem from the project's name. */
export function stemOf(project: Project): string {
  return (
    project.title
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'project'
  );
}
