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
    getWindowTitle: defineInvoke<[number], string>(),
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
  },
  invokeWithSenderId: {
    // Handlers here also relate to `invoke` methods in the schema,
    // but get the id of the originating window as a prepended argument.
    getWindowTitle: async (sender, version) =>
      `Window ${sender} v${version}`,
  },
  sendSync: {
    //note: not asynchronous
    isNativeDarkMode: () => nativeTheme.shouldUseDarkColors;
  }
  // We can also have `invokeWithEvent`, `sendSyncWithEvent`, and `sendSyncWithSenderId`
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
| `defineInvoke<Args, Return>()` | shared | Type token for an async request/response method |
| `defineSendSync<Args, Return>()` | shared | Type token for a synchronous request/response method |
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
parameterized by `Args` / `Return` / `Payload`:

```ts
interface InvokeToken<
  Args extends AnyArgs = [],
  Return = void,
> {
  readonly __kind: 'invoke'
  readonly __path: string
  readonly __args: Args
  readonly __return: Return
}
```

`defineApi` walks the schema and stamps `__path` from each key, while the
TypeScript compiler keeps the literal schema type — so `api.invoke.getUser`
retains `InvokeToken<[string], User>`. From that point every consumer
(e.g. `registerMain`, `exposeBridge`, `useInvoke`) extracts args/return via
conditional types (`InvokeArgs`, `InvokeReturn`, etc.). **Define once, infer everywhere.**

`invoke` methods are mapped to `ipcRenderer.invoke`,
and the return (if any) is a `Promise` that needs an `await`

`sendSync` methods are mapped to `ipcRenderer.sendSync` **and are blocking**.
Any return value will **not** be a `Promise`.

Best-practice is to prefer `invoke` unless it isn't technically possible to `await` the response —
e.g. When first loading a renderer, and you need to know if the native theme calls for dark mode
before the `ready-to-show` fires so you can avoid the window flashing when it first loads.

There are also a couple of variants for handlers specified in `registerMain`:
- `invoke` / `sendSync`
- `invokeWithEvent` / `sendSyncWithEvent`
- `invokeWithSenderId` / `sendSyncWithSenderId`

Internally, `invoke` call have a corresponding `IpcMainInvokeEvent`, and `sendSync` calls have an `IpcMainEvent`.  

If you need this, you can define the handler in a `<kind>WithEvent` block, which will cause the relevant event
object to be prepended as an argument.  But 99% of the time you don't want the full event object, you only really
want to know the sending window (which is available via `event.sender.id`)

That's the purpose of `<kind>WithSenderId` blocks, which internally get the numeric sender ID and prepend it as
the first argument to your handler (instead of a full event object).

The use of this event parameter is in multiple-window applications. As the sender will be the window id
that can be accessed via `window.webContents.id` following the `ready-to-show` event. Allowing you to easily
link events to the windows that sent them.


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
