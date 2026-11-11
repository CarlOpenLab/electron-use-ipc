import { BrowserWindow, ipcMain } from 'electron'
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import type { ApiSchema } from '../core/types'
import { eventChannel, invokeChannel, sendSyncChannel } from '../core/channels'
import { toIpcErrorEnvelope } from '../core/errors'
import type { EventEmitter, InvokeHandlers, SendSyncHandlers } from './main_types'

export interface RegisterMainResult<S extends ApiSchema> extends EventEmitter<S> {}

type AnyFn = (...args: any[]) => unknown

/**
 * Register IPC handlers in the main process.
 *
 * Every method in the schema may have exactly ONE handler, registered in any
 * one of the `invoke*` / `sendSync*` groups. Registering the same method twice
 * (or registering a name that is not in the schema) throws immediately rather
 * than silently producing a channel nobody calls.
 *
 * @returns an emitter to push events to all renderer windows (or one window
 * via `emitTo`) + a `dispose()`.
 *
 * @example
 *   const main = registerMain(api, {
 *     invoke: {
 *       getUser: async (id) => db.users.get(id),
 *     },
 *   })
 *   main.emit(api.events['user:updated'], user)
 */
export function registerMain<S extends ApiSchema>(
  schema: S,
  handlers: {
    invoke?: InvokeHandlers<S>,
    invokeWithEvent?: InvokeHandlers<S, [IpcMainInvokeEvent]>,
    invokeWithSenderId?: InvokeHandlers<S, [number]>,
    sendSync?: SendSyncHandlers<S>,
    sendSyncWithEvent?: SendSyncHandlers<S, [IpcMainEvent]>,
    sendSyncWithSenderId?: SendSyncHandlers<S, [number]>,
  },
): RegisterMainResult<S> {
  const unregisters: Array<() => void> = []

  /** channel -> group that claimed it. Used to catch duplicate registration. */
  const claimed = new Map<string, string>()

  const claim = (channel: string, group: string): void => {
    const previous = claimed.get(channel)
    if (previous) {
      throw new Error(
        `[electron-use-ipc] duplicate handler for channel "${channel}": ` +
        `registered in both "${previous}" and "${group}". ` +
        `Each schema method may only have one handler.`,
      )
    }
    claimed.set(channel, group)
  }

  const registerInvokeGroup = (
    handlerMap: Record<string, unknown> | undefined,
    group: string,
    invokeWrapper: (fn: AnyFn, event: IpcMainInvokeEvent, args: unknown[]) => unknown,
  ): void => {
    if (!handlerMap || !schema.invoke) return

    for (const [key, fn] of Object.entries(handlerMap)) {
      if (typeof fn !== 'function') continue

      const token = schema.invoke[key]
      if (!token) {
        throw new Error(
          `[electron-use-ipc] handler "${key}" in group "${group}" has no matching ` +
          `token in schema.invoke — check the spelling.`,
        )
      }

      const channel = invokeChannel(token)
      claim(channel, group)

      ipcMain.handle(channel, (event, ...args: unknown[]) =>
        invokeWrapper(fn as AnyFn, event, args),
      )
      unregisters.push(() => ipcMain.removeHandler(channel))
    }
  }

  const registerSendSyncGroup = (
    handlerMap: Record<string, unknown> | undefined,
    group: string,
    sendSyncWrapper: (fn: AnyFn, event: IpcMainEvent, args: unknown[]) => unknown,
  ): void => {
    if (!handlerMap || !schema.sendSync) return

    for (const [key, fn] of Object.entries(handlerMap)) {
      if (typeof fn !== 'function') continue

      const token = schema.sendSync[key]
      if (!token) {
        throw new Error(
          `[electron-use-ipc] handler "${key}" in group "${group}" has no matching ` +
          `token in schema.sendSync — check the spelling.`,
        )
      }

      const channel = sendSyncChannel(token)
      claim(channel, group)

      const listener = (event: IpcMainEvent, ...args: unknown[]) => {
        try {
          event.returnValue = sendSyncWrapper(fn as AnyFn, event, args)
        } catch (error) {
          // Unlike ipcMain.handle, a synchronous listener that throws leaves
          // returnValue unset and can hang the renderer. Always reply.
          event.returnValue = toIpcErrorEnvelope(error)
        }
      }

      ipcMain.on(channel, listener)
      unregisters.push(() => ipcMain.removeListener(channel, listener))
    }
  }

  registerInvokeGroup(handlers.invoke, 'invoke', (fn, _event, args) => fn(...args))
  registerInvokeGroup(handlers.invokeWithEvent, 'invokeWithEvent', (fn, event, args) => fn(event, ...args))
  registerInvokeGroup(handlers.invokeWithSenderId, 'invokeWithSenderId', (fn, event, args) => fn(event.sender.id, ...args))

  registerSendSyncGroup(handlers.sendSync, 'sendSync', (fn, _event, args) => fn(...args))
  registerSendSyncGroup(handlers.sendSyncWithEvent, 'sendSyncWithEvent', (fn, event, args) => fn(event, ...args))
  registerSendSyncGroup(handlers.sendSyncWithSenderId, 'sendSyncWithSenderId', (fn, event, args) => fn(event.sender.id, ...args))

  // A method with no handler fails only when a renderer calls it, which is a
  // nasty surprise. Surface it at startup, and for sendSync install a fallback
  // listener so the synchronous call always gets a reply instead of hanging.
  const missing: string[] = []
  for (const [key, token] of Object.entries(schema.invoke)) {
    if (!claimed.has(invokeChannel(token))) missing.push(`invoke.${key}`)
  }
  for (const [key, token] of Object.entries(schema.sendSync)) {
    const channel = sendSyncChannel(token)
    if (claimed.has(channel)) continue
    missing.push(`sendSync.${key}`)
    const fallback = (event: IpcMainEvent) => {
      event.returnValue = toIpcErrorEnvelope(
        new Error(`[electron-use-ipc] no handler registered for sendSync.${key}`),
      )
    }
    ipcMain.on(channel, fallback)
    unregisters.push(() => ipcMain.removeListener(channel, fallback))
  }
  if (missing.length > 0) {
    console.warn(
      `[electron-use-ipc] no handler registered for: ${missing.join(', ')}. ` +
      `Calls to these methods will throw at runtime.`,
    )
  }

  const emit: EventEmitter<S>['emit'] = (token, ...payload) => {
    const channel = eventChannel(token as never)
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send(channel, payload[0])
    }
  }

  const emitTo: EventEmitter<S>['emitTo'] = (window, token, ...payload) => {
    if (!window.isDestroyed()) {
      const channel = eventChannel(token as never)
      window.webContents.send(channel, payload[0])
    }
  }

  return {
    emit,
    emitTo,
    dispose() {
      while (unregisters.length) unregisters.shift()?.()
      claimed.clear()
    },
  }
}
