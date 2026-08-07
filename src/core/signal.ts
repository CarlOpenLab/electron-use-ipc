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
