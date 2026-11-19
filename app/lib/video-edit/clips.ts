import { probeVideo } from 'xsenze-tools/lib/media-probe';
import { resolveDuration } from 'xsenze-tools/lib/video';
import { newId, type Clip } from 'xsenze-tools/lib/video-edit/timeline';

const baseName = (name: string) => name.replace(/\.[^.]+$/, '') || name;

/**
 * Reads a video file into a clip: its length and picture size from a video
 * element, its frame rate and sound from mediabunny. A file the browser
 * cannot play throws.
 */
export async function readClip(file: File): Promise<Clip> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      video.addEventListener('loadedmetadata', () => resolve(), {
        once: true,
      });
      video.addEventListener('error', () => reject(new Error('unreadable')), {
        once: true,
      });
    });
    const duration = await resolveDuration(video);
    if (!video.videoWidth || !Number.isFinite(duration) || duration <= 0)
      throw new Error('no-video');
    const probe = await probeVideo(file);
    return {
      id: newId('c'),
      file,
      name: baseName(file.name),
      duration,
      width: video.videoWidth,
      height: video.videoHeight,
      fps: probe?.fps ?? 30,
      hasAudio: probe ? probe.audioTracks > 0 : true,
      url,
      frames: [],
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  } finally {
    video.removeAttribute('src');
    video.load();
  }
}
