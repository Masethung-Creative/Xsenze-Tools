import type { ComponentLike } from '@glint/template';
import type { Tool } from 'xsenze-tools/lib/tools';

export type ToolComponent = ComponentLike<{ Args: { tool: Tool } }>;

type Loader = () => Promise<{ default: ToolComponent }>;

/**
 * Lazy loaders, one per tool id. Each tool's code (and heavy libraries such
 * as mediabunny) is split into its own chunk and only downloaded when the
 * tool is opened.
 */
const loaders: Record<string, Loader> = {
  'video-atlas': () => import('xsenze-tools/components/tools/video-atlas'),
  'video-trimmer': () => import('xsenze-tools/components/tools/video-trimmer'),
  'video-muter': () => import('xsenze-tools/components/tools/video-muter'),
  'audio-extractor': () =>
    import('xsenze-tools/components/tools/audio-extractor'),
  'audio-atlas': () => import('xsenze-tools/components/tools/audio-atlas'),
  'waveform-genny': () =>
    import('xsenze-tools/components/tools/waveform-genny'),
  'voice-recorder': () =>
    import('xsenze-tools/components/tools/voice-recorder'),
  'audio-normaliser': () =>
    import('xsenze-tools/components/tools/audio-normaliser'),
  'audio-trimmer': () => import('xsenze-tools/components/tools/audio-trimmer'),
};

export async function loadToolComponent(
  id: string,
): Promise<ToolComponent | undefined> {
  const load = loaders[id];
  return load ? (await load()).default : undefined;
}
