/**
 * The three kinds of project, the New project questions for each, and the
 * plan maths: how many lessons, chapters or scenes the answers give, and
 * how many shots that is per video tool. The option lists live here; change
 * them in one place.
 */
import { TRANSLATE_LANGUAGES } from 'xsenze-tools/lib/translate';
import { ANIMATION_TYPES, MATCH_MINE, animationType } from './keywords';
import { IMAGE_MODELS, STILL_SECONDS, VIDEO_TOOLS } from './targets';
import {
  blankPart,
  type Answer,
  type Answers,
  type Part,
  type ProjectType,
} from './types';

export interface Option {
  id: string;
  label: string;
  /** What the plan maths reads: minutes or seconds, by question. */
  value?: number;
  /** Shown under the question while this option is picked. */
  note?: string;
  /** Offered only when this holds. */
  when?: (a: Answers, type: ProjectType) => boolean;
}

/** What picking the option `custom` asks for. */
export type Custom =
  | { kind: 'number'; unit: string; min: number; max: number; default: number }
  | { kind: 'text'; placeholder: string };

interface Base {
  id: string;
  title: string;
  /** Asked only when this holds. */
  when?: (a: Answers, type: ProjectType) => boolean;
}

export interface ChoiceQuestion extends Base {
  kind: 'choice';
  options: readonly Option[] | ((a: Answers, type: ProjectType) => Option[]);
  default: string | ((a: Answers, type: ProjectType) => string);
  custom?: Custom;
}

export interface SwitchesQuestion extends Base {
  kind: 'switches';
  options: readonly Option[];
  default: readonly string[];
  /** Fewest that can be on. */
  min?: number;
}

export interface TextQuestion extends Base {
  kind: 'text';
  placeholder: string | ((type: ProjectType) => string);
  note?: string;
}

export type Question = ChoiceQuestion | SwitchesQuestion | TextQuestion;

export const CUSTOM = 'custom';
export const customKey = (id: string) => `${id}.custom`;

export interface TypeInfo {
  id: ProjectType;
  name: string;
  icon: string;
  description: string;
  /** Module, Episode, Act. */
  group: string;
  /** Lesson, Chapter, Scene. */
  part: string;
  parts: string;
}

export const PROJECT_TYPES: readonly TypeInfo[] = [
  {
    id: 'course',
    name: 'Course',
    icon: 'graduation-cap',
    description:
      'Teach a subject in short lessons, for example a kids’ course where each lesson shows one free AI tool.',
    group: 'Module',
    part: 'Lesson',
    parts: 'Lessons',
  },
  {
    id: 'story',
    name: 'Story',
    icon: 'book-open',
    description:
      'An animated story in chapters: a bedtime story, a fable or a series episode.',
    group: 'Episode',
    part: 'Chapter',
    parts: 'Chapters',
  },
  {
    id: 'movie',
    name: 'Movie',
    icon: 'film',
    description: 'A short film or a full film, in acts and scenes.',
    group: 'Act',
    part: 'Scene',
    parts: 'Scenes',
  },
];

export const typeInfo = (type: ProjectType): TypeInfo =>
  PROJECT_TYPES.find((t) => t.id === type)!;

const custom = (label = 'Custom'): Option => ({ id: CUSTOM, label });

const minutes = (list: readonly number[]): Option[] =>
  list.map((m) => ({ id: String(m), label: clock(m * 60), value: m }));

// ---------- Course ----------

const AI_SUBJECTS = new Set(['ai-tools', 'coding']);

const COURSE: readonly Question[] = [
  {
    kind: 'choice',
    id: 'subject',
    title: 'Subject',
    options: [
      { id: 'ai-tools', label: 'AI tools' },
      { id: 'science', label: 'Science' },
      { id: 'maths', label: 'Maths' },
      { id: 'english', label: 'English and languages' },
      { id: 'coding', label: 'Coding' },
      { id: 'art', label: 'Art and craft' },
      { id: 'money', label: 'Money and life skills' },
      { id: 'general', label: 'General knowledge' },
      custom(),
    ],
    default: 'ai-tools',
    custom: { kind: 'text', placeholder: 'Your subject' },
  },
  {
    kind: 'choice',
    id: 'courseAge',
    title: 'Age group',
    options: [
      { id: '3-5', label: '3–5' },
      { id: '6-8', label: '6–8' },
      { id: '9-12', label: '9–12' },
      { id: '13-17', label: '13–17' },
      { id: 'adults', label: 'Parents and teachers' },
    ],
    default: '9-12',
  },
  {
    kind: 'choice',
    id: 'courseLength',
    title: 'Course length',
    options: [...minutes([10, 15, 30, 45, 60, 90, 120, 180, 300]), custom()],
    default: '30',
    custom: { kind: 'number', unit: 'min', min: 1, max: 600, default: 20 },
  },
  {
    kind: 'choice',
    id: 'lessonLength',
    title: 'Lesson length',
    options: [
      { id: '30', label: '30 s', value: 30 },
      { id: '45', label: '45 s', value: 45 },
      { id: '60', label: '1 min', value: 60, note: 'Your maximum.' },
    ],
    default: '60',
  },
  {
    kind: 'choice',
    id: 'modules',
    title: 'Modules',
    options: [
      { id: 'auto', label: 'Auto (about 8 lessons each)' },
      custom('Set a number'),
    ],
    default: 'auto',
    custom: { kind: 'number', unit: 'modules', min: 1, max: 50, default: 4 },
  },
  {
    kind: 'choice',
    id: 'lessonStyle',
    title: 'Lesson style',
    options: [
      {
        id: 'story-tool',
        label: 'Story + tool',
        note: 'Lesson 1 opens the story. Each later lesson moves it on while a character shows one free AI tool.',
      },
      { id: 'story-only', label: 'Story only' },
      { id: 'host', label: 'Host explains' },
      custom(),
    ],
    default: 'story-tool',
    custom: { kind: 'text', placeholder: 'How each lesson goes' },
  },
  {
    kind: 'choice',
    id: 'teacher',
    title: 'Who teaches',
    options: [
      { id: 'character', label: 'A story character' },
      { id: 'host', label: 'A new host character' },
      { id: 'narrator', label: 'Narrator only' },
    ],
    default: 'character',
  },
  {
    kind: 'switches',
    id: 'lessonHas',
    title: 'Each lesson has',
    options: [
      { id: 'scene', label: 'Story scene' },
      {
        id: 'demo',
        label: 'Tool demo (screen insert)',
        when: (a) => AI_SUBJECTS.has(choice(a, 'subject')),
      },
      { id: 'try', label: 'Try-it task' },
      { id: 'safety', label: 'Safety tip' },
      { id: 'recap', label: 'Recap line' },
      { id: 'quiz', label: 'Quiz question' },
    ],
    default: ['scene', 'demo', 'try', 'safety'],
  },
  {
    kind: 'choice',
    id: 'moduleEnd',
    title: 'End of each module',
    options: [
      { id: 'recap', label: 'Recap lesson' },
      { id: 'quiz', label: 'Quiz lesson' },
      { id: 'none', label: 'Nothing' },
    ],
    default: 'recap',
  },
];

// ---------- Story ----------

const STORY: readonly Question[] = [
  {
    kind: 'choice',
    id: 'storyKind',
    title: 'Kind of story',
    options: [
      { id: 'bedtime', label: 'Bedtime' },
      { id: 'fable', label: 'Fairy tale or fable' },
      { id: 'adventure', label: 'Adventure' },
      { id: 'funny', label: 'Funny' },
      { id: 'feelings', label: 'Friendship and feelings' },
      { id: 'nature', label: 'Animals and nature' },
      { id: 'mystery', label: 'Gentle mystery' },
      { id: 'myth', label: 'Myth and legend' },
      { id: 'festival', label: 'Festival and culture' },
      { id: 'space', label: 'Space and science' },
      custom(),
    ],
    default: 'adventure',
    custom: { kind: 'text', placeholder: 'Your kind of story' },
  },
  {
    kind: 'choice',
    id: 'storyAge',
    title: 'Age group',
    options: [
      { id: '1-3', label: '1–3' },
      { id: '3-5', label: '3–5' },
      { id: '6-8', label: '6–8' },
      { id: '9-12', label: '9–12' },
      { id: 'teens', label: 'Teens' },
      { id: 'family', label: 'Family' },
    ],
    default: '6-8',
  },
  {
    kind: 'choice',
    id: 'storyFormat',
    title: 'Format',
    options: [
      { id: 'one', label: 'One story' },
      { id: 'series', label: 'Series' },
    ],
    default: 'one',
  },
  {
    kind: 'choice',
    id: 'episodes',
    title: 'Episodes',
    when: (a) => choice(a, 'storyFormat') === 'series',
    options: [
      ...[3, 5, 6, 10, 13, 26].map((n) => ({
        id: String(n),
        label: String(n),
        value: n,
      })),
      custom(),
    ],
    default: '5',
    custom: { kind: 'number', unit: 'episodes', min: 2, max: 200, default: 8 },
  },
  {
    kind: 'choice',
    id: 'storyLength',
    title: 'Length (each story or episode)',
    options: [...minutes([1, 3, 5, 7, 11, 22]), custom()],
    default: '5',
    custom: { kind: 'number', unit: 'min', min: 1, max: 120, default: 4 },
  },
  {
    kind: 'choice',
    id: 'chapterLength',
    title: 'Chapter length',
    options: [
      { id: '30', label: '30 s', value: 30 },
      { id: '60', label: '1 min', value: 60 },
      { id: '120', label: '2 min', value: 120 },
      { id: '180', label: '3 min', value: 180 },
    ],
    default: '60',
  },
  {
    kind: 'choice',
    id: 'storyShape',
    title: 'Story shape',
    options: [
      { id: 'bme', label: 'Beginning–middle–end' },
      { id: 'spine', label: 'Once upon a time… until finally' },
      { id: 'problem', label: 'Problem → solution' },
      { id: 'three-tries', label: 'Three tries' },
      { id: 'hero', label: 'Hero’s journey (simple)' },
      { id: 'repeat', label: 'Repeat and build (toddlers)' },
      { id: 'circle', label: 'Full circle' },
      custom(),
    ],
    default: 'bme',
    custom: { kind: 'text', placeholder: 'Your story shape' },
  },
  {
    kind: 'text',
    id: 'message',
    title: 'Message',
    placeholder: 'Optional, for example “sharing is kind”',
  },
  {
    kind: 'choice',
    id: 'telling',
    title: 'Telling',
    options: [
      { id: 'narrator', label: 'Narrator' },
      { id: 'dialogue', label: 'Dialogue' },
      { id: 'both', label: 'Narrator + dialogue' },
      { id: 'rhyme', label: 'Rhyme or song' },
    ],
    default: 'both',
  },
];

// ---------- Movie ----------

const movieLengths: Option[] = [
  ...[1, 3].map((m) => ({
    id: `micro-${m}`,
    label: `Micro short · ${m} min`,
    value: m,
  })),
  ...[5, 10, 15, 20, 30, 40].map((m) => ({
    id: `short-${m}`,
    label: `Short film · ${m} min`,
    value: m,
  })),
  ...[60, 75, 90, 120].map((m) => ({
    id: `feature-${m}`,
    label: `Feature · ${m} min`,
    value: m,
  })),
  { id: 'trailer-0.5', label: 'Trailer · 30 s', value: 0.5 },
  { id: 'trailer-1', label: 'Trailer · 1 min', value: 1 },
  { id: 'trailer-2', label: 'Trailer · 2 min', value: 2 },
  custom(),
];

const notForKids = (a: Answers) => choice(a, 'audience') !== 'kids';

const MOVIE: readonly Question[] = [
  {
    kind: 'choice',
    id: 'movieLength',
    title: 'Format and length',
    options: movieLengths,
    default: 'short-10',
    custom: { kind: 'number', unit: 'min', min: 1, max: 240, default: 12 },
  },
  {
    kind: 'choice',
    id: 'audience',
    title: 'Audience',
    options: [
      { id: 'kids', label: 'Kids' },
      { id: 'family', label: 'Family' },
      { id: 'teens', label: 'Teens' },
      { id: 'adults', label: 'Adults' },
    ],
    default: 'family',
  },
  {
    kind: 'choice',
    id: 'genre',
    title: 'Genre',
    options: [
      { id: 'adventure', label: 'Adventure' },
      { id: 'comedy', label: 'Comedy' },
      { id: 'drama', label: 'Drama' },
      { id: 'fantasy', label: 'Fantasy' },
      { id: 'scifi', label: 'Science fiction' },
      { id: 'mystery', label: 'Mystery' },
      { id: 'action', label: 'Action' },
      { id: 'musical', label: 'Musical' },
      { id: 'nature', label: 'Animals and nature' },
      { id: 'thriller', label: 'Thriller', when: notForKids },
      { id: 'horror', label: 'Horror', when: notForKids },
      { id: 'documentary', label: 'Documentary style' },
      custom(),
    ],
    default: 'adventure',
    custom: { kind: 'text', placeholder: 'Your genre' },
  },
  {
    kind: 'choice',
    id: 'structure',
    title: 'Structure',
    options: [
      {
        id: 'three-acts',
        label: 'Three acts',
        note: 'Setup ¼, problem ½, ending ¼.',
      },
      {
        id: 'beats-15',
        label: '15 beats',
        note: 'Fifteen story beats, laid over three acts; beats are labels on scenes.',
      },
      {
        id: 'hero-12',
        label: 'Hero’s journey (12 steps)',
        note: 'Twelve steps, laid over three acts; steps are labels on scenes.',
      },
      {
        id: 'five-acts',
        label: 'Five acts',
        note: 'Five acts of about equal length.',
      },
      {
        id: 'free',
        label: 'Free (follow my script)',
        note: 'Your script’s own scenes, over three acts to start.',
      },
    ],
    default: 'three-acts',
  },
  {
    kind: 'choice',
    id: 'sceneLength',
    title: 'Scene length',
    options: [
      { id: 'auto', label: 'Auto from the script' },
      { id: '1', label: 'About 1 min', value: 1 },
      { id: '2', label: 'About 2 min', value: 2 },
      { id: '3', label: 'About 3 min', value: 3 },
    ],
    default: 'auto',
  },
  {
    kind: 'choice',
    id: 'dialogue',
    title: 'Dialogue',
    options: [
      { id: 'lots', label: 'Lots' },
      { id: 'some', label: 'Some' },
      { id: 'none', label: 'None (told in pictures)' },
    ],
    default: 'some',
  },
  {
    kind: 'choice',
    id: 'music',
    title: 'Music',
    options: [
      { id: 'score', label: 'Score' },
      { id: 'songs', label: 'Songs (musical)' },
      { id: 'none', label: 'None' },
    ],
    default: 'score',
  },
];

export const TYPE_QUESTIONS: Record<ProjectType, readonly Question[]> = {
  course: COURSE,
  story: STORY,
  movie: MOVIE,
};

// ---------- What you already have ----------

const has = (a: Answers, id: string) => list(a, 'have').includes(id);

export const HAVE_QUESTIONS: readonly Question[] = [
  {
    kind: 'switches',
    id: 'have',
    title: 'What you already have',
    options: [
      { id: 'story', label: 'Story or script' },
      { id: 'characters', label: 'Character sheets or pictures' },
      { id: 'background', label: 'Background people' },
      { id: 'places', label: 'Places and backgrounds' },
      { id: 'props', label: 'Materials and props' },
      { id: 'style', label: 'A style picture' },
    ],
    default: ['story'],
  },
  {
    kind: 'text',
    id: 'idea',
    title: 'Your idea',
    when: (a) => !has(a, 'story'),
    placeholder: (type) =>
      ({
        course: 'What the course story is about, in one line',
        story: 'What the story is about, in one line',
        movie: 'Your film in one line',
      })[type],
    note: 'The chatbot writes a story from this, which you can edit.',
  },
];

// ---------- Look and motion ----------

const hasPictures = (a: Answers) => has(a, 'characters') || has(a, 'style');

export const LOOK_QUESTIONS: readonly Question[] = [
  {
    kind: 'choice',
    id: 'animation',
    title: 'Animation type',
    options: ANIMATION_TYPES.map((t) => ({ id: t.id, label: t.label })),
    default: '3d',
  },
  {
    kind: 'choice',
    id: 'style',
    title: 'Style',
    options: (a) => [
      ...(hasPictures(a)
        ? [{ id: MATCH_MINE.id, label: MATCH_MINE.label }]
        : []),
      ...animationType(choice(a, 'animation')).styles.map((s) => ({
        id: s.id,
        label: s.label,
      })),
    ],
    default: (a) =>
      hasPictures(a)
        ? MATCH_MINE.id
        : animationType(choice(a, 'animation')).styles[0]!.id,
  },
  {
    kind: 'choice',
    id: 'motion',
    title: 'How it moves',
    options: [
      {
        id: 'full',
        label: 'Full motion',
        note: 'Every shot is a video clip made from a first and a last frame.',
      },
      {
        id: 'storybook',
        label: 'Storybook motion',
        note: 'Still pictures with a slow pan and zoom, plus narration. Image prompts only.',
      },
      {
        id: 'host',
        label: 'Talking host',
        note: 'A character talks to camera with lip-sync, in Kling, Veo or Flow.',
      },
      {
        id: 'mixed',
        label: 'Mixed',
        note: 'You pick per shot.',
      },
    ],
    default: (_a, type) => (type === 'course' ? 'mixed' : 'full'),
  },
  {
    kind: 'choice',
    id: 'shape',
    title: 'Screen shape',
    options: (_a, type) => [
      { id: '16:9', label: '16:9' },
      { id: '9:16', label: '9:16' },
      { id: 'both', label: 'Both (16:9 and 9:16)' },
      ...(type === 'movie'
        ? [
            {
              id: '21:9',
              label: '21:9 cinema',
              note: 'Midjourney, Gemini and Kling make it. For Veo, Flow and GPT, make 16:9 and crop.',
            },
          ]
        : []),
    ],
    default: 'both',
  },
  {
    kind: 'switches',
    id: 'imageModels',
    title: 'Image models',
    options: IMAGE_MODELS.map((m) => ({ id: m.id, label: m.name })),
    default: IMAGE_MODELS.map((m) => m.id),
    min: 1,
  },
  {
    kind: 'switches',
    id: 'videoTools',
    title: 'Video tools',
    when: (a) => choice(a, 'motion') !== 'storybook',
    options: VIDEO_TOOLS.map((t) => ({
      id: t.id,
      label: t.name,
      // no sound, so no talking host
      when: t.sound
        ? undefined
        : (a: Answers) => choice(a, 'motion') !== 'host',
    })),
    default: VIDEO_TOOLS.map((t) => t.id),
    min: 1,
  },
  {
    kind: 'choice',
    id: 'language',
    title: 'Narration language',
    options: TRANSLATE_LANGUAGES.map((l) => ({ id: l.code, label: l.name })),
    default: 'en',
  },
];

/** Every question a project of this type has, in screen order. */
export const allQuestions = (type: ProjectType): Question[] => [
  ...TYPE_QUESTIONS[type],
  ...HAVE_QUESTIONS,
  ...LOOK_QUESTIONS,
];

// ---------- reading answers ----------

export function choice(a: Answers, id: string): string {
  const value = a[id];
  return typeof value === 'string' ? value : '';
}

export function list(a: Answers, id: string): string[] {
  const value = a[id];
  return Array.isArray(value) ? value : [];
}

export function customOf(a: Answers, id: string): Answer | undefined {
  return a[customKey(id)];
}

export const optionsOf = (
  q: ChoiceQuestion,
  a: Answers,
  type: ProjectType,
): Option[] =>
  (typeof q.options === 'function'
    ? q.options(a, type)
    : [...q.options]
  ).filter((o) => !o.when || o.when(a, type));

export const switchOptionsOf = (
  q: SwitchesQuestion,
  a: Answers,
  type: ProjectType,
): Option[] => q.options.filter((o) => !o.when || o.when(a, type));

const defaultOf = (q: ChoiceQuestion, a: Answers, type: ProjectType) =>
  typeof q.default === 'function' ? q.default(a, type) : q.default;

export const visible = (q: Question, a: Answers, type: ProjectType) =>
  !q.when || q.when(a, type);

/**
 * The answers with every gap filled and every stale pick put right: a style
 * from another animation type, Horror once the audience is Kids, a missing
 * custom value. Runs in screen order, so a later default sees earlier picks.
 * With `before`, the answers just changed: turning on character sheets or a
 * style picture moves a style still on its type's first pick to Match my
 * pictures.
 */
export function settle(
  type: ProjectType,
  given: Answers,
  before?: Answers,
): Answers {
  const a: Answers = { ...given };
  if (before && !hasPictures(before) && hasPictures(a)) {
    const first = animationType(choice(a, 'animation')).styles[0]?.id;
    if (choice(a, 'style') === first) a.style = MATCH_MINE.id;
  }
  for (const q of allQuestions(type)) {
    if (q.kind === 'choice') {
      const ids = optionsOf(q, a, type).map((o) => o.id);
      if (!ids.includes(choice(a, q.id))) a[q.id] = defaultOf(q, a, type);
      if (q.custom && a[customKey(q.id)] === undefined)
        a[customKey(q.id)] = q.custom.kind === 'number' ? q.custom.default : '';
    } else if (q.kind === 'switches') {
      if (!Array.isArray(a[q.id])) a[q.id] = [...q.default];
    } else if (typeof a[q.id] !== 'string') {
      a[q.id] = '';
    }
  }
  return a;
}

export const defaultAnswers = (type: ProjectType): Answers => settle(type, {});

/** The number an option stands for, or the custom number typed in. */
function amount(q: ChoiceQuestion | undefined, a: Answers, type: ProjectType) {
  if (!q) return 0;
  const id = choice(a, q.id);
  if (id === CUSTOM) {
    const typed = Number(customOf(a, q.id));
    return Number.isFinite(typed) && typed > 0 ? typed : 0;
  }
  return optionsOf(q, a, type).find((o) => o.id === id)?.value ?? 0;
}

function question(type: ProjectType, id: string): ChoiceQuestion | undefined {
  const q = allQuestions(type).find((x) => x.id === id);
  return q?.kind === 'choice' ? q : undefined;
}

const read = (type: ProjectType, a: Answers, id: string) =>
  amount(question(type, id), a, type);

// ---------- the plan ----------

export interface PlanGroup {
  /** Module 1, Episode 2, Act 3; empty for a single story. */
  title: string;
  /** Setup, Problem… for acts. */
  subtitle?: string;
  parts: number;
  seconds: number;
}

export interface Plan {
  groups: PlanGroup[];
  parts: number;
  /** Running time. */
  seconds: number;
  /** The most a lesson or chapter may run; scenes have none. */
  partLimit?: number;
  /** Lessons that close a module: Recap or Quiz. */
  moduleEnd?: string;
}

/** Splits `total` into `count` near-equal whole shares, larger ones first. */
function spread(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  const extra = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Splits `total` by `shares` into whole numbers that add back up to it. */
function apportion(total: number, shares: readonly number[]): number[] {
  const raw = shares.map((s) => s * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((x, y) => x + y, 0);
  const order = raw
    .map((r, i) => ({ i, rest: r - Math.floor(r) }))
    .sort((x, y) => y.rest - x.rest);
  for (const { i } of order) {
    if (left <= 0) break;
    out[i]! += 1;
    left--;
  }
  return out;
}

const ACT_NAMES: Record<number, readonly string[]> = {
  3: ['Setup', 'Problem', 'Ending'],
  5: ['Setup', 'Rising action', 'Turning point', 'Falling action', 'Ending'],
};

export function planOf(type: ProjectType, a: Answers): Plan {
  if (type === 'course') {
    const seconds = read(type, a, 'courseLength') * 60;
    const lesson = read(type, a, 'lessonLength') || 60;
    const parts = Math.max(1, Math.ceil(seconds / lesson));
    const asked =
      choice(a, 'modules') === CUSTOM
        ? Math.round(Number(customOf(a, 'modules')) || 1)
        : Math.ceil(parts / 8);
    const count = Math.min(Math.max(1, asked), parts);
    const end = choice(a, 'moduleEnd');
    return {
      groups: spread(parts, count).map((n, i) => ({
        title: `Module ${i + 1}`,
        parts: n,
        seconds: n * lesson,
      })),
      parts,
      seconds,
      partLimit: lesson,
      moduleEnd:
        end === 'recap' ? 'Recap' : end === 'quiz' ? 'Quiz' : undefined,
    };
  }
  if (type === 'story') {
    const series = choice(a, 'storyFormat') === 'series';
    const episodes = series
      ? Math.max(1, Math.round(read(type, a, 'episodes')))
      : 1;
    const each = read(type, a, 'storyLength') * 60;
    const chapter = read(type, a, 'chapterLength') || 60;
    const perEpisode = Math.max(1, Math.ceil(each / chapter));
    return {
      groups: Array.from({ length: episodes }, (_, i) => ({
        title: series ? `Episode ${i + 1}` : '',
        parts: perEpisode,
        seconds: each,
      })),
      parts: perEpisode * episodes,
      seconds: each * episodes,
      partLimit: chapter,
    };
  }
  const length = read(type, a, 'movieLength');
  const seconds = Math.round(length * 60);
  const acts = choice(a, 'structure') === 'five-acts' ? 5 : 3;
  const shares = acts === 5 ? [0.2, 0.2, 0.2, 0.2, 0.2] : [0.25, 0.5, 0.25];
  const sceneMinutes =
    choice(a, 'sceneLength') === 'auto'
      ? Math.min(2, Math.max(0.5, length / 8))
      : read(type, a, 'sceneLength');
  const scenes = Math.max(acts, Math.round(length / sceneMinutes));
  const perAct = apportion(scenes, shares).map((n) => Math.max(1, n));
  return {
    groups: perAct.map((n, i) => ({
      title: `Act ${i + 1}`,
      subtitle: ACT_NAMES[acts]![i],
      parts: n,
      seconds: Math.round(seconds * shares[i]!),
    })),
    parts: perAct.reduce((x, y) => x + y, 0),
    seconds,
  };
}

export interface ShotCount {
  label: string;
  count: number;
}

/** Shots by video tool, or stills for Storybook motion. */
export function shotsOf(
  type: ProjectType,
  a: Answers,
  plan: Plan,
): ShotCount[] {
  if (choice(a, 'motion') === 'storybook')
    return [
      {
        label: `Stills (${STILL_SECONDS} s each)`,
        count: Math.ceil(plan.seconds / STILL_SECONDS),
      },
    ];
  const picked = new Set(list(a, 'videoTools'));
  const lookQ = LOOK_QUESTIONS.find((q) => q.id === 'videoTools');
  const offered =
    lookQ?.kind === 'switches'
      ? switchOptionsOf(lookQ, a, type).map((o) => o.id)
      : [];
  return VIDEO_TOOLS.filter(
    (t) => picked.has(t.id) && offered.includes(t.id),
  ).map((t) => ({
    label: `${t.name} (${t.clip} s clips)`,
    count: Math.ceil(plan.seconds / t.clip),
  }));
}

// ---------- parts ----------

export const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

/**
 * The parts for a new plan, keeping the old ones in order. Growing adds
 * empty parts at the end. Shrinking drops empty parts first, from the end;
 * `lost` lists parts with content it also had to drop, so the caller can ask.
 */
export function layoutParts(
  plan: Plan,
  old: readonly Part[],
  hasContent: (part: Part) => boolean,
): { parts: Part[]; lost: Part[] } {
  let parts = [...old];
  const lost: Part[] = [];
  if (parts.length < plan.parts) {
    while (parts.length < plan.parts) parts.push(blankPart(newId()));
  } else {
    let excess = parts.length - plan.parts;
    for (let i = parts.length - 1; i >= 0 && excess > 0; i--) {
      if (!hasContent(parts[i]!)) {
        parts.splice(i, 1);
        excess--;
      }
    }
    if (excess > 0) {
      lost.push(...parts.slice(parts.length - excess));
      parts = parts.slice(0, parts.length - excess);
    }
  }
  let index = 0;
  plan.groups.forEach((g, group) => {
    for (let n = 0; n < g.parts; n++, index++) {
      const part = parts[index];
      if (part && part.group !== group) parts[index] = { ...part, group };
    }
  });
  return { parts, lost };
}

// ---------- words ----------

/** 90 → "1 min 30 s", 5400 → "1 h 30 min". */
export function clock(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s} s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = s % 60;
  if (h) return m ? `${h} h ${m} min` : `${h} h`;
  return rest ? `${m} min ${rest} s` : `${m} min`;
}
