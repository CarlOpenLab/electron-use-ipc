// Negative test: each @ts-expect-error must be "used" (i.e. a real error occurs).
// If tsc passes, the types are BOTH correct (positive cases) AND strict
// (these bad cases really error). If an @ts-expect-error becomes unused,
// that line leaked `any`.
import { defineApi, defineSendSync } from '@cc-heart/electron-use-ipc'
import { registerMain } from '@cc-heart/electron-use-ipc/main'
import { invoke, sendSync, useEvent, useInvoke } from '@cc-heart/electron-use-ipc/renderer'
import { signal } from '@cc-heart/electron-use-ipc/core'
import { api } from './shared/api'

const { call } = useInvoke(api.invoke.getUser)
// @ts-expect-error number is not assignable to string
call(123)

const updated = useEvent(api.events['user:updated'])
// @ts-expect-error payload is User | undefined, not number
updated.subscribe((u: number) => {})

/* --- Regression guards: misspelled schema keys must not leak `any` -------
   `defineApi` once returned `S & ApiSchema`, whose Record<string, any> index
   signature made every one of the following compile. */
// @ts-expect-error typo: no such method in the schema
api.invoke.getUesr

// @ts-expect-error typo: no such event in the schema
api.events['user:update']

// @ts-expect-error a token is a descriptor, not a callable
api.invoke.getUser('1')

registerMain(api, {
  invoke: {
    // @ts-expect-error typo: handler name is not in the schema
    getUesr: async () => ({ id: 'x', name: 'y' }),
  },
})

/* --- sendSync must stay synchronous and typed --------------------------- */
const syncApi = defineApi({
  sendSync: { isDark: defineSendSync<[], boolean>() },
})
// @ts-expect-error isDark takes no arguments
sendSync(syncApi.sendSync.isDark, 'nope')
// @ts-expect-error a sendSync token cannot be used with invoke
invoke(syncApi.sendSync.isDark)
// @ts-expect-error sendSync handlers must not return a Promise
registerMain(syncApi, { sendSync: { isDark: async () => true } })

/* --- Signal<T> must be sound -------------------------------------------- */
const counter = signal(0)
const value: number = counter.get()
void value
// @ts-expect-error prev is number, not string
counter.set((p) => p.concat('x'))
