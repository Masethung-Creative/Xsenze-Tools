/**
 * A CSS linear() easing for a spring from rest that settles within the
 * animation's duration, as UIView's usingSpringWithDamping does.
 */
export function springEasing(damping: number, samples = 40): string {
  const omega = Math.log(100) / damping;
  const damped = omega * Math.sqrt(1 - damping * damping);
  const points = Array.from({ length: samples + 1 }, (_, i) => {
    if (i === samples) return 1;
    const t = i / samples;
    const decay = Math.exp(-damping * omega * t);
    return (
      1 -
      decay *
        (Math.cos(damped * t) +
          ((damping * omega) / damped) * Math.sin(damped * t))
    );
  });
  return `linear(${points.map((v) => Math.round(v * 10000) / 10000).join(', ')})`;
}

/** Travel in px before a sideways pan judges the direction, and how many times the sideways travel must exceed the vertical. */
export const sidewaysJudgement = { travel: 6, ratio: 2 } as const;

/** A tap that moves an image compare divider springs there. */
export const compareSpring = { ms: 450, damping: 0.7 } as const;

/**
 * Captures the pointer for a drag and keeps a text selection from starting
 * until the press ends.
 */
export function capture(element: Element, pointerId: number): void {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // the pointer ended before the capture
  }
  const done = new AbortController();
  document.addEventListener('selectstart', (event) => event.preventDefault(), {
    signal: done.signal,
  });
  const release = (event: PointerEvent) => {
    if (event.pointerId === pointerId) done.abort();
  };
  for (const type of ['pointerup', 'pointercancel'] as const)
    window.addEventListener(type, release, {
      capture: true,
      signal: done.signal,
    });
}
