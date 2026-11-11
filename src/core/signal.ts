/** A tiny framework-agnostic reactive primitive (signal). */

export type Listener<T> = (value: T) => void

export interface Signal<T> {
  /** Read the current value. */
  get(): T
  /** Set a new value (or update via function). Notifies subscribers. */
  set(value: T | ((prev: T) => T)): void
  /** Subscribe to changes. Returns an unsubscribe function. */
  subscribe(listener: Listener<T>): () => void
}

/**
 * A signal always holds a `T`: `get()` returns exactly `T` and `subscribe`
 * receives exactly `T`. Signals that start empty are typed as
 * `Signal<T | undefined>` (see `useInvoke` and `useEvent`), so the "maybe
 * undefined" case is explicit in the type instead of being imposed on every
 * signal. This also keeps functional updates (`set(p => p + 1)`) usable.
 *
 * Note: if `T` is itself a function type, pass a wrapper to `set` since a
 * function value is interpreted as an updater.
 */
export function signal<T>(initial: T): Signal<T> {
  let value = initial
  const listeners = new Set<Listener<T>>()

  return {
    get: () => value,
    set(next) {
      const resolved =
        typeof next === 'function' ? (next as (p: T) => T)(value) : next
      if (Object.is(resolved, value)) return
      value = resolved
      for (const l of listeners) l(value)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
