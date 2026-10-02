# Renderer hooks

Two hooks cover most needs: `useInvoke` for request/response, `useEvent` for pushed
events. Both return [signals](#signals) rather than framework-specific state.

## useInvoke

```ts
import { useInvoke } from '@cc-heart/electron-use-ipc/renderer'
import { api } from '../shared/api'

const { data, error, loading, call } = useInvoke(api.invoke.getUser)

await call('1')      // (id: string) => Promise<User>
data.get()           // User | undefined
```

| Field | Type | Notes |
|---|---|---|
| `data` | `Signal<R \| undefined>` | Last resolved value |
| `error` | `Signal<unknown \| undefined>` | Last thrown value |
| `loading` | `Signal<boolean>` | True while the call is in flight |
| `call` | `(...args: A) => Promise<R>` | Runs the method; args inferred from the token |

`call` rethrows on failure. That means you can await it for control flow *and*
observe the same failure through the `error` signal.

### Immediate calls

Pass `immediate` to run the method as soon as the hook is created. The arguments are
still type-checked against the token:

```ts
const { data } = useInvoke(api.invoke.listUsers, { immediate: [] })
//    data: Signal<User[] | undefined>
```

## useEvent

```ts
import { useEvent } from '@cc-heart/electron-use-ipc/renderer'

const updated = useEvent(api.events['user:updated'])
//    Signal<User | undefined>

updated.get()                    // latest payload, or undefined before the first
updated.subscribe((u) => { ... }) // fires on every push
```

## invoke

When you do not need reactive state, call a method directly:

```ts
import { invoke } from '@cc-heart/electron-use-ipc/renderer'

const user = await invoke(api.invoke.getUser, '1')
```

## Signals

`Signal<T>` is the primitive behind both hooks — a value, a setter, and a subscriber
set. It is around thirty lines, with no dependency and no framework coupling:

<CodeBlock name="core-signal" />

`get()` reads the current value, `set()` writes it and notifies subscribers (skipping
the notification when the value is `Object.is`-equal), and `subscribe()` returns an
unsubscribe function.

## Framework adapters

Because the hooks return signals, binding them to a component tree is a few lines.
The two adapters below are complete — neither the core nor the renderer entry
imports a UI framework.

<CodeCompare left="adapter-react" right="adapter-vue" left-note="React" right-note="Vue" />

The important detail in both is calling the unsubscribe function on teardown.
`subscribe` returns one; `useSyncExternalStore` and Vue's `onScopeDispose` are the
hooks that wire it up.

## Next

[API reference](/docs/api-reference) — every export, plus the channel and error
semantics.
