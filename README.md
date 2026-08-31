# @cc-heart/electron-use-ipc

Type-safe Electron IPC with **hook-style** APIs. Define the contract once, get
full type inference across main / preload / renderer — no duplicated types.

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
import { defineApi, defineEvent, defineInvoke } from '@cc-heart/electron-use-ipc'

export interface User { id: string; name: string }

export const api = defineApi({
  invoke: {
    getUser:    defineInvoke<[string], User>(),
    listUsers:  defineInvoke<[], User[]>(),
    createUser: defineInvoke<[string], User>(),
  },
  events: {
    'user:updated':    defineEvent<User>(),
    'server:shutdown': defineEvent<void>(),
  },
})
```

### 2. Main process

```ts
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
```

## API

| Function | Side | Purpose |
|---|---|---|
| `defineApi(schema)` | shared | Stamp channel paths onto tokens; preserve literal types |
| `defineInvoke<Args, Return>()` | shared | Type token for a request/response method |
| `defineEvent<Payload>()` | shared | Type token for a main→renderer event |
| `registerMain(api, { invoke })` | main | Register handlers; returns `{ emit, dispose }` |
| `exposeBridge(api, name?)` | preload | Expose typed `window[name]` via `contextBridge` |
| `useInvoke(token, opts?)` | renderer | Hook → `{ data, error, loading, call }` signals |
| `useEvent(token)` | renderer | Hook → `Signal<Payload \| undefined>` |
| `invoke(token, ...args)` | renderer | One-shot typed call |

## How the type inference works

A token is a runtime-light object carrying a channel path, whose **type** is
parameterized by `Args` / `Return` / `Payload`:

```ts
interface InvokeToken<Args, Return> {
  readonly __kind: 'invoke'
  readonly __path: string        // filled at runtime by defineApi
  readonly __args: Args          // phantom, erased at runtime
  readonly __return: Return      // phantom, erased at runtime
}
```

`defineApi` walks the schema and stamps `__path` from each key, while the
TypeScript compiler keeps the literal schema type — so `api.invoke.getUser`
retains `InvokeToken<[string], User>`. From there every consumer
(`registerMain`, `exposeBridge`, `useInvoke`) extracts args/return via
conditional types. **Define once, infer everywhere.**

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
