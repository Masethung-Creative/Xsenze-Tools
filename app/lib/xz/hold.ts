import { tracked } from '@glimmer/tracking';

/**
 * A control's own pick, for a consumer that does not feed it back: it shows
 * until one of the args it was made over changes, to any value, so an undo
 * back to the replaced value shows that value and the same pick sends again.
 */
export class Hold<T> {
  @tracked current?: { value: T };
  #basis: unknown[] = [];
  #dropped?: { value: T };

  /** The pick, unless an arg in `basis` changed since the last read. */
  read(...basis: unknown[]): T | undefined {
    const { current } = this;
    if (
      basis.length !== this.#basis.length ||
      basis.some((value, index) => value !== this.#basis[index])
    ) {
      this.#basis = basis;
      this.#dropped = current;
    }
    return current && current !== this.#dropped ? current.value : undefined;
  }

  set(value: T) {
    this.current = { value };
  }
}
