/**
 * Adapter for React — the library returns framework-agnostic `Signal`s, so
 * binding them to a component tree is a handful of lines.
 *
 * Illustrative content for the landing page; not compiled.
 */
import { useSyncExternalStore } from 'react'
import type { Signal } from '@cc-heart/electron-use-ipc/core'
import { useInvoke, useEvent } from '@cc-heart/electron-use-ipc/renderer'
import { api } from './shared/api'

/** Subscribe a component to a signal. `subscribe` returns an unsubscribe fn. */
export function useSignalValue<T>(signal: Signal<T>): T {
  return useSyncExternalStore(
    (cb) => signal.subscribe(cb),
    () => signal.get(),
  )
}

export function UserCard({ id }: { id: string }) {
  const { data, loading, call } = useInvoke(api.invoke.getUser)
  const user = useSignalValue(data)

  // `call` is (id: string) => Promise<User> — inferred from the token.
  React.useEffect(() => {
    void call(id)
  }, [id])

  if (loading.get()) return <p>Loading…</p>
  return <p>{user?.name}</p>
}
