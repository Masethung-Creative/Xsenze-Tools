import { modifier } from 'ember-modifier';

/** Seconds before a held button repeats, between repeats, and between repeats after ten. */
export const repeatTiming = { delay: 0.4, interval: 0.09, fast: 0.04 } as const;

/**
 * Click handling for a button that repeats while held: a tap runs `fire`
 * once, holding runs it again and again. `repeats` false is a plain click.
 */
export default modifier(
  (
    button: HTMLButtonElement,
    [fire, repeats]: [() => void, boolean | undefined],
  ) => {
    let held = false;
    let didRepeat = false;
    let timer: number | undefined;

    const schedule = (seconds: number, count: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!held || button.disabled) return;
        didRepeat = true;
        fire();
        schedule(
          count < 10 ? repeatTiming.interval : repeatTiming.fast,
          count + 1,
        );
      }, seconds * 1000);
    };
    const hold = (event: PointerEvent) => {
      if (!repeats || event.button !== 0) return;
      held = true;
      didRepeat = false;
      schedule(repeatTiming.delay, 0);
    };
    const letGo = () => {
      held = false;
      window.clearTimeout(timer);
    };
    const click = () => {
      if (didRepeat) {
        didRepeat = false;
        return;
      }
      fire();
    };

    const ends = ['pointerup', 'pointerleave', 'pointercancel'] as const;
    button.addEventListener('pointerdown', hold);
    button.addEventListener('click', click);
    ends.forEach((type) => button.addEventListener(type, letGo));
    return () => {
      letGo();
      button.removeEventListener('pointerdown', hold);
      button.removeEventListener('click', click);
      ends.forEach((type) => button.removeEventListener(type, letGo));
    };
  },
);
