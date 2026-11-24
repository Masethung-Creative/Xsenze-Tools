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
  blankPart,
  partHasContent,
  type AiTool,
  type Answers,
  type Asset,
  type AssetKind,
  type Part,
  type Project,
  type ProjectType,
} from './types';

const KEY = 'xsenze.story-studio';
const FILE_APP = 'xsenze-story-studio';
const FILE_VERSION = 1;

/** What the file pickers and the drop area take: project files are JSON. */
export const PROJECT_FILE_ACCEPT = '.json,application/json';

interface Saved {
  currentId?: string;
  projects: unknown[];
}

export const untitled = (type: ProjectType) =>
  `Untitled ${typeInfo(type).name.toLowerCase()}`;

/** What a copy carries into its new project besides the shared answers. */
export type Carried = Partial<
  Pick<Project, 'story' | 'synopsis' | 'logline' | 'assets' | 'tools' | 'style'>
>;

/** A new project from the New project answers, its parts laid out. */
export function newProject(
  type: ProjectType,
  answers: Answers,
  title: string,
  carried: Carried = {},
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
    story: carried.story ?? '',
    synopsis: carried.synopsis ?? '',
    logline: carried.logline ?? '',
    assets: (carried.assets ?? []).map((a) => ({ ...a })),
    tools: (carried.tools ?? []).map((t) => ({ ...t })),
    style: { ...(carried.style ?? { link: '', file: '' }) },
    chat: {},
    filled: [],
  };
}

const str = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const KINDS: readonly AssetKind[] = [
  'character',
  'background',
  'place',
  'prop',
];

function revivePart(raw: unknown): Part | undefined {
  const r = record(raw);
  if (typeof r.id !== 'string') return undefined;
  return {
    ...blankPart(r.id, Number.isInteger(r.group) ? (r.group as number) : 0),
    title: str(r.title),
    summary: str(r.summary),
    goal: str(r.goal),
    tool: str(r.tool),
    task: str(r.task),
    recap: str(r.recap),
    quiz: str(r.quiz),
    beat: str(r.beat),
    cast: Array.isArray(r.cast)
      ? r.cast.filter((x): x is string => typeof x === 'string')
      : [],
  };
}

function reviveAsset(raw: unknown): Asset | undefined {
  const r = record(raw);
  const kind = KINDS.find((k) => k === r.kind);
  if (typeof r.id !== 'string' || !kind) return undefined;
  return {
    id: r.id,
    kind,
    name: str(r.name),
    role: str(r.role),
    look: str(r.look),
    have: r.have === true,
    link: str(r.link),
    file: str(r.file),
  };
}

function reviveTool(raw: unknown): AiTool | undefined {
  const r = record(raw);
  if (typeof r.id !== 'string') return undefined;
  return {
    id: r.id,
    name: str(r.name),
    does: str(r.does),
    use: str(r.use),
    age: str(r.age),
    safety: str(r.safety),
    by: str(r.by),
  };
}

const defined = <T>(x: T | undefined): x is T => x !== undefined;

/** A project from storage or a file, gaps filled; undefined if it is not one. */
export function revive(raw: unknown): Project | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const p = raw as Record<string, unknown>;
  const type = PROJECT_TYPES.find((t) => t.id === p.type)?.id;
  if (typeof p.id !== 'string' || !type) return undefined;
  const answers = settle(type, record(p.answers) as Answers);
  const parts = (Array.isArray(p.parts) ? p.parts : [])
    .map(revivePart)
    .filter(defined);
  const plan = planOf(type, answers);
  const now = Date.now();
  const style = record(p.style);
  const chat = Object.fromEntries(
    Object.entries(record(p.chat)).filter(
      (e): e is [string, string] => typeof e[1] === 'string',
    ),
  );
  return {
    id: p.id,
    type,
    title: str(p.title).trim() ? str(p.title) : untitled(type),
    created: typeof p.created === 'number' ? p.created : now,
    updated: typeof p.updated === 'number' ? p.updated : now,
    answers,
    // grow a short list to the plan; never drop content while loading
    parts:
      parts.length < plan.parts
        ? layoutParts(plan, parts, partHasContent).parts
        : parts,
    story: str(p.story),
    synopsis: str(p.synopsis),
    logline: str(p.logline),
    assets: (Array.isArray(p.assets) ? p.assets : [])
      .map(reviveAsset)
      .filter(defined),
    tools: (Array.isArray(p.tools) ? p.tools : [])
      .map(reviveTool)
      .filter(defined),
    style: { link: str(style.link), file: str(style.file) },
    chat,
    filled: Array.isArray(p.filled)
      ? p.filled.filter((x): x is string => typeof x === 'string')
      : [],
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
