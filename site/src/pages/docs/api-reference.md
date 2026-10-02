# API reference

## Exports

<ApiTable />

`eventChannel` and `invokeChannel` resolve a token to its `ipcRenderer` channel
string. You only need them if you are writing your own transport; the hooks use them
internally.

## Channels

Channels are namespaced to avoid colliding with anything else on the bus:

```ts
const NS = '__eui__'
invokeChannel(token) // -> "__eui__:invoke:getUser"
eventChannel(token)  // -> "__eui__:event:user:updated"
```

The path comes from the key in `defineApi` and is stamped onto the token once, at
definition time. Handlers and callers therefore agree on the channel by construction
— there is no string to mistype at a call site.

## Error handling

A rejection in a main-process handler propagates to the renderer as a rejected
promise. `useInvoke`'s `call` writes it to the `error` signal and then rethrows:

```ts
const { error, call } = useInvoke(api.invoke.getUser)

try {
  await call('missing')
} catch (cause) {
  cause === error.get() // true — same value, two ways to observe it
}
```

Non-`Error` rejections are passed through untouched, so `error` is typed `unknown`
rather than `Error`. Narrow it before reading a message.

## Caveats

**`useEvent` has no teardown.** It subscribes to the underlying IPC channel when the
hook is created and does not expose an unsubscribe function, so calling it inside a
component that mounts repeatedly will accumulate listeners. Create event signals once
per application (for example in a module-level store) rather than per component
instance. The `signal` returned by `useEvent` is itself disposable only in the sense
that you can stop caring about it — the `ipcRenderer` listener stays.

**ESM only.** The package publishes a single `import` condition per entry point. A
CommonJS consumer will fail to resolve it.

**Types come from your contract.** The renderer entry's `window.api` declaration
assumes the default bridge name. If you called `exposeBridge(api, 'myApi')`, declare
`window.myApi` yourself against the exported `Bridge` interface.

## Type exports

Alongside the runtime values, the package exports the types you need to build your
own adapters: `Signal`, `Listener`, `Bridge`, `InvokeToken`, `EventToken`,
`InvokeArgs`, `InvokeReturn`, `EventPayload`, `InvokeHandlers`, `EventEmitter`,
`ApiSchema` and `UseInvokeResult`.

```ts
import type { InvokeArgs, InvokeReturn } from '@cc-heart/electron-use-ipc'

type Args = InvokeArgs<typeof api.invoke.getUser>    // [string]
type Result = InvokeReturn<typeof api.invoke.getUser> // User
```

## Where to go next

- [Getting started](/docs/getting-started) — the four-file setup
- [The shared contract](/docs/shared-contract) — how inference works
- [GitHub](https://github.com/CarlOpenLab/electron-use-ipc) — issues and source
