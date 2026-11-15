/**
 * Story Studio's projects: kept in this browser (localStorage, guarded, so a
 * blocked store only means nothing survives a reload) and moved between
 * devices as a project file.
 */
import { tracked } from '@glimmer/tracking';
import {
  PROJECT_TYPES,
  layoutParts,
  newId,
  planOf,
  settle,
  typeInfo,
} from './project-types';
import {
  partHasContent,
  type Answers,
  type Part,
  type Project,
  type ProjectType,
} from './types';

const KEY = 'xsenze.story-studio';
const FILE_APP = 'xsenze-story-studio';
const FILE_VERSION = 1;

interface Saved {
  currentId?: string;
  projects: unknown[];
}

export const untitled = (type: ProjectType) =>
  `Untitled ${typeInfo(type).name.toLowerCase()}`;

/** A new project from the New project answers, its parts laid out. */
export function newProject(
  type: ProjectType,
  answers: Answers,
  title: string,
  story = '',
): Project {
  const settled = settle(type, answers);
  const now = Date.now();
  return {
    id: newId(),
    type,
    title: title.trim() || untitled(type),
    created: now,
    updated: now,
    answers: settled,
    parts: layoutParts(planOf(type, settled), [], partHasContent).parts,
    story,
  };
}

const isPart = (raw: unknown): raw is Part =>
  !!raw &&
  typeof raw === 'object' &&
  typeof (raw as Part).id === 'string' &&
  typeof (raw as Part).title === 'string';

/** A project from storage or a file, gaps filled; undefined if it is not one. */
export function revive(raw: unknown): Project | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const p = raw as Partial<Project>;
  const type = PROJECT_TYPES.find((t) => t.id === p.type)?.id;
  if (typeof p.id !== 'string' || !type) return undefined;
  const answers = settle(
    type,
    p.answers && typeof p.answers === 'object' ? p.answers : {},
  );
  const parts = (Array.isArray(p.parts) ? p.parts : [])
    .filter(isPart)
    .map((part) => ({
      id: part.id,
      group: Number.isInteger(part.group) ? part.group : 0,
      title: part.title,
    }));
  const plan = planOf(type, answers);
  const now = Date.now();
  return {
    id: p.id,
    type,
    title:
      typeof p.title === 'string' && p.title.trim() ? p.title : untitled(type),
    created: typeof p.created === 'number' ? p.created : now,
    updated: typeof p.updated === 'number' ? p.updated : now,
    answers,
    // grow a short list to the plan; never drop content while loading
    parts:
      parts.length < plan.parts
        ? layoutParts(plan, parts, partHasContent).parts
        : parts,
    story: typeof p.story === 'string' ? p.story : '',
  };
}

export class ProjectStore {
  @tracked projects: Project[] = [];
  @tracked currentId: string | undefined;
  /** False once the browser refused to keep the projects. */
  @tracked saves = true;

  constructor() {
    this.#load();
  }

  get current(): Project | undefined {
    return this.projects.find((p) => p.id === this.currentId);
  }

  /** Newest first. */
  get sorted(): Project[] {
    return [...this.projects].sort((a, b) => b.updated - a.updated);
  }

  find(id: string): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  #load() {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch {
      this.saves = false;
      return;
    }
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as Partial<Saved>;
      this.projects = (Array.isArray(saved.projects) ? saved.projects : [])
        .map(revive)
        .filter((p): p is Project => !!p);
      if (this.projects.some((p) => p.id === saved.currentId))
        this.currentId = saved.currentId;
    } catch {
      // a damaged store starts empty rather than breaking the tool
    }
  }

  #write() {
    try {
      const saved: Saved = {
        currentId: this.currentId,
        projects: this.projects,
      };
      localStorage.setItem(KEY, JSON.stringify(saved));
      this.saves = true;
    } catch {
      this.saves = false;
    }
  }

  /** Adds a project, or replaces the one with its id, and opens it. */
  add(project: Project) {
    this.projects = [
      project,
      ...this.projects.filter((p) => p.id !== project.id),
    ];
    this.currentId = project.id;
    this.#write();
  }

  /** Saves a changed project. */
  put(project: Project) {
    const next = { ...project, updated: Date.now() };
    this.projects = this.projects.map((p) => (p.id === next.id ? next : p));
    this.#write();
  }

  open(id: string) {
    this.currentId = id;
    this.#write();
  }

  remove(id: string) {
    this.projects = this.projects.filter((p) => p.id !== id);
    if (this.currentId === id) this.currentId = undefined;
    this.#write();
  }
}

// ---------- project files ----------

export function projectFileText(project: Project): string {
  return JSON.stringify(
    {
      app: FILE_APP,
      version: FILE_VERSION,
      saved: new Date().toISOString(),
      project,
    },
    null,
    2,
  );
}

export function projectFileName(project: Project): string {
  const stem = project.title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
  return `${stem || 'project'}.story.json`;
}

export type ReadResult = { project: Project } | { error: string };

/** The project in a project file's text, or why there is none. */
export function readProjectFile(text: string): ReadResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: 'This is not a Story Studio project file.' };
  }
  const file = data as { app?: unknown; version?: unknown; project?: unknown };
  if (!file || file.app !== FILE_APP)
    return { error: 'This is not a Story Studio project file.' };
  if (typeof file.version === 'number' && file.version > FILE_VERSION)
    return {
      error:
        'This file was saved by a newer Story Studio. Reload the page to update, then open it again.',
    };
  const project = revive(file.project);
  return project
    ? { project }
    : { error: 'This project file is damaged: it has no project in it.' };
}

/** The same project under a new id, so it sits beside the original. */
export function copyOf(project: Project, title: string): Project {
  return { ...project, id: newId(), title, updated: Date.now() };
}
