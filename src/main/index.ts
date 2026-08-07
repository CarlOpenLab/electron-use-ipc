import { BrowserWindow, ipcMain } from 'electron'
import type { ApiSchema, EventEmitter, InvokeHandlers } from '../core/types'
import { eventChannel, invokeChannel } from '../core/channels'

export interface RegisterMainResult<S extends ApiSchema> extends EventEmitter<S> {}

/**
 * Register IPC handlers in the main process.
 *
 * @returns an emitter to push events to all renderer windows + a `dispose()`.
 *
 * @example
 *   const main = registerMain(api, {
 *     invoke: {
 *       getUser: async (id) => db.users.get(id),
 *       listUsers: async () => db.users.all(),
 *     },
 *   })
 *   main.emit(api.events['user:updated'], user)
 */
export function registerMain<S extends ApiSchema>(
  schema: S,
  handlers: { invoke?: InvokeHandlers<S> },
): RegisterMainResult<S> {
  const unregisters: Array<() => void> = []

  if (handlers.invoke && schema.invoke) {
    for (const key of Object.keys(handlers.invoke) as Array<keyof typeof handlers.invoke>) {
      const fn = handlers.invoke[key]
      if (typeof fn !== 'function') continue
      const token = schema.invoke[key as string]
      if (!token) continue
      const channel = invokeChannel(token)
      ipcMain.handle(channel, (_e, ...args: unknown[]) => (fn as (...a: any[]) => unknown)(...args))
      unregisters.push(() => ipcMain.removeHandler(channel))
    }
  }

  const emit: EventEmitter<S>['emit'] = (token, ...payload) => {
    const channel = eventChannel(token as never)
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send(channel, payload[0])
    }
  }

  return {
    emit,
    dispose() {
      while (unregisters.length) unregisters.shift()?.()
    },
  }
}
