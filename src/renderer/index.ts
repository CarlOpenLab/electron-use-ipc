import type {
  AnyArgs,
  Bridge,
  EventPayload,
  EventToken,
  InvokeArgs,
  InvokeReturn,
  InvokeToken,
} from '../core/types'
import { signal, type Signal } from '../core/signal'

export type { Signal }

/* global bridge declaration ------------------------------------------------ */
declare global {
  interface Window {
    api: Bridge
  }
}

/**
 * Invoke an IPC method imperatively (one-shot, no reactive state).
 * Fully typed from the token.
 */
export function invoke<A extends AnyArgs, R>(
  token: InvokeToken<A, R>,
  ...args: A
): Promise<R> {
  return window.api.invoke(token, ...args)
}

export interface UseInvokeResult<A extends AnyArgs, R> {
  data: Signal<R | undefined>
  error: Signal<unknown | undefined>
  loading: Signal<boolean>
  /** Re-run / run the method. Args are inferred from the token. */
  call: (...args: A) => Promise<R>
}

/**
 * Hook-style binding for a request/response IPC method.
 *
 * @example
 *   const { data, loading, call } = useInvoke(api.invoke.getUser)
 *   call('1')           // (id: string) => Promise<User>
 *   data.get()          // User | undefined
 *   data.subscribe(fn)  // framework-agnostic reactivity
 *
 * @param options.immediate  call immediately on creation with these args.
 */
export function useInvoke<A extends AnyArgs, R>(
  token: InvokeToken<A, R>,
  options?: { immediate?: A },
): UseInvokeResult<A, R> {
  const data = signal<R | undefined>(undefined)
  const error = signal<unknown | undefined>(undefined)
  const loading = signal(false)

  const call = async (...args: A): Promise<R> => {
    loading.set(true)
    error.set(undefined)
    try {
      const result = await window.api.invoke(token, ...args)
      data.set(result)
      return result
    } catch (e) {
      error.set(e)
      throw e
    } finally {
      loading.set(false)
    }
  }

  if (options?.immediate) void call(...options.immediate)

  return { data, error, loading, call }
}

/**
 * Hook-style subscription to a main -> renderer event.
 * Returns a signal that holds the latest payload.
 *
 * @example
 *   const userUpdated = useEvent(api.events['user:updated'])
 *   userUpdated.get()         // User | undefined
 *   userUpdated.subscribe(fn) // react on every push
 */
export function useEvent<P>(
  token: EventToken<P>,
): Signal<P | undefined> {
  const s = signal<P | undefined>(undefined)
  window.api.on(token, (payload) => s.set(payload))
  return s
}

/* helpers for adapter authors --------------------------------------------- */
export type { InvokeArgs, InvokeReturn, EventPayload }
