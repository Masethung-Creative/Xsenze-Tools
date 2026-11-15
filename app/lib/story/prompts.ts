/**
 * Picture prompts for the bible: a style frame first, then a sheet for every
 * character, background group and prop, and an empty wide shot of every
 * place, written for each image model. Built fresh from the project every
 * time, so editing a look rewrites every prompt that uses it.
 *
 * Midjourney (from the user's prompt skills): parameters last, whole-number
 * --ar, --v 8.2 by default and --niji 7 for anime, --raw with a low --s for
 * consistency, never --q, and --oref (which only V7 takes) to keep a
 * character the same. Gemini and GPT: plain sentences that name each
 * attached picture and what must stay the same.
 */
import { MATCH_MINE, animationType } from './keywords';
import { choice, list } from './project-types';
import { imageModel, type ImageModel, type Shape } from './targets';
import type { Asset, Project, Reference } from './types';

export type ModelId = ImageModel['id'];
export type PictureKind =
  'style' | 'sheet' | 'portrait' | 'group' | 'place' | 'prop';

export interface PicturePrompt {
  key: string;
  kind: PictureKind;
  /** Character sheet, Hero portrait… */
  title: string;
  shape: Shape | '1:1';
  text: string;
  /** The file name to save the picture under. */
  saveAs: string;
  /** Files to attach in Gemini or GPT. */
  attach: string[];
  notes: string[];
}

export interface AssetPrompts {
  /** The asset's id, or "style" for the style frame. */
  id: string;
  name: string;
  /** Style frame, Character, Place… */
  what: string;
  have: boolean;
  ref: Reference;
  prompts: PicturePrompt[];
}

const WHAT: Record<Asset['kind'], string> = {
  character: 'Character',
  background: 'Background people',
  place: 'Place',
  prop: 'Prop',
};

const ORDER: readonly Asset['kind'][] = [
  'character',
  'background',
  'place',
  'prop',
];

/** The screen shapes the project asked for. */
export function shapesOf(project: Project): Shape[] {
  const shape = choice(project.answers, 'shape');
  if (shape === 'both') return ['16:9', '9:16'];
  if (shape === '9:16' || shape === '21:9') return [shape];
  return ['16:9'];
}

/** The image models the project asked for, in a stable order. */
export function modelsOf(project: Project): ModelId[] {
  const picked = list(project.answers, 'imageModels');
  return (['gemini', 'gpt', 'midjourney'] as const).filter((m) =>
    picked.includes(m),
  );
}

const tag = (shape: string) => shape.replace(':', 'x');

/** A name safe in a file name. */
const safe = (name: string) =>
  name
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'untitled';

/** What the pictures are for, with its article. */
const KIND_WORD = {
  course: 'a kids’ course',
  story: 'an animated story',
  movie: 'a film',
};

function forKids(project: Project): boolean {
  const a = project.answers;
  if (project.type === 'course') return choice(a, 'courseAge') !== 'adults';
  if (project.type === 'story') return choice(a, 'storyAge') !== 'teens';
  return ['kids', 'family'].includes(choice(a, 'audience'));
}

/** The chosen style's words, or undefined for Match my pictures. */
function styleWords(project: Project): string | undefined {
  const id = choice(project.answers, 'style');
  if (id === MATCH_MINE.id) return undefined;
  return animationType(choice(project.answers, 'animation')).styles.find(
    (s) => s.id === id,
  )?.words;
}

const usesStylePicture = (project: Project) =>
  choice(project.answers, 'style') === MATCH_MINE.id ||
  list(project.answers, 'have').includes('style');

const shapeWords: Record<string, string> = {
  '16:9': 'a wide 16:9 picture',
  '9:16': 'a tall 9:16 picture',
  '1:1': 'a square picture',
  '21:9': 'a very wide 21:9 picture',
};

interface Build {
  project: Project;
  model: ModelId;
  shape: Shape | '1:1';
}

/** The shape a model can actually make, and a note when it cannot. */
function madeShape(model: ModelId, shape: Shape | '1:1') {
  const can =
    shape === '1:1' || (imageModel(model)?.shapes ?? []).includes(shape);
  return can
    ? { shape, note: undefined }
    : {
        shape: '16:9' as const,
        note: `${imageModel(model)?.name ?? model} cannot make ${shape}: make 16:9 and crop it.`,
      };
}

function midjourney(
  b: Build,
  words: string,
  opts: { oref?: string; self?: boolean },
): { text: string; notes: string[] } {
  const notes: string[] = [];
  const style = styleWords(b.project);
  const anime = choice(b.project.answers, 'animation') === 'anime';
  const params = [`--ar ${b.shape}`];
  if (opts.oref) {
    params.push('--v 7');
    notes.push(
      'Uses --oref, which only works in V7, so this prompt runs on V7.',
    );
  } else params.push(anime ? '--niji 7' : '--v 8.2');
  params.push('--raw --s 50');
  const sref = opts.self ? '' : b.project.style.link.trim();
  if (sref) params.push(`--sref ${sref}`);
  else if (!opts.self && usesStylePicture(b.project)) {
    params.push('--sref <your style picture link>');
    notes.push(
      'Replace <your style picture link> with your style picture’s web link.',
    );
  }
  if (opts.oref) params.push(`--oref ${opts.oref} --ow 100`);
  params.push('--no text, letters, logo, watermark');
  const body = [words, style].filter(Boolean).join(', ');
  return { text: `${body} ${params.join(' ')}`, notes };
}

function plain(
  b: Build,
  lines: string[],
  attach: { file: string; why: string }[],
  self = false,
): { text: string; attach: string[]; notes: string[] } {
  const notes: string[] = [];
  const style = styleWords(b.project);
  // the style frame's own prompt does not attach itself
  const stylePicture = self ? '' : b.project.style.file.trim();
  const files = attach.filter((x) => x.file.trim());
  const out = [...lines];
  if (style && !usesStylePicture(b.project)) out.push(`Style: ${style}.`);
  if (stylePicture) {
    files.unshift({
      file: stylePicture,
      why: 'match its style exactly: drawing style, colours and light',
    });
  } else if (!self && usesStylePicture(b.project)) {
    out.push(
      'Style: match the attached style picture exactly: drawing style, colours and light.',
    );
    notes.push(
      'Attach your style picture, and add its file name on the Assets tab.',
    );
  }
  if (files.length)
    out.push(
      `Attached: ${files.map((x) => `"${x.file}" (${x.why})`).join('; ')}.`,
    );
  if (forKids(b.project)) out.push('It is for children, so keep it friendly.');
  out.push('No text, letters, labels or logos anywhere in the picture.');
  out.push(`Make ${shapeWords[b.shape]}.`);
  return { text: out.join('\n'), attach: files.map((x) => x.file), notes };
}

function prompt(
  b: Build,
  kind: PictureKind,
  title: string,
  saveAs: string,
  mj: { words: string; oref?: string },
  gg: { lines: string[]; attach: { file: string; why: string }[] },
): PicturePrompt {
  const made = madeShape(b.model, b.shape);
  const build = { ...b, shape: made.shape };
  const result =
    b.model === 'midjourney'
      ? {
          ...midjourney(build, mj.words, { ...mj, self: kind === 'style' }),
          attach: [] as string[],
        }
      : plain(build, gg.lines, gg.attach, kind === 'style');
  return {
    key: `${saveAs}-${b.model}`,
    kind,
    title,
    shape: made.shape,
    text: result.text,
    saveAs,
    attach: result.attach,
    notes: made.note ? [made.note, ...result.notes] : result.notes,
  };
}

function styleFrame(
  project: Project,
  model: ModelId,
  shape: Shape,
): PicturePrompt {
  const kind = KIND_WORD[project.type];
  const hero = project.assets.find((a) => a.kind === 'character');
  const place = project.assets.find((a) => a.kind === 'place');
  const scene = [
    hero ? `${hero.name}, ${hero.look}` : '',
    place ? `in ${place.name}, ${place.look}` : '',
  ]
    .filter(Boolean)
    .join(', ');
  const b: Build = { project, model, shape };
  return prompt(
    b,
    'style',
    'Style frame',
    `Style frame ${tag(shape)}.png`,
    {
      words: `key art for "${project.title}", ${scene || project.synopsis || 'the main character in the main place'}, warm inviting mood, rich detail`,
    },
    {
      lines: [
        `Create one key frame that sets the look of "${project.title}", ${kind}.`,
        scene
          ? `Show ${hero ? `${hero.name} (${hero.look})` : 'the main character'}${place ? ` in ${place.name} (${place.look})` : ''}.`
          : `Show ${project.synopsis || 'the main character in the main place'}.`,
        'Warm, inviting mood, rich detail.',
      ],
      attach: [],
    },
  );
}

function assetPrompts(
  project: Project,
  asset: Asset,
  model: ModelId,
  shape: Shape,
): PicturePrompt[] {
  const kind = KIND_WORD[project.type];
  const who = `${asset.name}${asset.role ? ` (${asset.role})` : ''}`;
  const look = asset.look || '(add a look on the Bible tab)';
  const stem = `${asset.id} ${safe(asset.name)}`;
  const sheet = { project, model, shape: '16:9' as const };
  if (asset.kind === 'character')
    return [
      prompt(
        sheet,
        'sheet',
        'Character sheet',
        `${stem} sheet.png`,
        {
          words: `character reference sheet of ${asset.name}, ${look}, full body turnaround: front view, side view and back view in a row, three head close-ups: happy, surprised, thinking, neutral standing pose, plain light grey background, even soft light`,
        },
        {
          lines: [
            `Create a character reference sheet for ${kind}.`,
            `Character: ${who}. Look: ${look}`,
            'Show the whole body from the front, the side and the back in a row, and three head close-ups: happy, surprised and thinking. Neutral standing pose, plain light grey background, even soft light.',
          ],
          attach: [],
        },
      ),
      prompt(
        { project, model, shape },
        'portrait',
        'Hero portrait',
        `${stem} portrait ${tag(shape)}.png`,
        {
          words: `${asset.name}, ${look}, waist-up portrait, friendly smile, looking at the camera, soft plain background`,
          oref: asset.link.trim() || undefined,
        },
        {
          lines: [
            `Create a waist-up portrait of ${who} for ${kind}.`,
            `Look: ${look}`,
            'Friendly smile, looking at the camera, soft plain background.',
            ...(asset.file.trim()
              ? [
                  'Keep the face, hair, outfit and colours exactly as in the character sheet.',
                ]
              : []),
          ],
          attach: [
            {
              file: asset.file,
              why: 'the character: keep them exactly the same',
            },
          ],
        },
      ),
    ];
  if (asset.kind === 'background')
    return [
      prompt(
        sheet,
        'group',
        'Group sheet',
        `${stem} sheet.png`,
        {
          words: `group reference sheet of ${asset.name}, ${look}, five people standing side by side, full body, front view, simple designs, plain light grey background, even soft light`,
        },
        {
          lines: [
            `Create a reference sheet of background people for ${kind}: ${who}.`,
            `Look: ${look}`,
            'Show five of them side by side, full body, from the front. Keep the designs simple so they stay in the background. Plain light grey background, even soft light.',
          ],
          attach: [],
        },
      ),
    ];
  if (asset.kind === 'place')
    return [
      prompt(
        { project, model, shape },
        'place',
        'Wide shot',
        `${stem} ${tag(shape)}.png`,
        {
          words: `wide establishing shot of ${asset.name}, ${look}, empty, no people, eye-level camera`,
        },
        {
          lines: [
            `Create a wide establishing shot of a place in ${kind}: ${who}.`,
            `Look: ${look}`,
            'No people in it. Eye-level camera.',
          ],
          attach: [],
        },
      ),
    ];
  return [
    prompt(
      { project, model, shape: '1:1' },
      'prop',
      'Prop sheet',
      `${stem} sheet.png`,
      {
        words: `prop reference sheet of ${asset.name}, ${look}, front view and three-quarter view side by side, plain light grey background, soft even light`,
      },
      {
        lines: [
          `Create a prop reference sheet for ${kind}: ${who}.`,
          `Look: ${look}`,
          'Show it from the front and from three-quarters, side by side, on a plain light grey background with soft, even light.',
        ],
        attach: [],
      },
    ),
  ];
}

/**
 * Every picture to make for one model and screen shape, style frame first.
 * Assets the user already has carry no prompts, only their reference.
 */
export function picturePrompts(
  project: Project,
  model: ModelId,
  shape: Shape,
): AssetPrompts[] {
  const out: AssetPrompts[] = [];
  const own = usesStylePicture(project);
  out.push({
    id: 'style',
    name: own ? 'Your style picture' : 'Style frame',
    what: 'Style',
    have: own,
    ref: project.style,
    prompts: own ? [] : [styleFrame(project, model, shape)],
  });
  const sorted = [...project.assets].sort(
    (a, b) =>
      ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) ||
      Number(a.id.slice(1)) - Number(b.id.slice(1)),
  );
  for (const asset of sorted)
    out.push({
      id: asset.id,
      name: asset.name,
      what: WHAT[asset.kind],
      have: asset.have,
      ref: { link: asset.link, file: asset.file },
      prompts: asset.have ? [] : assetPrompts(project, asset, model, shape),
    });
  return out;
}
