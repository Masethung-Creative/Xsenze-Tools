/**
 * Story Studio's data: a project is a plan (the answers to the New project
 * questions) and the parts that plan lays out. Later phases add the story,
 * its characters, places, props and shots.
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
  /** Typed by the user, or filled by the chatbot later. */
  title: string;
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
  /** The pasted story or script. */
  story: string;
}

/** Does a part carry anything that would be lost by removing it? */
export const partHasContent = (part: Part): boolean => part.title.trim() !== '';
