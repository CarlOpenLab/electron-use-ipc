import { BrowserWindow, ipcMain } from 'electron'
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import type { ApiSchema } from '../core/types'
import { eventChannel, invokeChannel, sendSyncChannel } from '../core/channels'
import { toIpcErrorEnvelope } from '../core/errors'
import type { EventEmitter, InvokeHandlers, SendSyncHandlers } from './main_types'

export interface RegisterMainResult<S extends ApiSchema> extends EventEmitter<S> {}

type AnyFn = (...args: any[]) => unknown

/**
 * channel -> group that owns it. This is process-wide rather than per
 * `registerMain` call: `ipcMain.on` accepts several listeners for one channel
 * and the last one to write `event.returnValue` wins, so a second call would
 * otherwise shadow the first one silently.
 */
const channelOwners = new Map<string, string>()

/**
 * Register IPC handlers in the main process.
 *
 * Every method in the schema may have exactly ONE handler, registered in any
 * one of the `invoke*` / `sendSync*` groups. Registering the same method twice
 * (or registering a name that is not in the schema) throws immediately rather
 * than silently producing a channel nobody calls. Registration is atomic: if
 * anything throws, every handler/listener installed by this call is removed so
 * the process is not left half-registered and a retry can succeed.
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
  /** Channels claimed by THIS call; released on dispose or rollback. */
  const owned: string[] = []

  const claim = (channel: string, group: string): void => {
    const previous = channelOwners.get(channel)
    if (previous !== undefined) {
      throw new Error(
        `[electron-use-ipc] duplicate handler for channel "${channel}": already registered by ` +
        `"${previous}", cannot register it again in "${group}". Each schema method may only ` +
        `have one handler. Call dispose() on the earlier result before re-registering.`,
      )
    }
    channelOwners.set(channel, group)
    owned.push(channel)
  }

  /** Remove everything this call installed. Safe to call more than once. */
  const rollback = (): void => {
    while (unregisters.length) {
      try {
        unregisters.shift()?.()
      } catch {
        // A listener may already have been removed by another dispose().
      }
    }
    for (const channel of owned) channelOwners.delete(channel)
    owned.length = 0
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

  const missing: string[] = []

  try {
    registerInvokeGroup(handlers.invoke, 'invoke', (fn, _event, args) => fn(...args))
    registerInvokeGroup(handlers.invokeWithEvent, 'invokeWithEvent', (fn, event, args) => fn(event, ...args))
    registerInvokeGroup(handlers.invokeWithSenderId, 'invokeWithSenderId', (fn, event, args) => fn(event.sender.id, ...args))

    registerSendSyncGroup(handlers.sendSync, 'sendSync', (fn, _event, args) => fn(...args))
    registerSendSyncGroup(handlers.sendSyncWithEvent, 'sendSyncWithEvent', (fn, event, args) => fn(event, ...args))
    registerSendSyncGroup(handlers.sendSyncWithSenderId, 'sendSyncWithSenderId', (fn, event, args) => fn(event.sender.id, ...args))

    // A method with no handler fails only when a renderer calls it. Surface it
    // at startup, and for sendSync install a fallback listener so the
    // synchronous call always gets a reply instead of hanging the renderer.
    for (const [key, token] of Object.entries(schema.invoke)) {
      if (!channelOwners.has(invokeChannel(token))) missing.push(`invoke.${key}`)
    }
    for (const [key, token] of Object.entries(schema.sendSync)) {
      const channel = sendSyncChannel(token)
      if (channelOwners.has(channel)) continue
      missing.push(`sendSync.${key}`)

      const fallback = (event: IpcMainEvent) => {
        // A later registerMain() may have installed a real handler for this
        // channel. Listeners run in registration order; writing here would let
        // this stale fallback overwrite the real reply with an error envelope.
        if (channelOwners.has(channel)) return
        event.returnValue = toIpcErrorEnvelope(
          new Error(`[electron-use-ipc] no handler registered for sendSync.${key}`),
        )
      }
      ipcMain.on(channel, fallback)
      unregisters.push(() => ipcMain.removeListener(channel, fallback))
    }
  } catch (error) {
    // Never leave a half-registered process behind: a leaked ipcMain.handle
    // would make any retry fail with "Attempted to register a second handler".
    rollback()
    throw error
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
    dispose: rollback,
  }
}
