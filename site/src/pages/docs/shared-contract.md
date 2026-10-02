# The shared contract

One `defineApi` call describes every request/response method and every event. It is
the only file that has to change when the IPC surface changes.

```ts
// shared/api.ts
import { defineApi, defineEvent, defineInvoke } from '@cc-heart/electron-use-ipc'

export interface User {
  id: string
  name: string
}

export const api = defineApi({
  invoke: {
    getUser: defineInvoke<[string], User>(),
    listUsers: defineInvoke<[], User[]>(),
    createUser: defineInvoke<[string], User>(),
  },
  events: {
    'user:updated': defineEvent<User>(),
    'server:shutdown': defineEvent<void>(),
  },
})
```

## The three builders

| Builder | Arguments | Meaning |
|---|---|---|
| `defineInvoke<Args, Return>()` | A tuple of arguments, and the resolved value | Request/response method |
| `defineEvent<Payload>()` | The pushed payload | One-way main → renderer event |
| `defineApi({ invoke, events })` | A schema | Stamps channel paths onto the tokens |

`invoke` and `events` are both required. Pass `{}` for either if that side is empty —
this is what keeps `api.invoke.foo` from widening to `foo | undefined` at every use
site.

## How the types travel

A token is an ordinary object at runtime. Its *type* is where the information lives:

```ts
interface InvokeToken<Args, Return> {
  readonly __kind: 'invoke'
  readonly __path: string   // filled at runtime by defineApi
  readonly __args: Args     // phantom, erased at runtime
  readonly __return: Return // phantom, erased at runtime
}
```

`defineApi` walks the schema and writes the channel path onto each token, derived
from its key — `getUser` becomes `invoke:getUser`. The schema's type is returned
unchanged, so `api.invoke.getUser` keeps its literal type `InvokeToken<[string], User>`.

The `__args`, `__return` and `__payload` fields are phantom: they exist only in the
type system and are erased at runtime. Every downstream consumer — `registerMain`,
`exposeBridge`, `useInvoke` — extracts them with conditional types:

```ts
export type InvokeArgs<T> = T extends InvokeToken<infer A, any> ? A : never
export type InvokeReturn<T> = T extends InvokeToken<any, infer R> ? R : never
export type EventPayload<T> = T extends EventToken<infer P> ? P : never
```

That is the whole trick. Define once, infer everywhere.

## Naming

Event names are conventionally `namespace:action` (`user:updated`), but nothing
enforces that — any string key works. It is the key, not the type, that becomes the
channel name, so two tokens with the same key would collide.

## Next

[Main process](/docs/main-process) — registering the handlers this contract describes.
