/**
 * The chatbot steps. The user copies a prompt into any free chatbot (ChatGPT,
 * Gemini, Claude) and pastes the answer back; nothing here calls a server.
 * Small projects are read in one step. Long ones are read in parts, so a free
 * chatbot's answer is never cut short: first the outline and the list of
 * everything to draw, then the details one module, episode or act at a time.
 */
import { TRANSLATE_LANGUAGES } from 'xsenze-tools/lib/ai/translate';
import {
  CUSTOM,
  allQuestions,
  choice,
  clock,
  customOf,
  list,
  optionsOf,
  planOf,
  typeInfo,
  type Plan,
} from './project-types';
import {
  ID_LETTER,
  type AiTool,
  type AssetKind,
  type Part,
  type Project,
} from './types';

/** Up to this many parts are read in one step. */
const SINGLE_MAX = 16;

export type PassKind = 'write' | 'all' | 'outline' | 'details';

export interface Pass {
  id: string;
  kind: PassKind;
  label: string;
  /** The module, episode or act a details step covers. */
  group?: number;
}

export function passesOf(project: Project): Pass[] {
  const plan = planOf(project.type, project.answers);
  const info = typeInfo(project.type);
  const passes: Pass[] = [];
  if (!list(project.answers, 'have').includes('story'))
    passes.push({ id: 'write', kind: 'write', label: 'Write the story' });
  if (plan.parts <= SINGLE_MAX) {
    passes.push({ id: 'all', kind: 'all', label: 'Read the story' });
  } else {
    passes.push({ id: 'outline', kind: 'outline', label: 'Outline and list' });
    plan.groups.forEach((g, i) =>
      passes.push({
        id: `details-${i}`,
        kind: 'details',
        group: i,
        label: `${g.title || info.part} details`,
      }),
    );
  }
  return passes;
}

// ---------- reading the plan ----------

/** The picked option's label, or the custom text typed in. */
function pick(project: Project, id: string): string {
  const q = allQuestions(project.type).find((x) => x.id === id);
  if (!q || q.kind !== 'choice') return '';
  const picked = choice(project.answers, id);
  if (picked === CUSTOM)
    return String(customOf(project.answers, id) ?? '').trim() || 'custom';
  return (
    optionsOf(q, project.answers, project.type).find((o) => o.id === picked)
      ?.label ?? ''
  );
}

const languageName = (project: Project) =>
  TRANSLATE_LANGUAGES.find(
    (l) => l.code === choice(project.answers, 'language'),
  )?.name ?? 'English';

/** First and last part number (from 1) of each group. */
export function ranges(plan: Plan): [number, number][] {
  let start = 1;
  return plan.groups.map((g) => {
    const range: [number, number] = [start, start + g.parts - 1];
    start += g.parts;
    return range;
  });
}

const span = ([a, b]: [number, number]) => (a === b ? `${a}` : `${a}–${b}`);

/** Does this course show free AI tools? */
export const usesTools = (project: Project) =>
  project.type === 'course' &&
  (choice(project.answers, 'lessonStyle') === 'story-tool' ||
    choice(project.answers, 'subject') === 'ai-tools');

const has = (project: Project, id: string) =>
  list(project.answers, 'lessonHas').includes(id);

const SHAPES: Record<string, string> = {
  bme: 'beginning, middle and end: the first quarter sets things up, the middle has the problem, the last quarter solves it',
  spine:
    'once upon a time… every day… until one day… because of that… until finally… ever since then…',
  problem: 'a problem, tries to fix it, then the solution',
  'three-tries': 'the hero tries three times, and the third try works',
  hero: 'a simple hero’s journey: home, a call, a helper, a test, a win, home again but changed',
  repeat:
    'repeat and build, like a cumulative rhyme: each chapter repeats the last and adds one thing',
  circle: 'full circle: it ends where it started, with something changed',
};

const BEATS_15 = [
  'Opening image',
  'Theme stated',
  'Setup',
  'Catalyst',
  'Debate',
  'Break into two',
  'B story',
  'Fun and games',
  'Midpoint',
  'Bad guys close in',
  'All is lost',
  'Dark night of the soul',
  'Break into three',
  'Finale',
  'Final image',
];

const HERO_12 = [
  'Ordinary world',
  'Call to adventure',
  'Refusal of the call',
  'Meeting the mentor',
  'Crossing the threshold',
  'Tests, allies and enemies',
  'Approach',
  'Ordeal',
  'Reward',
  'The road back',
  'Resurrection',
  'Return with the elixir',
];

function beatsOf(project: Project): readonly string[] | undefined {
  if (project.type !== 'movie') return undefined;
  const s = choice(project.answers, 'structure');
  return s === 'beats-15' ? BEATS_15 : s === 'hero-12' ? HERO_12 : undefined;
}

function ageLine(project: Project): string {
  if (project.type === 'course') {
    const age = choice(project.answers, 'courseAge');
    return age === 'adults'
      ? 'For parents and teachers'
      : `For ages ${pick(project, 'courseAge')}`;
  }
  if (project.type === 'story') {
    const age = choice(project.answers, 'storyAge');
    return age === 'family' || age === 'teens'
      ? `For ${pick(project, 'storyAge').toLowerCase()}`
      : `For ages ${pick(project, 'storyAge')}`;
  }
  return `For a ${pick(project, 'audience').toLowerCase()} audience`;
}

/** The plan, as lines the chatbot can follow. */
function planLines(project: Project, plan: Plan): string[] {
  const a = project.answers;
  const lines: string[] = [];
  const groups = ranges(plan);
  if (project.type === 'course') {
    lines.push(`Subject: ${pick(project, 'subject')}`, ageLine(project));
    lines.push(
      `${plan.parts} lessons of at most ${clock(plan.partLimit ?? 60)} each, in ${plan.groups.length} modules: ${plan.groups
        .map((g, i) => `${g.title} = lessons ${span(groups[i]!)}`)
        .join('; ')}`,
    );
    const style = choice(a, 'lessonStyle');
    lines.push(
      style === 'story-tool'
        ? 'Lesson 1 opens the story. Each later lesson moves the story on, and a character shows one free AI tool that helps.'
        : style === 'story-only'
          ? 'The story itself teaches the subject, lesson by lesson.'
          : style === 'host'
            ? 'A host explains each lesson, with short story scenes.'
            : `How each lesson goes: ${pick(project, 'lessonStyle')}`,
    );
    lines.push(`Who teaches: ${pick(project, 'teacher').toLowerCase()}`);
    const parts = [
      has(project, 'scene') && 'a story scene',
      has(project, 'demo') &&
        usesTools(project) &&
        'a tool demo (a screen recording, added in editing)',
      has(project, 'try') && 'a try-it task',
      has(project, 'safety') && usesTools(project) && 'a safety tip',
      has(project, 'recap') && 'a recap line',
      has(project, 'quiz') && 'a quiz question',
    ].filter(Boolean);
    if (parts.length) lines.push(`Each lesson has ${parts.join(', ')}.`);
    if (plan.moduleEnd)
      lines.push(
        `The last lesson of each module is a ${plan.moduleEnd.toLowerCase()} lesson${usesTools(project) ? ', with no new tool' : ''}.`,
      );
  } else if (project.type === 'story') {
    lines.push(
      `Kind of story: ${pick(project, 'storyKind')}`,
      ageLine(project),
    );
    if (choice(a, 'storyFormat') === 'series')
      lines.push(
        `A series of ${plan.groups.length} episodes of ${clock(plan.groups[0]?.seconds ?? 0)}, each in ${plan.groups[0]?.parts ?? 0} chapters of at most ${clock(plan.partLimit ?? 60)}. Number the chapters straight through: ${plan.groups
          .map((g, i) => `${g.title} = chapters ${span(groups[i]!)}`)
          .join('; ')}`,
      );
    else
      lines.push(
        `${plan.parts} chapters of at most ${clock(plan.partLimit ?? 60)}, about ${clock(plan.seconds)} in all`,
      );
    const shape = choice(a, 'storyShape');
    lines.push(`Story shape: ${SHAPES[shape] ?? pick(project, 'storyShape')}`);
    const message = String(a.message ?? '').trim();
    if (message) lines.push(`Message: ${message}`);
    lines.push(`Telling: ${pick(project, 'telling').toLowerCase()}`);
  } else {
    lines.push(
      choice(a, 'movieLength') === CUSTOM
        ? `A film of ${clock(plan.seconds)}`
        : pick(project, 'movieLength'),
      ageLine(project),
      `Genre: ${pick(project, 'genre').toLowerCase()}`,
      `Structure: ${pick(project, 'structure')}. ${plan.groups
        .map(
          (g, i) =>
            `${g.title}${g.subtitle ? ` (${g.subtitle.toLowerCase()})` : ''} = scenes ${span(groups[i]!)}`,
        )
        .join('; ')}`,
    );
    const beats = beatsOf(project);
    if (beats)
      lines.push(
        `Give each scene the beat it covers, from: ${beats.join(', ')}.`,
      );
    lines.push(
      `Dialogue: ${pick(project, 'dialogue').toLowerCase()}`,
      `Music: ${pick(project, 'music').toLowerCase()}`,
    );
  }
  lines.push(`Narration and dialogue language: ${languageName(project)}`);
  return lines;
}

// ---------- the prompts ----------

/** What is being made, with its article. */
const KIND_WORD = {
  course: 'a kids’ video course',
  story: 'an animated story',
  movie: 'a film',
};

const WRITE_LINE = {
  course: 'Write the story that carries a kids’ video course.',
  story: 'Write a story to be made into an animated video.',
  movie: 'Write the story for a film.',
};

const LOOK_RULES = [
  'Write each "look" as one line a picture model can draw, 25 to 45 words, and use the same words every time:',
  '- characters: age, build, skin tone, face, hair, eyes, outfit with colours, one signature detail',
  '- places: layout, main furniture, colours, light, time of day',
  '- props: shape, size, material, colours, marks',
  '- background groups: how many people, their ages, a simple clothing palette',
  'Never use the names of real people, brands, logos or studios.',
];

function listRules(project: Project): string[] {
  return [
    'EVERYTHING THAT MUST LOOK THE SAME IN EVERY PICTURE',
    '- characters: everyone with a name or a speaking part. IDs C1, C2…',
    '- background: groups of extras, such as classmates, teachers or shoppers. IDs B1, B2…',
    '- places: every location. A room inside a building is a place of its own (home, school, classroom). IDs P1, P2…',
    '- props: objects the story uses, such as a school bag or a tablet. IDs M1, M2…',
    ...(usesTools(project)
      ? ['- tools: every free AI tool a lesson shows. IDs T1, T2…']
      : []),
    '',
    ...LOOK_RULES,
    ...(usesTools(project)
      ? [
          '',
          'FREE AI TOOLS',
          'Only tools with a free plan, and one new tool per lesson. For each tool: "does" (what it does), "use" (how a kid uses it in the lesson), "age" (its age limit from its own terms, such as "13+, younger with a parent"), "safety" (one tip for parents and teachers) and "by" (the ID of the character who shows it).',
        ]
      : []),
  ];
}

/** What the list holds so far, so a later step keeps its IDs. */
function listSoFar(project: Project): string[] {
  const lines = [
    ...project.assets.map(
      (x) => `${x.id} ${x.name}${x.role ? `: ${x.role}` : ''}`,
    ),
    ...project.tools.map(
      (t) => `${t.id} ${t.name}${t.does ? `: ${t.does}` : ''}`,
    ),
  ];
  return lines.length
    ? [
        'THE LIST SO FAR',
        'Keep these IDs and names. Add anything new after them, with the next free ID.',
        ...lines,
      ]
    : [];
}

/** The fields one part carries in the answer. */
function partTemplate(
  project: Project,
  outline: boolean,
): Record<string, unknown> {
  const t: Record<string, unknown> = {
    n: 1,
    title: 'a short title',
    summary: outline ? 'one sentence' : 'what happens, in 1 or 2 sentences',
  };
  if (project.type === 'course') {
    if (usesTools(project)) t.tool = 'T1, or "" for none';
    if (!outline) {
      t.goal = 'what the lesson teaches';
      if (has(project, 'try')) t.task = 'the try-it task';
      if (has(project, 'recap')) t.recap = 'one recap line';
      if (has(project, 'quiz')) t.quiz = 'one quiz question';
    }
  }
  if (beatsOf(project)) t.beat = 'the beat it covers';
  if (!outline) t.cast = ['C1', 'P1', 'M1'];
  return t;
}

const asset = (id: string) => ({
  id,
  name: 'a name',
  role: 'who or what it is in the story',
  look: 'one line, 25 to 45 words',
});

function template(project: Project, pass: Pass): string {
  if (pass.kind === 'details')
    return JSON.stringify(
      {
        parts: [partTemplate(project, false)],
        characters: [],
        background: [],
        places: [],
        props: [],
      },
      null,
      2,
    );
  const t: Record<string, unknown> = {
    title: 'the story’s title',
    synopsis: 'the story in 3 to 5 sentences',
  };
  if (project.type === 'movie') t.logline = 'the film in one sentence';
  t.characters = [asset('C1')];
  t.background = [asset('B1')];
  t.places = [asset('P1')];
  t.props = [asset('M1')];
  if (usesTools(project))
    t.tools = [
      {
        id: 'T1',
        name: 'the tool’s name',
        does: 'what it does',
        use: 'how a kid uses it in the lesson',
        age: 'its age limit',
        safety: 'one tip for parents and teachers',
        by: 'C1',
      },
    ];
  t.parts = [partTemplate(project, pass.kind === 'outline')];
  return JSON.stringify(t, null, 2);
}

function storyBlock(project: Project): string[] {
  return ['THE STORY', '"""', project.story.trim() || '(no story yet)', '"""'];
}

/** How many words the written story should run to. */
function storyWords(project: Project, plan: Plan): number {
  const minutes = plan.seconds / 60;
  const words =
    project.type === 'course' ? plan.parts * 40 : Math.round(minutes * 120);
  return Math.max(150, Math.min(4000, Math.round(words / 50) * 50));
}

function writePrompt(project: Project): string {
  const plan = planOf(project.type, project.answers);
  const idea = String(project.answers.idea ?? '').trim();
  return [
    WRITE_LINE[project.type],
    '',
    'THE PLAN',
    ...planLines(project, plan).map((l) => `- ${l}`),
    `- The idea: ${idea || 'your own, to suit the plan'}`,
    '',
    'RULES',
    `- About ${storyWords(project, plan)} words.${project.type === 'movie' && plan.seconds > 40 * 60 ? ' For a film this long, write a treatment: the story scene by scene, in prose.' : ''}`,
    project.type === 'course' && usesTools(project)
      ? `- Leave room for ${plan.parts - 1} moments where a character uses a free AI tool, one per lesson after the first.`
      : undefined,
    '- Give every character a name, and describe how each one looks the first time they appear.',
    '- Keep it safe and kind for the audience.',
    '',
    'Reply with the story only: no title page, notes or headings.',
  ]
    .filter((l) => l !== undefined)
    .join('\n');
}

export function promptOf(project: Project, pass: Pass): string {
  if (pass.kind === 'write') return writePrompt(project);
  const plan = planOf(project.type, project.answers);
  const info = typeInfo(project.type);
  const word = info.part.toLowerCase();
  const words = info.parts.toLowerCase();
  const lines: string[] = [];
  if (pass.kind === 'details') {
    const g = pass.group ?? 0;
    const range = ranges(plan)[g] ?? [1, 1];
    const group = plan.groups[g];
    lines.push(
      `You are a story editor planning ${KIND_WORD[project.type]}. You already made its outline and the list of everything to draw. Now fill in ${words} ${span(range)}${group?.title ? ` (${group.title})` : ''} in full.`,
      '',
      'THE PLAN',
      ...planLines(project, plan).map((l) => `- ${l}`),
      '',
      ...listSoFar(project),
      '',
      `THE OUTLINE OF ${words.toUpperCase()} ${span(range)}`,
      ...project.parts
        .slice(range[0] - 1, range[1])
        .map(
          (p, i) =>
            `${range[0] + i}. ${p.title || '(no title yet)'}${p.summary ? `: ${p.summary}` : ''}`,
        ),
      '',
      'RULES',
      `- "parts" has exactly ${range[1] - range[0] + 1} entries, n = ${span(range)}.`,
      '- "cast" lists the IDs of everyone and everything in it.',
      '- Leave the lists empty unless a part needs someone or something new; add those with the next free ID.',
      ...LOOK_RULES.slice(0, 1).map((l) => `- ${l.replace(':', '.')}`),
    );
  } else {
    lines.push(
      `You are a story editor planning ${KIND_WORD[project.type]}. Read the story below and plan it.`,
      '',
      'THE PLAN',
      ...planLines(project, plan).map((l) => `- ${l}`),
      '',
      ...listSoFar(project),
      ...(project.assets.length || project.tools.length ? [''] : []),
      ...listRules(project),
      '',
      'RULES',
      `- "parts" has exactly ${plan.parts} ${plan.parts === 1 ? word : words}, n = 1 to ${plan.parts}.`,
      pass.kind === 'outline'
        ? `- Keep each ${word} to a title and one sentence; the details come later.`
        : '- "cast" lists the IDs of everyone and everything in it.',
    );
  }
  lines.push(
    '',
    'Reply with one JSON code block and nothing else, in exactly this shape:',
    '```json',
    template(project, pass),
    '```',
    '',
    ...storyBlock(project),
  );
  return lines.join('\n');
}

// ---------- reading the answer ----------

export interface Report {
  /** What was filled, for the status line. */
  filled: string;
  /** Things worth a look; the fill still happened. */
  problems: string[];
}

export type ReadOutcome =
  { project: Project; report: Report } | { error: string };

const CUT_OFF =
  'The answer looks cut off, or it is not valid JSON. Ask the chatbot: “Send the whole answer again as one JSON code block.” If it stops halfway, ask it to continue, then paste both parts here as one.';

/** The JSON object in an answer, with code fences and stray text around it. */
export function jsonIn(
  answer: string,
): { data: Record<string, unknown> } | { error: string } {
  const cleaned = answer.replace(/```[a-z]*\s*/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0)
    return {
      error:
        'There is no JSON in this answer. Copy the prompt again and paste the chatbot’s whole reply.',
    };
  if (end <= start) return { error: CUT_OFF };
  let body = cleaned.slice(start, end + 1);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data: unknown = JSON.parse(body);
      if (data && typeof data === 'object' && !Array.isArray(data))
        return { data: data as Record<string, unknown> };
      return { error: CUT_OFF };
    } catch {
      // the usual slip: a comma before a closing bracket
      body = body.replace(/,\s*([}\]])/g, '$1');
    }
  }
  return { error: CUT_OFF };
}

const str = (value: unknown): string =>
  typeof value === 'string'
    ? value.trim()
    : typeof value === 'number'
      ? String(value)
      : '';

const records = (data: Record<string, unknown>, keys: readonly string[]) => {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value))
      return value.filter(
        (x): x is Record<string, unknown> => !!x && typeof x === 'object',
      );
  }
  return [];
};

const LISTS: Record<AssetKind, readonly string[]> = {
  character: ['characters', 'character', 'people'],
  background: [
    'background',
    'backgroundPeople',
    'background_people',
    'extras',
    'crowds',
  ],
  place: ['places', 'locations', 'settings'],
  prop: ['props', 'materials', 'objects', 'items'],
};

const HAVE_SWITCH: Record<AssetKind, string> = {
  character: 'characters',
  background: 'background',
  place: 'places',
  prop: 'props',
};

/** "c 01" → "C1"; anything else stays as it was, trimmed. */
export function normalId(raw: string): string {
  const m = /^\s*([a-z])\s*-?\s*0*(\d+)\s*$/i.exec(raw);
  return m ? `${m[1]!.toUpperCase()}${m[2]}` : raw.trim();
}

/** The next free id with this letter. */
export function nextId(letter: string, taken: Iterable<string>): string {
  let top = 0;
  for (const id of taken) {
    const m = new RegExp(`^${letter}(\\d+)$`).exec(id);
    if (m) top = Math.max(top, Number(m[1]));
  }
  return `${letter}${top + 1}`;
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export function readAnswer(
  project: Project,
  pass: Pass,
  answer: string,
): ReadOutcome {
  const marked = (p: Project): Project => ({
    ...p,
    chat: { ...p.chat, [pass.id]: answer },
    filled: p.filled.includes(pass.id) ? p.filled : [...p.filled, pass.id],
  });

  if (pass.kind === 'write') {
    const story = answer.replace(/```[a-z]*\s*/gi, '').trim();
    if (!story) return { error: 'Paste the chatbot’s story first.' };
    const words = story.split(/\s+/).length;
    return {
      project: marked({ ...project, story }),
      report: {
        filled: `The story is in: ${words.toLocaleString('en')} words. Read it under Your story and edit anything you like.`,
        problems: [],
      },
    };
  }

  const parsed = jsonIn(answer);
  if ('error' in parsed) return { error: parsed.error };
  const { data } = parsed;

  const problems: string[] = [];
  const info = typeInfo(project.type);
  const plan = planOf(project.type, project.answers);
  const have = list(project.answers, 'have');

  // the list: update by id, add what is new; the user's own fields stay
  const assets = project.assets.map((a) => ({ ...a }));
  const remap = new Map<string, string>();
  const counts: Record<AssetKind, number> = {
    character: 0,
    background: 0,
    place: 0,
    prop: 0,
  };
  for (const kind of Object.keys(LISTS) as AssetKind[]) {
    const letter = ID_LETTER[kind];
    for (const r of records(data, LISTS[kind])) {
      const raw = str(r.id);
      let id = normalId(raw);
      if (!new RegExp(`^${letter}\\d+$`).test(id)) {
        id = nextId(
          letter,
          assets.map((a) => a.id),
        );
      }
      if (raw && raw !== id) remap.set(raw, id);
      const name = str(r.name);
      const fields = {
        name,
        role: str(r.role ?? r.description),
        look: str(r.look ?? r.appearance),
      };
      const old = assets.find((a) => a.id === id);
      if (old) Object.assign(old, fields);
      else
        assets.push({
          id,
          kind,
          ...fields,
          have: have.includes(HAVE_SWITCH[kind]),
          link: '',
          file: '',
        });
      if (!fields.look)
        problems.push(
          `${id} ${name || ''} has no look yet.`.replace('  ', ' '),
        );
      counts[kind]++;
    }
  }

  // a course's AI tools
  const tools: AiTool[] = project.tools.map((t) => ({ ...t }));
  let toolCount = 0;
  for (const r of records(data, ['tools', 'aiTools', 'ai_tools'])) {
    const raw = str(r.id);
    let id = normalId(raw);
    if (!/^T\d+$/.test(id))
      id = nextId(
        'T',
        tools.map((t) => t.id),
      );
    if (raw && raw !== id) remap.set(raw, id);
    const fields = {
      name: str(r.name),
      does: str(r.does),
      use: str(r.use),
      age: str(r.age),
      safety: str(r.safety),
      by: normalId(str(r.by)),
    };
    const old = tools.find((t) => t.id === id);
    if (old) Object.assign(old, fields);
    else tools.push({ id, ...fields });
    toolCount++;
  }

  const known = new Set([
    ...assets.map((a) => a.id),
    ...tools.map((t) => t.id),
  ]);
  const byName = new Map(assets.map((a) => [a.name.toLowerCase(), a.id]));
  const idOf = (raw: string) => {
    const mapped = remap.get(raw) ?? normalId(raw);
    return known.has(mapped)
      ? mapped
      : (byName.get(raw.toLowerCase()) ?? mapped);
  };

  // the parts, by number
  const range: [number, number] =
    pass.kind === 'details'
      ? (ranges(plan)[pass.group ?? 0] ?? [1, plan.parts])
      : [1, plan.parts];
  const parts: Part[] = project.parts.map((p) => ({ ...p, cast: [...p.cast] }));
  const seen = new Set<number>();
  const strays: number[] = [];
  const unknown = new Set<string>();
  for (const r of records(data, ['parts', 'lessons', 'chapters', 'scenes'])) {
    const n = Number(r.n ?? r.number ?? r.lesson ?? r.chapter ?? r.scene);
    if (!Number.isInteger(n) || n < range[0] || n > range[1] || !parts[n - 1]) {
      strays.push(n);
      continue;
    }
    seen.add(n);
    const part = parts[n - 1]!;
    const set = (
      field: 'title' | 'summary' | 'goal' | 'task' | 'recap' | 'quiz' | 'beat',
      value: unknown,
    ) => {
      const text = str(value);
      if (text) part[field] = text;
    };
    set('title', r.title);
    set('summary', r.summary ?? r.what);
    set('goal', r.goal);
    set('task', r.task);
    set('recap', r.recap);
    set('quiz', r.quiz);
    set('beat', r.beat);
    if ('tool' in r) {
      const tool = str(r.tool);
      part.tool = tool ? idOf(tool) : '';
      if (part.tool && !known.has(part.tool)) unknown.add(part.tool);
    }
    const cast = Array.isArray(r.cast)
      ? r.cast.map(str)
      : typeof r.cast === 'string'
        ? r.cast.split(/[,;]/).map((s) => s.trim())
        : undefined;
    if (cast) {
      part.cast = [...new Set(cast.filter(Boolean).map(idOf))];
      for (const id of part.cast) if (!known.has(id)) unknown.add(id);
    }
  }

  const missing: number[] = [];
  for (let n = range[0]; n <= range[1]; n++) if (!seen.has(n)) missing.push(n);
  const words = info.parts.toLowerCase();
  if (missing.length)
    problems.push(
      `${missing.length === 1 ? info.part : info.parts} ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? '…' : ''} ${missing.length === 1 ? 'is' : 'are'} missing from the answer.`,
    );
  if (strays.length)
    problems.push(
      `The answer has ${plural(strays.length, 'extra entry', 'extra entries')} outside ${words} ${span(range)}: skipped. To keep ${strays.length === 1 ? 'it' : 'them'}, make the plan longer on the Plan tab and read again.`,
    );
  if (unknown.size)
    problems.push(
      `Some ${words} name IDs that are not in the list: ${[...unknown].slice(0, 8).join(', ')}.`,
    );

  const title = str(data.title);
  const next: Project = {
    ...project,
    title: title && /^Untitled /.test(project.title) ? title : project.title,
    synopsis: str(data.synopsis) || project.synopsis,
    logline: str(data.logline) || project.logline,
    assets,
    tools,
    parts,
  };

  const bits = [
    seen.size && plural(seen.size, info.part.toLowerCase(), words),
    counts.character && plural(counts.character, 'character', 'characters'),
    counts.background &&
      plural(counts.background, 'background group', 'background groups'),
    counts.place && plural(counts.place, 'place', 'places'),
    counts.prop && plural(counts.prop, 'prop', 'props'),
    toolCount && plural(toolCount, 'AI tool', 'AI tools'),
  ].filter(Boolean) as string[];
  if (!bits.length)
    return {
      error:
        'Nothing in this answer matches the plan. Check you pasted the answer to this step’s prompt.',
    };
  const last = bits.pop();
  return {
    project: marked(next),
    report: {
      filled: `Filled ${bits.length ? `${bits.join(', ')} and ${last}` : last}.`,
      problems,
    },
  };
}
