/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted.
 */
/** Press and release feel shared by every xz control (XzMotion). */
export const motion = {
  pressScale: 0.97,
  /** Sink in px at the edge of a square control of the same area. */
  tiltDepth: 11,
  maxTiltDegrees: 22,
  perspective: 600,
  pressMs: 80,
  releaseMs: 450,
  releaseDamping: 0.45,
  /** Tilt while held follows the pointer this fast. */
  followMs: 50,
} as const;

/**
 * Transform for a control pressed at (x, y) in its own box; no point presses
 * the centre with no lean. The edge under the pointer sinks.
 */
export function pressedTransform(
  width: number,
  height: number,
  point?: { x: number; y: number },
): string {
  const scale = `scale(${motion.pressScale})`;
  if (!point) return `perspective(${motion.perspective}px) ${scale}`;
  const halfW = Math.max(width / 2, 1);
  const halfH = Math.max(height / 2, 1);
  const clamp = (v: number) => Math.min(Math.max(v, -1), 1);
  const x = clamp((point.x - halfW) / halfW);
  const y = clamp((point.y - halfH) / halfH);
  const angle = Math.min(
    (motion.maxTiltDegrees * Math.PI) / 180,
    Math.asin(Math.min(1, motion.tiltDepth / Math.sqrt(halfW * halfH))),
  );
  return `perspective(${motion.perspective}px) rotateY(${round(x * angle)}rad) rotateX(${round(-y * angle)}rad) ${scale}`;
}

/**
 * A CSS linear() easing for a spring from rest that settles within the
 * animation's duration, as UIView's usingSpringWithDamping does.
 */
export function springEasing(damping: number, samples = 40): string {
  // ponytail: settle threshold 1 %, UIKit's exact constant is not published
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
  return `linear(${points.map(round).join(', ')})`;
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/** Travel in px before a sideways pan judges the direction, and how many times the sideways travel must exceed the vertical. */
export const sidewaysJudgement = { travel: 6, ratio: 2 } as const;

/** A tap that moves a XzImageCompare divider springs there. */
export const compareSpring = { ms: 450, damping: 0.7 } as const;

/** XzGlyphFlow: seconds for glyphs to settle. */
export const glyphSettleMs = 450;

/** XzGlyphFlow's settle curve: a damped spring with one overshoot, 0 to 1. */
export function glyphEased(progress: number): number {
  return progress >= 1
    ? 1
    : 1 - Math.exp(-7 * progress) * Math.cos(8 * progress);
}

/** A CSS linear() easing sampled from `curve` over 0 to 1. */
export function curveEasing(
  curve: (progress: number) => number,
  samples = 40,
): string {
  const points = Array.from({ length: samples + 1 }, (_, i) =>
    round(curve(i / samples)),
  );
  return `linear(${points.join(', ')})`;
}

/** XzDialog and XzSheet: in and out, the XzMathInput sheet's curves. */
export const dialogMotion = {
  inMs: 350,
  outMs: 250,
  inEasing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  outEasing: 'cubic-bezier(0.4, 0, 1, 1)',
  /** A centred dialog grows from this scale. */
  scale: 0.96,
} as const;

export function reducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** A popover, menu or tooltip fades and grows in from this scale when it opens; it closes at once. */
export const popover = { ms: 120, scale: 0.97 } as const;

/** Plays the opening of a popover on `panel`, unless motion is reduced. */
export function popIn(panel: HTMLElement) {
  if (reducedMotion()) return;
  panel.animate(
    [
      { opacity: 0, transform: `scale(${popover.scale})` },
      { opacity: 1, transform: 'none' },
    ],
    { duration: popover.ms, easing: 'ease-out' },
  );
}

/**
 * Captures the pointer for a drag and keeps a text selection from starting
 * until the press ends: WebKit selects the text a captured drag crosses and
 * scrolls to follow it. A pointer already gone, as a synthetic event's is,
 * makes Firefox throw, so it is not captured.
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
