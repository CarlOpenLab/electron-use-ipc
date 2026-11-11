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
- 🧱 **Structured** — `invoke` (async request/response), `sendSync` (blocking
  request/response), and `events` (main → renderer).

> **Import paths:** `registerMain` and `exposeBridge` are **not** exported from
> the package root — the root entry would otherwise pull `electron` into
> renderer bundles. Import them from their subpath entries:
>
> ```ts
> import { registerMain } from '@cc-heart/electron-use-ipc/main'
> import { exposeBridge } from '@cc-heart/electron-use-ipc/preload'
> ```
>
> If you previously imported them from the root, see [CHANGELOG.md](./CHANGELOG.md).

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
  // Asynchronous calls — the renderer gets a Promise
  invoke: {
    getUser:        defineInvoke<[string], User>(),
    listUsers:      defineInvoke<[], User[]>(),
    createUser:     defineInvoke<[string], User>(),
    getWindowTitle: defineInvoke<[number], string>(),
  },
  // Synchronous calls — blocking, see the warning below
  sendSync: {
    isNativeDarkMode: defineSendSync<[], boolean>(),
  },
  events: {
    'user:updated':    defineEvent<User>(),
    'server:shutdown': defineEvent<void>(),
  },
})
```

`invoke`, `sendSync` and `events` are all optional; `defineApi` fills the ones
you omit with `{}` while keeping the exact keys of the ones you supplied.

### 2. Main process

```ts
import { nativeTheme } from 'electron'
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
    // `senderId` is the id of the originating window's webContents.
    // The second argument is the one declared by the token ([number]).
    getWindowTitle: async (senderId, version) => `Window ${senderId} v${version}`,
  },
  sendSync: {
    // Synchronous handler: must NOT be async.
    isNativeDarkMode: () => nativeTheme.shouldUseDarkColors,
  },
  // Also available: invokeWithEvent, sendSyncWithEvent, sendSyncWithSenderId
})

main.emit(api.events['server:shutdown'])          // void event: no payload
main.emitTo(win, api.events['user:updated'], u)   // send to one window only
```

**Handler registration rules** — a typo used to be silently ignored. Now:

- Each schema method may be registered in **exactly one** group. Registering the
  same method in two groups (e.g. `invoke` and `invokeWithEvent`) throws at startup.
- A handler name that is not in the schema throws at startup (and is a TypeScript
  error as well).
- Duplicate detection is **process-wide**: a second `registerMain()` cannot attach
  another listener to a channel and silently overwrite its reply. Call `dispose()`
  on the earlier result before re-registering.
- Registration is **atomic**: if anything throws, every handler and listener this
  call installed is rolled back, so fixing the mistake and retrying just works.
- Methods with **no** handler produce a startup `console.warn` instead of failing
  only when a renderer calls them. A `sendSync` method additionally gets a
  fallback reply, so a missing handler can never hang the renderer.

### 3. Preload

```ts
import { exposeBridge } from '@cc-heart/electron-use-ipc/preload'
import { api } from '../shared/api'

exposeBridge(api)   // -> window.api
```

### 4. Renderer (hook-style)

```ts
import { invoke, sendSync, useInvoke, useEvent } from '@cc-heart/electron-use-ipc/renderer'
import { api } from '../shared/api'

const { data, loading, call } = useInvoke(api.invoke.getUser)
//    call: (id: string) => Promise<User>     ✅ inferred
//    data: Signal<User | undefined>          ✅ inferred

await call('1')
console.log(data.get()?.name)

const updated = useEvent(api.events['user:updated'])
//    updated: Signal<User | undefined>       (undefined until the first event)
updated.subscribe((u) => { if (u) console.log(u.name) })

const title: string = await invoke(api.invoke.getWindowTitle, 69)
const isDark: boolean = sendSync(api.sendSync.isNativeDarkMode)
```

A token is **not** callable — always pass it to `invoke()` / `sendSync()` /
`useInvoke()` / `useEvent()`.

## API

| Function | Side | Purpose |
|---|---|---|
| `defineApi(schema)` | shared | Stamp channel paths onto tokens; preserve literal types |
| `defineInvoke<Args, Return>()` | shared | Type token for an async request/response method |
| `defineSendSync<Args, Return>()` | shared | Type token for a synchronous request/response method |
| `defineEvent<Payload>()` | shared | Type token for a main→renderer event |
| `registerMain(api, handlers)` | main | Register handlers; returns `{ emit, emitTo, dispose }` |
| `exposeBridge(api, name?)` | preload | Expose typed `window[name]` via `contextBridge` |
| `useInvoke(token, opts?)` | renderer | Hook → `{ data, error, loading, call }` signals |
| `useEvent(token)` | renderer | Hook → `Signal<Payload \| undefined>` |
| `invoke(token, ...args)` | renderer | One-shot typed async call → `Promise<Return>` |
| `sendSync(token, ...args)` | renderer | One-shot typed synchronous call → `Return` |

There is no `useSendSync`: a call you want to queue up and observe repeatedly is
never a call that must be synchronous.

### ⚠️ Synchronous calls

`sendSync` maps to `ipcRenderer.sendSync`, which **blocks the entire renderer
process** until the main process replies. Electron's own docs call it a
"last resort". Prefer `invoke` unless `await` is technically impossible — for
example reading the native theme before `ready-to-show` to avoid a flash.

Because a synchronous reply has no equivalent of promise rejection, a handler
that throws is turned into a small error envelope and rethrown by `sendSync()`
in the renderer. A `sendSync` method with no registered handler fails at startup
with a warning and will throw when called; never leave one unhandled.

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
retains `InvokeToken<[string], User>`, and a misspelled key is a compile error.
From that point every consumer (`registerMain`, `exposeBridge`, `useInvoke`)
extracts args/return via conditional types (`InvokeArgs`, `InvokeReturn`, etc.).
**Define once, infer everywhere.**

`invoke` methods map to `ipcRenderer.invoke`; the renderer receives a `Promise`.
`sendSync` methods map to `ipcRenderer.sendSync`; the renderer receives the value
directly, not a `Promise`.

There are three variants for handlers specified in `registerMain`:

- `invoke` / `sendSync` — just the declared arguments.
- `invokeWithEvent` / `sendSyncWithEvent` — the full event object is prepended.
- `invokeWithSenderId` / `sendSyncWithSenderId` — only `event.sender.id` is prepended.

Internally, `invoke` calls receive an `IpcMainInvokeEvent`, while `sendSync`
calls receive an `IpcMainEvent`. Most of the time you don't want the whole event
object, only the sending window — that is what the `WithSenderId` variants are
for. This is mainly useful in multi-window applications: capture
`window.webContents.id` on `ready-to-show` and match it against the sender id in
your handlers.

## Integrating with a UI framework

The core is framework-agnostic and returns `Signal`s. `Signal<T>` always holds a
`T`: `get()` returns `T` and `subscribe` receives `T`. Signals that begin empty
(such as `useEvent` / `useInvoke().data`) are typed `Signal<T | undefined>`.

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

## Development

```bash
npm run typecheck      # tsc --noEmit, includes examples/neg-check.ts
npm run test:negative  # negative type tests (@ts-expect-error must all be used)
npm run test:runtime   # node:test against an ipcMain/ipcRenderer mock
npm run test           # all of the above
npm run build          # tsup ESM + d.ts
```

## License

MIT
