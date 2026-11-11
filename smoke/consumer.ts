// Consumer-side type smoke test: compiled against the BUILT package exports.
import { defineApi, defineEvent, defineInvoke, defineSendSync } from '@cc-heart/electron-use-ipc'
import { registerMain } from '@cc-heart/electron-use-ipc/main'
import { exposeBridge } from '@cc-heart/electron-use-ipc/preload'
import { invoke, sendSync, useEvent, useInvoke } from '@cc-heart/electron-use-ipc/renderer'
import { signal } from '@cc-heart/electron-use-ipc/core'

interface User { id: string; name: string }

const api = defineApi({
  invoke: {
    getUser: defineInvoke<[string], User>(),
    getUserForWindow: defineInvoke<[string], User>(),
  },
  sendSync: {
    windowAware: defineSendSync<[number], string>(),
  },
  events: {
    'user:updated': defineEvent<User>(),
  },
})

const main = registerMain(api, {
  invoke: {
    getUser: async (id) => ({ id, name: id }),
  },
  invokeWithSenderId: {
    getUserForWindow: async (windowId, userId) => ({ id: userId, name: `User ${userId} in window ${windowId}` }),
  },
  sendSyncWithEvent: {
    windowAware: (event, num) => `${event.sender.id} ${num}`,
  },
})
main.emit(api.events['user:updated'], { id: '1', name: 'a' })

const { data, loading, call } = useInvoke(api.invoke.getUser)
call('1')
data.get()
// `get()` is exactly boolean, not boolean | undefined
const isLoading: boolean = loading.get()
void isLoading

const updated = useEvent(api.events['user:updated'])
updated.subscribe((u) => u?.name)

// Typed one-shot calls
const one: Promise<User> = invoke(api.invoke.getUser, '1')
const two: string = sendSync(api.sendSync.windowAware, 1)
void one
void two

// The raw bridge keeps the declared return type: the error envelope is an
// internal transport detail and must not leak into the public window.api type.
const direct: string = window.api.sendSync(api.sendSync.windowAware, 1)
void direct

exposeBridge(api)

const s = signal(0)
s.set(1)
s.set((prev) => prev + 1)
const n: number = s.get()
void n

export { data }
