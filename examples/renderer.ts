import { useEvent, useInvoke } from '../src/renderer'
import { api } from './shared/api'

/* ---- request / response hook ---- */
const { data, loading, call } = useInvoke(api.invoke.getUser)
//    call: (id: string) => Promise<User>     ✅ inferred
//    data: Signal<User | undefined>          ✅ inferred

call('1').then(() => {
  const u = data.get() // User | undefined
  console.log(u?.name)
})

data.subscribe((u) => {
  // u: User | undefined
})

/* ---- immediate call (args still typed) ---- */
const list = useInvoke(api.invoke.listUsers, { immediate: [] })
//    list.data: Signal<User[] | undefined>

/* ---- event hook ---- */
const updated = useEvent(api.events['user:updated'])
//    updated: Signal<User | undefined>       ✅ inferred

updated.subscribe((u) => {
  if (u) console.log('updated:', u.name)
})

/* ---- compile-time type checks (uncomment to see errors) ---- */
// call(123)                              // ❌ Argument of type 'number'...
// main.emit(api.events['user:updated'])  // ❌ void-typed event still works, but
//   // a non-void event without payload errors. (void events allow no-arg emit)
// updated.subscribe((u: number) => {})   // ❌ u is User | undefined
