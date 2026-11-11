import { test } from 'node:test'
import assert from 'node:assert/strict'

import { defineApi, defineEvent, defineInvoke, defineSendSync } from '../src/index'
import { registerMain } from '../src/main/index'
import { exposeBridge } from '../src/preload/index'
import { invoke, sendSync, useEvent, useInvoke } from '../src/renderer/index'
import { signal } from '../src/core/index'
import { __reset, __makeWindow, sent, nativeTheme } from 'electron'

interface User { id: string; name: string }

function makeApi() {
  return defineApi({
    invoke: {
      getUser: defineInvoke<[string], User>(),
      withEvent: defineInvoke<[number], number>(),
      withSender: defineInvoke<[number], number>(),
    },
    sendSync: {
      isDark: defineSendSync<[], boolean>(),
      syncEvent: defineSendSync<[number], number>(),
      syncSender: defineSendSync<[number], number>(),
      boom: defineSendSync<[], string>(),
      duplicate: defineSendSync<[], string>(),
    },
    events: {
      'user:updated': defineEvent<User>(),
      shutdown: defineEvent<void>(),
    },
  })
}

function makeApiWithUnhandled() {
  return defineApi({
    sendSync: {
      handled: defineSendSync<[], string>(),
      unhandled: defineSendSync<[], string>(),
    },
  })
}

function allHandlers() {
  return {
    invoke: {
      getUser: async (id: string) => ({ id, name: id }),
    },
    invokeWithEvent: {
      withEvent: async (event: any, n: number) => event.sender.id + n,
    },
    invokeWithSenderId: {
      withSender: async (senderId: number, n: number) => senderId + n,
    },
    sendSync: {
      isDark: () => nativeTheme.shouldUseDarkColors,
      boom: () => { throw new Error('kaboom') },
      duplicate: () => 'first',
    },
    sendSyncWithEvent: {
      syncEvent: (event: any, n: number) => event.sender.id + n,
    },
    sendSyncWithSenderId: {
      syncSender: (senderId: number, n: number) => senderId + n,
    },
  }
}

test('defineApi fills omitted groups and stamps channel paths', () => {
  __reset()
  const api = defineApi({ invoke: { a: defineInvoke<[], void>() } })
  assert.deepEqual(api.sendSync, {})
  assert.deepEqual(api.events, {})
  assert.equal((api.invoke.a as any).__path, 'invoke:a')
})

test('invoke: all three handler groups receive the right context', async () => {
  __reset()
  const api = makeApi()
  exposeBridge(api)
  const main = registerMain(api, allHandlers() as any)

  assert.deepEqual(await invoke(api.invoke.getUser, 'x'), { id: 'x', name: 'x' })
  assert.equal(await invoke(api.invoke.withEvent, 1), 43)   // event.sender.id === 42
  assert.equal(await invoke(api.invoke.withSender, 1), 43)  // senderId === 42
  main.dispose()
})

test('sendSync: all three groups, plus error propagation', () => {
  __reset()
  const api = makeApi()
  exposeBridge(api)
  const main = registerMain(api, allHandlers() as any)

  assert.equal(sendSync(api.sendSync.isDark), true)
  assert.equal(sendSync(api.sendSync.syncEvent, 1), 43)
  assert.equal(sendSync(api.sendSync.syncSender, 1), 43)
  assert.throws(() => sendSync(api.sendSync.boom), /kaboom/)
  main.dispose()
})

test('registerMain rejects duplicate handler registration', () => {
  __reset()
  const api = makeApi()
  exposeBridge(api)
  assert.throws(
    () => registerMain(api, {
      sendSync: { duplicate: () => 'a' },
      sendSyncWithSenderId: { duplicate: () => 'b' },
    } as any),
    /duplicate handler/,
  )
})

test('registerMain rejects a handler name that is not in the schema', () => {
  __reset()
  const api = makeApi()
  exposeBridge(api)
  assert.throws(
    () => registerMain(api, {
      invoke: { getUesr: async () => ({ id: 'x', name: 'y' }) },
    } as any),
    /no matching token in schema\.invoke/,
  )
})

test('registerMain warns about methods with no handler', () => {
  __reset()
  const api = makeApiWithUnhandled()
  exposeBridge(api)
  const warnings: string[] = []
  const original = console.warn
  console.warn = (msg: string) => { warnings.push(msg) }
  try {
    registerMain(api, { sendSync: { handled: () => 'ok' } } as any)
  } finally {
    console.warn = original
  }
  assert.match(warnings.join(' '), /sendSync\.unhandled/)
})

test('an unregistered sendSync method replies with an error instead of hanging', () => {
  __reset()
  const api = makeApiWithUnhandled()
  exposeBridge(api)
  const original = console.warn
  console.warn = () => {}
  let main: ReturnType<typeof registerMain>
  try {
    main = registerMain(api, { sendSync: { handled: () => 'ok' } } as any)
  } finally {
    console.warn = original
  }
  assert.throws(
    () => sendSync(api.sendSync.unhandled),
    /no handler registered for sendSync\.unhandled/,
  )
  main!.dispose()
})

test('emit broadcasts to all windows; emitTo targets exactly one', () => {
  __reset()
  const api = makeApi()
  exposeBridge(api)
  const w1 = __makeWindow()
  const w2 = __makeWindow()
  const main = registerMain(api, allHandlers() as any)
  const payload = { id: '1', name: 'a' }

  main.emit(api.events['user:updated'], payload)
  assert.equal(sent.length, 2)

  sent.length = 0
  main.emitTo(w2, api.events['user:updated'], payload)
  assert.equal(sent.length, 1)
  assert.equal(sent[0]!.windowId, w2.webContents.id)
  assert.equal(w1.webContents.id !== w2.webContents.id, true)
  main.dispose()
})

test('dispose removes every handler and listener', async () => {
  __reset()
  const api = makeApi()
  exposeBridge(api)
  const main = registerMain(api, allHandlers() as any)
  main.dispose()

  await assert.rejects(() => invoke(api.invoke.getUser, 'x'), /No handler registered/)
  assert.throws(() => sendSync(api.sendSync.isDark), /No handler registered/)
})

test('signal: get returns T, functional set works, unsubscribe works', () => {
  const s = signal(0)
  const seen: number[] = []
  const off = s.subscribe((v) => seen.push(v))
  s.set((p) => p + 1)
  s.set(5)
  off()
  s.set(9)
  assert.equal(s.get(), 9)
  assert.deepEqual(seen, [1, 5])
})

test('useEvent and useInvoke work through the bridge', async () => {
  __reset()
  const api = makeApi()
  exposeBridge(api)
  __makeWindow()
  const main = registerMain(api, allHandlers() as any)

  const updated = useEvent(api.events['user:updated'])
  assert.equal(updated.get(), undefined)
  main.emit(api.events['user:updated'], { id: '1', name: 'a' })
  assert.deepEqual(updated.get(), { id: '1', name: 'a' })

  const hook = useInvoke(api.invoke.getUser)
  const pending = hook.call('z')
  assert.equal(hook.loading.get(), true)
  await pending
  assert.deepEqual(hook.data.get(), { id: 'z', name: 'z' })
  assert.equal(hook.loading.get(), false)
  main.dispose()
})
