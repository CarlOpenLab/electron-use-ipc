// Consumer-side type smoke test: compiled against the BUILT package exports.
import { defineApi, defineEvent, defineInvoke, defineSendSync } from '@cc-heart/electron-use-ipc'
import { registerMain } from '@cc-heart/electron-use-ipc/main'
import { exposeBridge } from '@cc-heart/electron-use-ipc/preload'
import { useEvent, useInvoke } from '@cc-heart/electron-use-ipc/renderer'
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
    windowAware: (event, num) => `${event.sender.id} ${num}`
  }
})
main.emit(api.events['user:updated'], { id: '1', name: 'a' })

const { data, loading, call } = useInvoke(api.invoke.getUser)
call('1')
data.get()
loading.get()

const updated = useEvent(api.events['user:updated'])
updated.subscribe((u) => u?.name)

exposeBridge(api)

const s = signal(0)
s.set(1)

export { data }
