# Main process

`registerMain` connects the contract to real handlers and returns an emitter for
pushing events back to every renderer window.

```ts
import { registerMain } from '@cc-heart/electron-use-ipc/main'
import { api } from '../shared/api'

const main = registerMain(api, {
  invoke: {
    getUser: async (id) => {
      // `id` is string, the return must be User — both inferred
      const user = users.get(id)
      if (!user) throw new Error(`no user ${id}`)
      return user
    },
    listUsers: async () => [...users.values()],
    createUser: async (name) => {
      const user = { id: crypto.randomUUID(), name }
      users.set(user.id, user)
      main.emit(api.events['user:updated'], user)
      return user
    },
  },
})
```

## Handlers are inferred, not annotated

Each handler's parameters and return type come from the token it is keyed against.
`getUser` is typed `(id: string) => User | Promise<User>` because its token is
`InvokeToken<[string], User>`. There is no second place to declare the signature, so
there is nothing to keep in sync.

Handlers may be async or not. A non-async handler works as long as it returns the
right type.

## Events

`main.emit(token, payload)` sends to every open `BrowserWindow`. The payload is
checked against the token's type — and for a `defineEvent<void>()` token, the
payload argument is not accepted at all:

```ts
main.emit(api.events['user:updated'], user) // payload must be User
main.emit(api.events['server:shutdown'])    // void event: no payload
```

The emitter is declared with the result of `registerMain` because handlers
frequently need to emit. Capture it before the object literal, as in the example
above, and the closure will see it.

## Cleanup

`registerMain` returns `dispose()`, which removes every `ipcMain` handler it
registered. Call it when tearing down a window's IPC surface or in tests:

```ts
main.dispose()
```

Handlers are registered with `ipcMain.handle`, so a rejection in a handler surfaces
in the renderer as a rejected promise from `call()`. See
[the renderer hooks](/docs/renderer-hooks) for how that reaches the `error` signal.

## The registration internals

<CodeBlock name="main-register" />

## Next

[Preload bridge](/docs/preload-bridge) — publishing this to the renderer.
