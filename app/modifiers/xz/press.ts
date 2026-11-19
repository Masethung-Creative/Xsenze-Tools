/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby
 * Morgan Voigt): the press modifier.
 */
import { modifier } from 'ember-modifier';
import {
  motion,
  pressedTransform,
  reducedMotion,
  springEasing,
} from 'xsenze-tools/lib/xz/motion';

const release = springEasing(motion.releaseDamping);

/**
 * Tilts the element under the pointer while pressed and springs it back on
 * release. Does nothing for a disabled element or with reduced motion.
 */
export default modifier((element: HTMLElement) => {
  let down = false;
  let settle: number | undefined;

  const disabled = () =>
    element.matches(
      ':disabled, [aria-disabled="true"], :has(> input:disabled)',
    );
  const pointIn = (event: PointerEvent) => {
    const box = element.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };
  const pose = (point: { x: number; y: number } | undefined, ms: number) => {
    element.style.transition = `transform ${ms}ms ease-out`;
    element.style.transform = pressedTransform(
      element.offsetWidth,
      element.offsetHeight,
      point,
    );
  };

  const onDown = (event: PointerEvent) => {
    if (disabled() || reducedMotion() || event.button !== 0) return;
    window.clearTimeout(settle);
    down = true;
    pose(pointIn(event), motion.pressMs);
  };
  const onMove = (event: PointerEvent) => {
    if (!down) return;
    pose(pointIn(event), motion.followMs);
  };
  // a fast tap reaches the pose before the spring
  const onUp = (event: PointerEvent) => {
    if (!down) return;
    down = false;
    pose(
      event.type === 'pointerup' ? pointIn(event) : undefined,
      motion.pressMs,
    );
    settle = window.setTimeout(() => {
      element.style.transition = `transform ${motion.releaseMs}ms ${release}`;
      element.style.transform = '';
    }, motion.pressMs);
  };

  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerup', onUp);
  element.addEventListener('pointercancel', onUp);
  element.addEventListener('pointerleave', onUp);
  return () => {
    window.clearTimeout(settle);
    element.removeEventListener('pointerdown', onDown);
    element.removeEventListener('pointermove', onMove);
    element.removeEventListener('pointerup', onUp);
    element.removeEventListener('pointercancel', onUp);
    element.removeEventListener('pointerleave', onUp);
  };
});
