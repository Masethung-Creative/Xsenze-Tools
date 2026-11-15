/**
 * Story Studio's data: a project is a plan (the answers to the New project
 * questions), the parts that plan lays out, the story, and the story's
 * bible: every character, background group, place and prop that must look
 * the same in every picture, plus a course's free AI tools.
 */

export type ProjectType = 'course' | 'story' | 'movie';

/** An answer: an option id, several option ids, a number or free text. */
export type Answer = string | string[] | number;
export type Answers = Record<string, Answer>;

/** One lesson, chapter or scene. */
export interface Part {
  /** Stable across resizes, so later content keeps its part. */
  id: string;
  /** Which module, episode or act it sits in, from 0. */
  group: number;
  /** Typed by the user, or filled by the chatbot. */
  title: string;
  /** What happens, in a sentence or two. */
  summary: string;
  /** Course: what the lesson teaches. */
  goal: string;
  /** Course: the AI tool it shows, a T id. */
  tool: string;
  /** Course: the try-it task, recap line and quiz question. */
  task: string;
  recap: string;
  quiz: string;
  /** Movie: the story beat, such as Catalyst. */
  beat: string;
  /** Who and what is in it: C, B, P and M ids. */
  cast: string[];
}

export const blankPart = (id: string, group = 0): Part => ({
  id,
  group,
  title: '',
  summary: '',
  goal: '',
  tool: '',
  task: '',
  recap: '',
  quiz: '',
  beat: '',
  cast: [],
});

export type AssetKind = 'character' | 'background' | 'place' | 'prop';

/** Something that must look the same in every picture. */
export interface Asset {
  /** C1, B1, P1 or M1. */
  id: string;
  kind: AssetKind;
  name: string;
  /** Who or what it is in the story. */
  role: string;
  /** The fixed look, repeated word for word in every prompt. */
  look: string;
  /** I have a picture, rather than Make a prompt. */
  have: boolean;
  /** Its reference picture: a public link for Midjourney, a file name for Gemini and GPT. */
  link: string;
  file: string;
}

/** A free AI tool a course lesson shows. */
export interface AiTool {
  /** T1, T2… */
  id: string;
  name: string;
  /** What it does. */
  does: string;
  /** How a kid uses it in the lesson. */
  use: string;
  /** Its age limit, from its own terms. */
  age: string;
  /** A tip for parents and teachers. */
  safety: string;
  /** The character who shows it, a C id. */
  by: string;
}

/** A reference picture outside the bible: the style frame or style picture. */
export interface Reference {
  link: string;
  file: string;
}

export interface Project {
  id: string;
  type: ProjectType;
  title: string;
  /** ms since 1970 */
  created: number;
  updated: number;
  answers: Answers;
  parts: Part[];
  /** The pasted or chatbot-written story or script. */
  story: string;
  /** The story in a few sentences. */
  synopsis: string;
  /** Movie: the film in one line. */
  logline: string;
  assets: Asset[];
  tools: AiTool[];
  /** The style frame, or the user's own style picture. */
  style: Reference;
  /** Chatbot answers pasted in, by step, so they survive a reload. */
  chat: Record<string, string>;
  /** Steps whose answer filled the project. */
  filled: string[];
}

/** Does a part carry anything that would be lost by removing it? */
export const partHasContent = (part: Part): boolean =>
  [
    part.title,
    part.summary,
    part.goal,
    part.task,
    part.recap,
    part.quiz,
    part.beat,
  ].some((text) => text.trim() !== '') ||
  part.tool !== '' ||
  part.cast.length > 0;

/** The letter each kind's ids start with. */
export const ID_LETTER: Record<AssetKind, string> = {
  character: 'C',
  background: 'B',
  place: 'P',
  prop: 'M',
};
