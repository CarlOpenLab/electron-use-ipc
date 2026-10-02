# Preload bridge

The preload script publishes the bridge onto `window`. It is deliberately generic:
it forwards tokens to `ipcRenderer` without knowing what any of them mean.

```ts
import { exposeBridge } from '@cc-heart/electron-use-ipc/preload'
import { api } from '../shared/api'

exposeBridge(api)          // exposes window.api
exposeBridge(api, 'myApi') // exposes window.myApi
```

## What ends up on window

The bridge has exactly two methods, both keyed by token rather than by channel name:

```ts
interface Bridge {
  invoke<A extends AnyArgs, R>(token: InvokeToken<A, R>, ...args: A): Promise<R>
  on<P>(token: EventToken<P>, cb: (payload: P) => void): () => void
}
```

`invoke` resolves the token's channel path and calls `ipcRenderer.invoke`. `on`
subscribes to an event channel and returns an unsubscribe function.

The renderer entry declares `window.api` against this interface, which is why
`useInvoke` can infer everything from a token alone — no generated client, no
per-method wrapper.

## Security posture

`exposeBridge` never touches `nodeIntegration`. It publishes a plain object through
`contextBridge.exposeInMainWorld`, so it works with the secure defaults:

```ts
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true, // default
    nodeIntegration: false, // default
  },
})
```

Only the two generic methods cross the bridge. Because they take tokens rather than
arbitrary channel strings, a renderer cannot invent a channel that was never
defined in the contract — the token has to exist in `shared/api.ts` first.

## Multiple bridges

If a window needs more than one contract, pass a distinct key:

```ts
exposeBridge(api, 'api')
exposeBridge(adminApi, 'adminApi')
```

Note that the renderer entry's global declaration only describes `window.api`. For a
second key, declare it yourself:

```ts
declare global {
  interface Window {
    adminApi: Bridge
  }
}
```

## Next

[Renderer hooks](/docs/renderer-hooks) — consuming the bridge.
