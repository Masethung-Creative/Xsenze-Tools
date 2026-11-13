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
        id: 'audio-atlas',
        name: 'Audio Atlas',
        description: 'Everything about one audio file, on one page',
        icon: 'file-music',
        accepts: AUDIO_ACCEPT,
        keywords: [
          'info',
          'metadata',
          'spectrogram',
          'loudness',
          'tags',
          'inspect',
        ],
      },
      {
        id: 'audio-extractor',
        name: 'Audio Extractor',
        description: 'Extract the audio out of a video file',
        icon: 'music',
        accepts: VIDEO_ACCEPT,
        produces: ['audio/wav', 'audio/mp4', 'audio/ogg', 'audio/flac'],
        keywords: ['extract', 'rip', 'soundtrack', 'mp4', 'video', 'audio'],
      },
      {
        id: 'frame-extractor',
        name: 'Frame Extractor',
        description: 'Grab stills and contact sheets from video',
        icon: 'image-down',
        accepts: VIDEO_ACCEPT,
        produces: ['image/png', 'application/zip'],
        keywords: [
          'frame',
          'still',
          'screenshot',
          'thumbnail',
          'contact sheet',
          'png',
        ],
      },
      {
        id: 'audio-normaliser',
        name: 'Audio Normaliser',
        description: 'Normalise audio loudness',
        icon: 'audio-lines',
        accepts: AUDIO_ACCEPT,
        produces: ['audio/wav'],
        keywords: ['loudness', 'lufs', 'volume', 'level', 'gain', 'podcast'],
      },
      {
        id: 'audio-trimmer',
        name: 'Audio Trimmer',
        description: 'Cut and fade audio, export as WAV',
        icon: 'scissors',
        accepts: AUDIO_ACCEPT,
        produces: ['audio/wav'],
        keywords: ['cut', 'clip', 'fade', 'trim', 'mp3', 'wav'],
      },
      {
        id: 'screen-recorder',
        name: 'Screen Recorder',
        description:
          'Record your screen with optional tab audio (supported browsers only) and microphone audio',
        icon: 'monitor-up',
        produces: ['video/webm'],
        keywords: [
          'screen',
          'capture',
          'record',
          'screencast',
          'tutorial',
          'demo',
        ],
      },
      {
        id: 'subtitle-converter',
        name: 'Subtitle Converter',
        description: 'Convert, shift and rescale SRT and VTT subtitles',
        icon: 'captions',
        accepts: SUBTITLE_ACCEPT,
        produces: ['.srt', '.vtt'],
        keywords: [
          'srt',
          'vtt',
          'captions',
          'subtitles',
          'sync',
          'offset',
          'frame rate',
        ],
      },
      {
        id: 'subtitle-studio',
        name: 'Subtitle Studio',
        description: 'Burn subtitles to video',
        icon: 'subtitles',
        accepts: [...VIDEO_ACCEPT, ...SUBTITLE_ACCEPT],
        produces: ['video/mp4', 'video/webm'],
        keywords: [
          'burn',
          'hardcode',
          'captions',
          'subtitles',
          'srt',
          'open captions',
        ],
      },
      {
        id: 'video-atlas',
        name: 'Video Atlas',
        description: 'Everything about one video file',
        icon: 'clapperboard',
        accepts: VIDEO_ACCEPT,
        keywords: [
          'info',
          'metadata',
          'codec',
          'resolution',
          'inspect',
          'video',
        ],
      },
      {
        id: 'video-muter',
        name: 'Video Muter',
        description: 'Strip the audio from a video',
        icon: 'volume-x',
        accepts: VIDEO_ACCEPT,
        produces: ['video/mp4', 'video/webm'],
        keywords: ['mute', 'silent', 'remove audio', 'no sound', 'video'],
      },
      {
        id: 'video-trimmer',
        name: 'Video Trimmer',
        description: 'Cut a video in/out style',
        icon: 'film',
        accepts: VIDEO_ACCEPT,
        produces: ['video/mp4', 'video/webm'],
        keywords: ['cut', 'clip', 'trim', 'shorten', 'video', 'mp4'],
      },
      {
        id: 'video-to-gif',
        name: 'Video to GIF',
        description: 'Turn video clips into looping GIFs',
        icon: 'image-play',
        accepts: VIDEO_ACCEPT,
        produces: ['image/gif'],
        keywords: ['gif', 'animation', 'loop', 'meme', 'convert', 'video'],
      },
      {
        id: 'voice-recorder',
        name: 'Voice Recorder',
        description: 'Record voice memos in the browser',
        icon: 'mic',
        produces: ['audio/webm'],
        keywords: [
          'record',
          'microphone',
          'mic',
          'memo',
          'voice',
          'dictaphone',
        ],
      },
      {
        id: 'waveform-genny',
        name: 'Waveform Generator',
        description: 'Render audio waveforms as PNG or SVG',
        icon: 'audio-waveform',
        accepts: AUDIO_ACCEPT,
        produces: ['image/png', 'image/svg+xml'],
        keywords: ['waveform', 'image', 'png', 'svg', 'visual', 'soundwave'],
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
