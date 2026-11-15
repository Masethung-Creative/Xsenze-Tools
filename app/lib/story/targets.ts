/**
 * The image models and video tools Story Studio writes prompts for. Facts
 * as of November 2026; check the official docs before relying on a new one.
 * Adding a tool is one entry here. (OpenAI Sora was removed: its app closed
 * on 26 April 2026 and its API on 24 September 2026.)
 */

export type Shape = '16:9' | '9:16' | '21:9';

export interface ImageModel {
  id: 'gemini' | 'gpt' | 'midjourney';
  name: string;
  /** Shapes it makes itself; others are made at 16:9 and cropped. */
  shapes: readonly Shape[];
}

export interface VideoTool {
  id: 'kling' | 'veo' | 'flow' | 'mj-video';
  name: string;
  /** Seconds a shot is planned at: what one clip comfortably covers. */
  clip: number;
  /** One line on clip length, for notes. */
  clipNote: string;
  /** Takes a last frame as well as a first. */
  lastFrame: boolean;
  /** Makes dialogue and sound, so it can do a talking host. */
  sound: boolean;
  shapes: readonly Shape[];
}

export const IMAGE_MODELS: readonly ImageModel[] = [
  { id: 'gemini', name: 'Gemini', shapes: ['16:9', '9:16', '21:9'] },
  { id: 'gpt', name: 'GPT', shapes: ['16:9', '9:16'] },
  { id: 'midjourney', name: 'Midjourney', shapes: ['16:9', '9:16', '21:9'] },
];

export const VIDEO_TOOLS: readonly VideoTool[] = [
  {
    id: 'kling',
    name: 'Kling',
    clip: 10,
    clipNote: '3–15 s in Kling 3.0, 3–30 s in Kling 4.0',
    lastFrame: true,
    sound: true,
    shapes: ['16:9', '9:16', '21:9'],
  },
  {
    id: 'veo',
    name: 'Google Veo',
    clip: 8,
    clipNote: '4–8 s in Veo 3.1',
    lastFrame: true,
    sound: true,
    shapes: ['16:9', '9:16'],
  },
  {
    id: 'flow',
    name: 'Google Flow',
    clip: 8,
    clipNote: '8 s clips (Veo 3.1), Extend for longer',
    lastFrame: true,
    sound: true,
    shapes: ['16:9', '9:16'],
  },
  {
    id: 'mj-video',
    name: 'Midjourney Video',
    clip: 5,
    clipNote: '5 s, extends 4 s at a time up to 21 s',
    lastFrame: true,
    sound: false,
    shapes: ['16:9', '9:16', '21:9'],
  },
];

/** Seconds a still is held in Storybook motion. */
export const STILL_SECONDS = 6;

export const imageModel = (id: string) => IMAGE_MODELS.find((m) => m.id === id);
export const videoTool = (id: string) => VIDEO_TOOLS.find((t) => t.id === id);
