import { modifier } from 'ember-modifier';
import { audioContext } from 'xsenze-tools/lib/audio';
import { roundMs } from 'xsenze-tools/components/tools/media/trim-span';

/** Longest fade in seconds (iOS caps the sliders at 10 s). */
export const longestFade = 10;

/** The sliders' top: the cut's length, at most 10 s (iOS refresh). */
export const fadeLimit = (start: number, end: number) =>
  Math.max(0.01, Math.min(longestFade, roundMs(end - start)));

const unit = (value: number) => Math.min(Math.max(value, 0), 1);

/**
 * Gain the export gives the sample at `seconds`: applyFades' linear ramps,
 * multiplied where they overlap.
 */
export function gainAt(
  seconds: number,
  start: number,
  end: number,
  fadeIn: number,
  fadeOut: number,
): number {
  const rise = fadeIn > 0 ? unit((seconds - start) / fadeIn) : 1;
  const fall = fadeOut > 0 ? unit((end - seconds) / fadeOut) : 1;
  return rise * fall;
}

const curveSteps = 16;

/** Corners of the gain curve from in to out, sampled inside each ramp. */
export function envelope(
  start: number,
  end: number,
  fadeIn: number,
  fadeOut: number,
): [number, number][] {
  const times = new Set([start, end]);
  for (let step = 0; step <= curveSteps; step++) {
    const share = step / curveSteps;
    if (fadeIn > 0) times.add(start + fadeIn * share);
    if (fadeOut > 0) times.add(end - fadeOut * share);
  }
  return [...times]
    .filter((t) => t >= start && t <= end)
    .sort((a, b) => a - b)
    .map((t) => [t, gainAt(t, start, end, fadeIn, fadeOut)]);
}

/** A view `span` long round `seconds`, kept inside the file. */
export function centredOn(
  seconds: number,
  span: number,
  duration: number,
): [number, number] {
  const from = Math.min(
    Math.max(seconds - span / 2, 0),
    Math.max(0, duration - span),
  );
  return [from, Math.min(duration, from + span)];
}

/**
 * Routes a media element through a gain that follows `gain(currentTime)`
 * while it plays, so the preview has the export's fades.
 */
export const fadeGain = modifier(
  (media: HTMLMediaElement, [gain]: [(seconds: number) => number]) => {
    const context = audioContext();
    const node = context.createGain();
    const source = context.createMediaElementSource(media);
    source.connect(node).connect(context.destination);
    let frame = 0;
    const follow = () => {
      node.gain.setTargetAtTime(
        gain(media.currentTime),
        context.currentTime,
        0.005,
      );
      if (!media.paused) frame = requestAnimationFrame(follow);
    };
    const play = () => {
      void context.resume();
      cancelAnimationFrame(frame);
      node.gain.cancelScheduledValues(context.currentTime);
      node.gain.setValueAtTime(gain(media.currentTime), context.currentTime);
      follow();
    };
    media.addEventListener('play', play);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener('play', play);
      source.disconnect();
      node.disconnect();
    };
  },
);
