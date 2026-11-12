import type { IconName } from 'xsenze-tools/lib/icons';

/**
 * The tool registry: the single source of truth for every category and tool.
 * The sidebar, the home page grid, search and the /tools/:tool_id route all
 * read from here. To add a tool:
 *   1. add an entry to its category below
 *   2. create app/components/tools/<id>.gts
 *   3. register its loader in app/lib/tool-components.ts
 */

// iOS Safari needs explicit extensions alongside the mime wildcard
export const AUDIO_ACCEPT = [
  'audio/*',
  '.mp3',
  '.m4a',
  '.wav',
  '.aac',
  '.flac',
  '.ogg',
  '.oga',
  '.opus',
  '.aiff',
  '.caf',
] as const;

export const VIDEO_ACCEPT = [
  'video/*',
  '.mp4',
  '.m4v',
  '.mov',
  '.webm',
  '.mkv',
  '.avi',
] as const;

export const SUBTITLE_ACCEPT = ['.srt', '.vtt'] as const;

export const acceptAttr = (list: readonly string[]): string => list.join(',');

export interface Tool {
  /** URL slug: /tools/<id>. Also the component file name. */
  id: string;
  name: string;
  /** One line, shown in the sidebar tooltip and the home grid. */
  description: string;
  icon: IconName;
  beta?: boolean;
  /** Input types the tool takes (mime types or extensions). */
  accepts?: readonly string[];
  /** Output types the tool makes. */
  produces?: readonly string[];
  /** Extra words that should match in search. */
  keywords?: string[];
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: IconName;
  description: string;
  tools: Tool[];
}

export const toolCategories: ToolCategory[] = [
  {
    id: 'audio-video',
    name: 'Audio & Video',
    icon: 'audio-waveform',
    description:
      'Record, trim, convert and inspect audio and video in your browser.',
    tools: [
      {
        id: 'audio-trimmer',
        name: 'Audio Trimmer',
        description: 'Cut and fade audio, export as WAV',
        icon: 'scissors',
        accepts: AUDIO_ACCEPT,
        produces: ['audio/wav'],
        keywords: ['cut', 'clip', 'fade', 'trim', 'mp3', 'wav'],
      },
    ],
  },
];

export const allTools: Tool[] = toolCategories.flatMap((c) => c.tools);

export function findTool(id: string): Tool | undefined {
  return allTools.find((t) => t.id === id);
}

export function categoryOf(id: string): ToolCategory | undefined {
  return toolCategories.find((c) => c.tools.some((t) => t.id === id));
}

/** Does this tool's `accepts` list cover the file (by mime wildcard, mime or extension)? */
export function toolAcceptsFile(tool: Tool, file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
  return (tool.accepts ?? []).some((a) => {
    const rule = a.toLowerCase();
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return rule.startsWith('.') ? rule === ext : rule === type;
  });
}

export function toolsForFile(file: File): Tool[] {
  return allTools.filter((t) => toolAcceptsFile(t, file));
}

export function toolMatches(tool: Tool, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [tool.name, tool.description, ...(tool.keywords ?? [])].some((s) =>
    s.toLowerCase().includes(q),
  );
}
