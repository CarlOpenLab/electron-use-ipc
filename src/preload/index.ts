import { contextBridge, ipcRenderer } from 'electron'
import type { ApiSchema } from '../core/types'
import { eventChannel, invokeChannel } from '../core/channels'

/**
 * Expose the typed bridge to the renderer via `contextBridge`.
 *
 * The bridge is intentionally generic: it forwards a token (which already
 * carries its channel path) to ipcRenderer. The renderer-side `Bridge` type
 * (see `renderer/index.ts`) re-declares `window.api` with full generics so
 * `useInvoke(token)` infers args/return from the token alone.
 *
 * @example
 *   exposeBridge(api)            // exposes window.api
 *   exposeBridge(api, 'myApi')   // exposes window.myApi
 */
export function exposeBridge<S extends ApiSchema>(
  _schema: S,
  apiKey = 'api',
): void {
  const bridge = {
    invoke(token: { __path: string }, ...args: unknown[]) {
      return ipcRenderer.invoke(invokeChannel(token as never), ...args)
    },
    on(
      token: { __path: string },
      cb: (payload: unknown) => void,
    ): () => void {
      const channel = eventChannel(token as never)
      const handler = (_e: unknown, payload: unknown) => cb(payload)
      ipcRenderer.on(channel, handler)
      return () => ipcRenderer.removeListener(channel, handler as never)
    },
  }

  contextBridge.exposeInMainWorld(apiKey, bridge)
}
