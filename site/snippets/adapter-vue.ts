/**
 * Adapter for Vue — same signals, bound with `shallowRef`.
 *
 * Illustrative content for the landing page; not compiled.
 */
import { onScopeDispose, shallowRef, watchEffect } from 'vue'
import type { Signal } from '@cc-heart/electron-use-ipc/core'
import { useEvent, useInvoke } from '@cc-heart/electron-use-ipc/renderer'
import { api } from './shared/api'

/** Turn a signal into a Vue ref that stays in sync. */
export function useSignalRef<T>(signal: Signal<T>) {
  const value = shallowRef(signal.get())
  const unsubscribe = signal.subscribe((next) => {
    value.value = next
  })
  onScopeDispose(unsubscribe)
  return value
}

export function useUser(id: string) {
  const { data, loading, call } = useInvoke(api.invoke.getUser)
  // `call` is (id: string) => Promise<User> — inferred from the token.
  watchEffect(() => void call(id))

  const user = useSignalRef(data)
  const updated = useEvent(api.events['user:updated'])

  return { user, updated, loading: useSignalRef(loading) }
}
