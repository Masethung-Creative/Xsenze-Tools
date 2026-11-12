// Hooks for chaining tools into workflows. Xsenze has no workflows yet, so
// nothing captures output and the only pending input is a file handed over
// from the home omnibox.
import { takeFile } from 'xsenze-tools/lib/handoff';
import { matchesAccept } from 'xsenze-tools/modifiers/file-paste';

interface Flow {
  capturing: boolean;
  capture(file: File): void;
}

export const flowHooks: { current: Flow | null } = { current: null };

export const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;

export const capturing = () => flowHooks.current?.capturing ?? false;

export const passAlong = (label: string) =>
  capturing() ? 'Pass along' : label;

export const downloadIcon = () => (capturing() ? 'arrow-right' : 'download');

export function deliverPending(
  accept: string | undefined,
  handler: (file: File) => void,
): () => void {
  let live = true;
  const file = takeFile((f) => !accept || matchesAccept(f, accept));
  // after the tool has rendered, as a workflow hand-off would arrive
  if (file) {
    queueMicrotask(() => {
      if (live) handler(file);
    });
  }
  return () => {
    live = false;
  };
}
