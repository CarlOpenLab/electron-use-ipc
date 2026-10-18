# @cc-heart/electron-use-ipc

Type-safe Electron IPC with **hook-style** APIs. Define the contract once, get
full type inference across main / preload / renderer — no duplicated types.

📖 **[Documentation & live demo](https://carlopenlab.github.io/electron-use-ipc/)** — the full
guide, the API reference, and every snippet checked against this repository.

- 🔒 **End-to-end type inference** — one `defineApi()`, every arg / return /
  payload is inferred everywhere via type tokens.
- 🪝 **Hook-style calls** — `useInvoke()` / `useEvent()` return reactive signals,
  framework-agnostic (drop into React, Vue, Solid, or vanilla).
- ⚡ **Tiny** — a minimal signal primitive, no framework runtime dependency.
- 🧱 **Structured** — `invoke` (request/response) + `events` (main → renderer).

## Quick start

```bash
npm install @cc-heart/electron-use-ipc
```

### 1. Define the contract (shared)

```ts
// shared/api.ts
import { defineApi, defineEvent, defineInvoke, defineSendSync } from '@cc-heart/electron-use-ipc'

export interface User { id: string; name: string }

export const api = defineApi({
  // Asynchronous calls, any return is a `Promise`
  invoke: {
    getUser:        defineInvoke<[string], User>(),
    listUsers:      defineInvoke<[], User[]>(),
    createUser:     defineInvoke<[string], User>(),
    // IpcMainInvokeEvent will also be sent as the first param to the handler
    getWindowTitle: defineInvoke<[number], string>({ withEventParam: true }),
  },
  // Synchronous calls, blocking
  sendSync: {
    isNativeDarkMode: defineSendSync<[], boolean>(),
  },
  events: {
    'user:updated':    defineEvent<User>(),
    'server:shutdown': defineEvent<void>(),
  },
})
```

### 2. Main process

```ts
import { nativeTheme } from 'electron';
import { registerMain } from '@cc-heart/electron-use-ipc/main'
import { api } from '../shared/api'

const main = registerMain(api, {
  invoke: {
    getUser:    async (id) => db.users.get(id),   // (id: string) => User
    listUsers:  async () => db.users.all(),
    createUser: async (name) => {
      const u = { id: crypto.randomUUID(), name }
      main.emit(api.events['user:updated'], u)    // payload typed: User
      return u
    },
    //`event` is an `IpcMainInvokeEvent`, note that this ISN'T `async`
    getWindowTitle: (event, version) =>
      `Window ${event.sender.id} v${version}`,
  },
  sendSync: {
    isNativeDarkMode: () => nativeTheme.shouldUseDarkColors;
  }
})

main.emit(api.events['server:shutdown'])          // void event: no payload
```

### 3. Preload

```ts
import { exposeBridge } from '@cc-heart/electron-use-ipc/preload'
import { api } from '../shared/api'

exposeBridge(api)   // -> window.api
```

### 4. Renderer (hook-style)

```ts
import { useInvoke, useEvent } from '@cc-heart/electron-use-ipc/renderer'
import { api } from '../shared/api'

const { data, loading, call } = useInvoke(api.invoke.getUser)
//    call: (id: string) => Promise<User>     ✅ inferred
//    data: Signal<User | undefined>          ✅ inferred

await call('1')
console.log(data.get()?.name)

const updated = useEvent(api.events['user:updated'])
//    updated: Signal<User | undefined>
updated.subscribe((u) => { if (u) console.log(u.name) })

const windowTitle: string = api.sendSync.getWindowTitle(69);
```

## API

| Function | Side | Purpose |
|---|---|---|
| `defineApi(schema)` | shared | Stamp channel paths onto tokens; preserve literal types |
| `defineInvoke<Args, Return>(options)` | shared | Type token for an async request/response method |
| `defineSendSync<Args, Return>(options)` | shared | Type token for a synchronous request/response method |
| `defineEvent<Payload>()` | shared | Type token for a main→renderer event |
| `registerMain(api, { invoke })` | main | Register handlers; returns `{ emit, dispose }` |
| `exposeBridge(api, name?)` | preload | Expose typed `window[name]` via `contextBridge` |
| `useInvoke(token, opts?)` | renderer | Hook → `{ data, error, loading, call }` signals |
| `useEvent(token)` | renderer | Hook → `Signal<Payload \| undefined>` |
| `invoke(token, ...args)` | renderer | One-shot typed async call |
| `sendSync(token, ...args)` | renderer | One-shot typed synchronous call |

There is no corresponding `useSendSync`. The circumstances where you need to queue-up a method call
for potentially multiple later uses are not the the circumstances where it's absolutely impossible
for those calls to be asynchronous.

## How the type inference works

A token is a runtime-light object carrying a channel path, whose **type** is
parameterized by `Args` / `Return` / `WithEventParam` / `Payload`:

```ts
interface InvokeToken<
  Args extends AnyArgs = [],
  Return = void,
  WithEventParam extends boolean = false,
> {
  readonly __kind: 'invoke'
  readonly __path: string
  readonly __args: Args
  readonly __return: Return
  readonly __withEventParam: WithEventParam
}
```

`defineApi` walks the schema and stamps `__path` from each key, while the
TypeScript compiler keeps the literal schema type — so `api.invoke.getUser`
retains `InvokeToken<[string], User>`. From that point every consumer
(e.g. `registerMain`, `exposeBridge`, `useInvoke`) extracts args/return via
conditional types (`InvokeArgs`, `InvokeReturn`, etc.). **Define once, infer everywhere.**

`invoke` methods are mapped to `ipcRenderer.invoke`, and the return (if any) is a `Promise` that needs an `await`

`sendSync` methods are mapped to `ipcRenderer.sendSync` **and are blocking**.
Any return value will **not** be a `Promise`.

Best-practice is to prefer `invoke` unless it isn't technically possible to `await` the response —
e.g. When first loading a renderer, and you need to know if the native theme calls for dark mode
before the `ready-to-show` fires so you can avoid the window flashing when it first loads.

Both `invoke` and `sendSync` methods can optionally accept `({ withEventParam: true })` when
defining the API. This will cause an extra parameter to be prepended to the handler aguments...

For an `invoke` method, this parameter will be of type `IpcMainInvokeEvent`, and for a `sendSync` method
it'll be `IpcMainEvent`.  A typical use of this event parameter is in multiple-window applications:
Calling `event.sender.id` will uniquely identify the window that sent the event; this is the same id that
can be accessed via `window.webContents.id` following the `ready-to-show` event.


## Integrating with a UI framework

The core is framework-agnostic and returns `Signal`s. A thin adapter makes it
idiomatic in any framework:

```ts
// React adapter (example)
import { useSyncExternalStore } from 'react'
export function useSignalValue<T>(s: Signal<T>): T {
  return useSyncExternalStore(
    (cb) => s.subscribe(cb),
    s.get,
  )
}
// const user = useSignalValue(useInvoke(api.invoke.getUser).data)
```

## License

MIT
