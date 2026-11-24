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
  'subtitle-translator': () =>
    import('xsenze-tools/components/tools/video/subtitle-translator'),
  'timecode-calc': () =>
    import('xsenze-tools/components/tools/video/timecode-calc'),
  'auto-subtitle': () =>
    import('xsenze-tools/components/tools/video/auto-subtitle'),
  'subtitle-studio': () =>
    import('xsenze-tools/components/tools/video/subtitle-studio'),
  'subtitle-converter': () =>
    import('xsenze-tools/components/tools/video/subtitle-converter'),
  'screen-recorder': () =>
    import('xsenze-tools/components/tools/video/screen-recorder'),
  'frame-extractor': () =>
    import('xsenze-tools/components/tools/video/frame-extractor'),
  'video-to-gif': () =>
    import('xsenze-tools/components/tools/video/video-to-gif'),
  'video-atlas': () =>
    import('xsenze-tools/components/tools/video/video-atlas'),
  'video-trimmer': () =>
    import('xsenze-tools/components/tools/video/video-trimmer'),
  'video-edit': () => import('xsenze-tools/components/tools/video/video-edit'),
  'video-muter': () =>
    import('xsenze-tools/components/tools/video/video-muter'),
  'video-compressor': () =>
    import('xsenze-tools/components/tools/video/video-compressor'),
  'image-compressor': () =>
    import('xsenze-tools/components/tools/image/image-compressor'),
  'audio-extractor': () =>
    import('xsenze-tools/components/tools/audio/audio-extractor'),
  'audio-atlas': () =>
    import('xsenze-tools/components/tools/audio/audio-atlas'),
  'waveform-genny': () =>
    import('xsenze-tools/components/tools/audio/waveform-genny'),
  'voice-recorder': () =>
    import('xsenze-tools/components/tools/audio/voice-recorder'),
  'audio-normaliser': () =>
    import('xsenze-tools/components/tools/audio/audio-normaliser'),
  'audio-trimmer': () =>
    import('xsenze-tools/components/tools/audio/audio-trimmer'),
};

export async function loadToolComponent(
  id: string,
): Promise<ToolComponent | undefined> {
  const load = loaders[id];
  return load ? (await load()).default : undefined;
}
