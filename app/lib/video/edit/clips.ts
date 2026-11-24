import { probeVideo } from 'xsenze-tools/lib/video/media-probe';
import { resolveDuration } from 'xsenze-tools/lib/video/video';
import { newId, type Clip } from 'xsenze-tools/lib/video/edit/timeline';

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
      kind: 'video',
      file,
      name: baseName(file.name),
      duration,
      width: video.videoWidth,
      height: video.videoHeight,
      fps: probe?.fps ?? 30,
      hasAudio: probe ? probe.audioTracks > 0 : true,
      url,
      frames: [],
      peaks: null,
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  } finally {
    video.removeAttribute('src');
    video.load();
  }
}

const AUDIO_NAME = /\.(mp3|m4a|wav|aac|flac|ogg|oga|opus|aiff|caf)$/i;
const VIDEO_NAME = /\.(mp4|m4v|mov|webm|mkv|avi)$/i;

/** What a dropped file is to Video Edit, by its type, else its name. */
export function mediaKind(file: File): 'video' | 'audio' | null {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (VIDEO_NAME.test(file.name)) return 'video';
  if (AUDIO_NAME.test(file.name)) return 'audio';
  return null;
}

/** Reads a sound file into a clip; a file the browser cannot play throws. */
export async function readAudioClip(file: File): Promise<Clip> {
  const url = URL.createObjectURL(file);
  const audio = document.createElement('audio');
  audio.preload = 'metadata';
  audio.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      audio.addEventListener('loadedmetadata', () => resolve(), {
        once: true,
      });
      audio.addEventListener('error', () => reject(new Error('unreadable')), {
        once: true,
      });
    });
    let duration = audio.duration;
    if (!Number.isFinite(duration)) {
      // some files only know their length once read to the end
      duration = await new Promise<number>((resolve) => {
        audio.addEventListener(
          'durationchange',
          () => resolve(audio.duration),
          {
            once: true,
          },
        );
        audio.currentTime = 1e101;
      });
    }
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('empty');
    return {
      id: newId('c'),
      kind: 'audio',
      file,
      name: baseName(file.name),
      duration,
      width: 0,
      height: 0,
      fps: 30,
      hasAudio: true,
      url,
      frames: [],
      peaks: null,
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  } finally {
    audio.removeAttribute('src');
    audio.load();
  }
}
