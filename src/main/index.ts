import { BrowserWindow, ipcMain, IpcMainEvent } from 'electron'
import type {
  ApiSchema,
  EventEmitter,
  InvokeHandlers,
  SendSyncHandlers,
} from '../core/types'
import { eventChannel, invokeChannel, sendSyncChannel } from '../core/channels'

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
  handlers: {
    invoke?: InvokeHandlers<S>,
    sendSync?: SendSyncHandlers<S>
  },
): RegisterMainResult<S> {
  const unregisters: Array<() => void> = []

  if (handlers.invoke && schema.invoke) {
    for (const key of Object.keys(handlers.invoke) as Array<keyof typeof handlers.invoke>) {
      const fn = handlers.invoke[key]
      if (typeof fn !== 'function') continue
      const token = schema.invoke[key as string]
      if (!token) continue
      const channel = invokeChannel(token)
      ipcMain.handle(channel, (event, ...args: unknown[]) => {
        const handler = fn as (...a: any[]) => unknown
        if (token.__withEventParam) {
          return handler(event, ...args)
        }
        return handler(...args)
      })
      unregisters.push(() => ipcMain.removeHandler(channel))
    }
  }

  if (handlers.sendSync && schema.sendSync) {
    for (const key of Object.keys(
      handlers.sendSync,
    ) as Array<keyof typeof handlers.sendSync>) {
      const fn = handlers.sendSync[key]
      if (typeof fn !== 'function') continue

      const token = schema.sendSync[key as string]
      if (!token) continue

      const channel = sendSyncChannel(token)

      const listener = (
        event: IpcMainEvent,
        ...args: unknown[]
      ) => {
        const handler = fn as (...a: any[]) => unknown

        event.returnValue = token.__withEventParam
          ? handler(event, ...args)
          : handler(...args)
      }

      ipcMain.on(channel, listener)

      unregisters.push(() => {
        ipcMain.removeListener(channel, listener)
      })
    }
  }

  const emit: EventEmitter<S>['emit'] = (token, ...payload) => {
    const channel = eventChannel(token as never)
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send(channel, payload[0])
    }
  }

  const emitTo: EventEmitter<S>['emitTo'] = (window, token, ...payload) => {
    if (!window.isDestroyed()) {
      const channel = eventChannel(token as never);
      window.webContents.send(channel, payload[0]);
    }
  }

  return {
    emit,
    emitTo,
    dispose() {
      while (unregisters.length) unregisters.shift()?.()
    },
  }
}
