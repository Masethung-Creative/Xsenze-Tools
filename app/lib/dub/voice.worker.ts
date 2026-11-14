/// <reference lib="webworker" />
/**
 * The voice engines in a worker, so speaking never freezes the page.
 * In:  { type: 'speak', id, engine, lang, text, voice, speed, clone? }
 * Out: { type: 'progress', id, ratio } while an engine's model downloads,
 *      { type: 'progress', id, ratio, phase: 'speak' } through a slow line
 *      { type: 'result', id, audio, rate } | { type: 'error', id, message }
 */
import type { EngineId, Preset } from 'xsenze-tools/lib/dub/engines';
import { speakSupertonic } from 'xsenze-tools/lib/dub/supertonic';
import { speakChatterbox } from 'xsenze-tools/lib/dub/chatterbox';
import { speakParler } from 'xsenze-tools/lib/dub/parler';
import type { CloneRef } from 'xsenze-tools/lib/dub/voice';

type Incoming = {
  type: 'speak';
  id: number;
  engine: EngineId;
  lang: string;
  text: string;
  voice: Preset;
  speed: number;
  clone?: CloneRef;
};

async function speak(
  message: Incoming,
): Promise<{ audio: Float32Array; rate: number }> {
  const onProgress = (ratio: number) =>
    postMessage({ type: 'progress', id: message.id, ratio });
  const onSpeaking = (ratio: number) =>
    postMessage({ type: 'progress', id: message.id, ratio, phase: 'speak' });
  if (message.engine === 'parler')
    return speakParler(
      message.text,
      message.lang,
      message.voice,
      onProgress,
      onSpeaking,
    );
  if (message.engine === 'supertonic')
    return speakSupertonic(
      message.text,
      message.lang,
      message.voice,
      message.speed,
      onProgress,
    );
  if (!message.clone) throw new Error('Chatterbox needs a voice to clone');
  return speakChatterbox(
    message.text,
    message.lang,
    message.clone.key,
    message.clone.audio,
    onProgress,
    onSpeaking,
  );
}

addEventListener('message', (event: MessageEvent<Incoming>) => {
  const message = event.data;
  speak(message).then(
    ({ audio, rate }) => {
      // a copy owns its buffer, so it can be transferred
      const owned = audio.slice();
      postMessage({ type: 'result', id: message.id, audio: owned, rate }, [
        owned.buffer,
      ]);
    },
    (error: unknown) =>
      postMessage({
        type: 'error',
        id: message.id,
        message: error instanceof Error ? error.message : String(error),
      }),
  );
});
