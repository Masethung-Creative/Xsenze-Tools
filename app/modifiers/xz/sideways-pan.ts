import { modifier } from 'ember-modifier';
import { capture, sidewaysJudgement } from 'xsenze-tools/lib/xz/spring';

export interface PanHandlers {
  onBegin?: (event: PointerEvent) => void;
  onMove?: (event: PointerEvent) => void;
  onEnd?: (event: PointerEvent) => void;
}

/**
 * A sideways drag inside a scrolling page (XzSidewaysPan). The page keeps
 * vertical touch scrolling through `touch-action: pan-y`; a drag that is not
 * clearly sideways after a few px never begins.
 */
export default modifier(
  (element: HTMLElement, _: [], { onBegin, onMove, onEnd }: PanHandlers) => {
    let pointer: number | undefined;
    let origin = { x: 0, y: 0 };
    let began = false;

    const onDown = (event: PointerEvent) => {
      if (pointer !== undefined || event.button !== 0) return;
      pointer = event.pointerId;
      origin = { x: event.clientX, y: event.clientY };
      began = false;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      if (!began) {
        const across = Math.abs(event.clientX - origin.x);
        const down = Math.abs(event.clientY - origin.y);
        if (Math.max(across, down) < sidewaysJudgement.travel) return;
        if (across < down * sidewaysJudgement.ratio) {
          pointer = undefined;
          return;
        }
        began = true;
        capture(element, event.pointerId);
        onBegin?.(event);
      }
      onMove?.(event);
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      pointer = undefined;
      if (began) onEnd?.(event);
    };

    const previous = element.style.touchAction;
    element.style.touchAction = 'pan-y';
    element.addEventListener('pointerdown', onDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onUp);
    element.addEventListener('pointercancel', onUp);
    return () => {
      element.style.touchAction = previous;
      element.removeEventListener('pointerdown', onDown);
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', onUp);
      element.removeEventListener('pointercancel', onUp);
    };
  },
);
