// Consumer-side type smoke test: compiled against the BUILT package exports.
import { defineApi, defineEvent, defineInvoke } from '@cc-heart/electron-use-ipc'
import { registerMain } from '@cc-heart/electron-use-ipc/main'
import { exposeBridge } from '@cc-heart/electron-use-ipc/preload'
import { useEvent, useInvoke } from '@cc-heart/electron-use-ipc/renderer'
import { signal } from '@cc-heart/electron-use-ipc/core'

interface User { id: string; name: string }

const api = defineApi({
  invoke: {
    getUser: defineInvoke<[string], User>(),
  },
  events: {
    'user:updated': defineEvent<User>(),
  },
})

const main = registerMain(api, {
  invoke: {
    getUser: async (id) => ({ id, name: id }),
  },
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
