# API reference

## Exports

<ApiTable />

`invokeChannel`, `sendSyncChannel` and `eventChannel` resolve a token to its
`ipcRenderer` channel string. You only need them if you are writing your own
transport; the hooks use them internally.

## Channels

Channels are namespaced to avoid colliding with anything else on the bus:

```ts
const NS = '__eui__'
invokeChannel(token)   // -> "__eui__:invoke:getUser"
sendSyncChannel(token) // -> "__eui__:sendSync:isDarkMode"
eventChannel(token)    // -> "__eui__:event:user:updated"
```

The path comes from the key in `defineApi` and is stamped onto the token once, at
definition time. Handlers and callers therefore agree on the channel by construction
— there is no string to mistype at a call site. `defineApi` preserves the exact
literal keys of your schema, so a misspelled key such as `api.invoke.getUesr` is a
compile error; omitted groups (`invoke` / `sendSync` / `events`) are filled with
`{}`.

## Handler registration

`registerMain` accepts six handler groups: `invoke`, `invokeWithEvent`,
`invokeWithSenderId`, `sendSync`, `sendSyncWithEvent` and
`sendSyncWithSenderId`. They are alternative ways to implement the *same*
schema methods — the `WithEvent` variants prepend the Electron event object, and
the `WithSenderId` variants prepend `event.sender.id`.

- Each method may be registered in **exactly one** group. A duplicate throws at
  startup instead of one handler silently overwriting the other. Ownership is
  tracked process-wide, so a second `registerMain()` call cannot attach another
  `ipcMain.on` listener to the same channel and silently win with the last
  `event.returnValue` write. Call `dispose()` before re-registering.
- Registration is atomic: a failed call rolls back every handler and listener it
  already installed, so a retry succeeds instead of hitting "Attempted to
  register a second handler".
- A handler name that is not in the schema throws at startup (and is a compile
  error in TypeScript).
- Methods with no handler at all produce a startup `console.warn`. `sendSync`
  methods also receive a fallback listener that replies with an error; it yields
  automatically if a real handler is registered by a later call.

## Error handling

A rejection in a main-process `invoke` handler propagates to the renderer as a
rejected promise. `useInvoke`'s `call` writes it to the `error` signal and then
rethrows:

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

`sendSync` has no promise to reject. Instead, a throwing handler is converted to
a structured-clone-safe error envelope in `event.returnValue`, and `sendSync()`
in the renderer rethrows it as an `Error`:

```ts
try {
  const dark = sendSync(api.sendSync.isNativeDarkMode)
} catch (err) {
  // err.message comes from the main-process handler
}
```

## Caveats

**`sendSync` blocks the renderer.** `ipcRenderer.sendSync` blocks the whole
renderer process until the main process replies. Electron's documentation calls
it a "last resort" — prefer `invoke` unless you genuinely cannot `await` (for
example reading the native theme before `ready-to-show`). Never leave a
`sendSync` method without a real handler: the fallback reply throws in the
renderer rather than hanging it, but it still signals a configuration error.

**`useEvent` has no teardown.** It subscribes to the underlying IPC channel when the
hook is created and does not expose an unsubscribe function, so calling it inside a
component that mounts repeatedly will accumulate listeners. Create event signals once
per application (for example in a module-level store) rather than per component
instance. The `signal` returned by `useEvent` is itself disposable only in the sense
that you can stop caring about it — the `ipcRenderer` listener stays.

**ESM only.** The package publishes a single `import` condition per entry point. A
CommonJS consumer will fail to resolve it.

**Root entry vs subpath entries.** `registerMain` and `exposeBridge` are exported
from `@cc-heart/electron-use-ipc/main` and `@cc-heart/electron-use-ipc/preload`
respectively, not from the package root — the root must not pull `electron` into
renderer bundles. See the [changelog](https://github.com/CarlOpenLab/electron-use-ipc/blob/main/CHANGELOG.md).

**Types come from your contract.** The renderer entry's `window.api` declaration
assumes the default bridge name. If you called `exposeBridge(api, 'myApi')`, declare
`window.myApi` yourself against the exported `Bridge` interface.

## Type exports

Alongside the runtime values, the package exports the types you need to build your
own adapters: `Signal`, `Listener`, `Bridge`, `InvokeToken`, `SendSyncToken`,
`EventToken`, `InvokeArgs`, `InvokeReturn`, `SendSyncArgs`, `SendSyncReturn`,
`EventPayload`, `InvokeHandlers`, `SendSyncHandlers`, `EventEmitter`,
`ApiSchema`, `FilledApi`, `IpcErrorEnvelope` and `UseInvokeResult`.

```ts
import type { InvokeArgs, InvokeReturn } from '@cc-heart/electron-use-ipc'

type Args = InvokeArgs<typeof api.invoke.getUser>    // [string]
type Result = InvokeReturn<typeof api.invoke.getUser> // User
```

## Where to go next

- [Getting started](/docs/getting-started) — the four-file setup
- [The shared contract](/docs/shared-contract) — how inference works
- [GitHub](https://github.com/CarlOpenLab/electron-use-ipc) — issues and source
