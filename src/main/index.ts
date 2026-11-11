import { BrowserWindow, ipcMain, IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import type { ApiSchema } from '../core/types'
import { eventChannel, invokeChannel, sendSyncChannel } from '../core/channels'
import {EventEmitter, InvokeHandlers, SendSyncHandlers } from './main_types'

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
    invokeWithEvent?: InvokeHandlers<S, [IpcMainInvokeEvent]>,
    invokeWithSenderId?: InvokeHandlers<S, [number]>,
    sendSync?: SendSyncHandlers<S>,
    sendSyncWithEvent?: SendSyncHandlers<S, [IpcMainEvent]>
    sendSyncWithSenderId?: SendSyncHandlers<S, [number]>
  },
): RegisterMainResult<S> {
  const unregisters: Array<() => void> = []

  const registerInvokeGroup = <K extends keyof NonNullable<S['invoke']>>(
    handlerMap: Partial<Record<K, any>> | undefined,
    invokeWrapper: (fn: any, event: IpcMainInvokeEvent, args: unknown[]) => unknown
  ) => {
    if (!handlerMap || !schema.invoke) return;

    for (const key of Object.keys(handlerMap) as Array<keyof typeof handlerMap>) {
      const fn = handlerMap[key];
      if (typeof fn !== 'function') continue;

      const token = schema.invoke[key as string];
      if (!token) continue;
      
      const channel = invokeChannel(token);

      ipcMain.handle(channel, (event, ...args: unknown[]) => {
        return invokeWrapper(fn, event, args);
      });

      unregisters.push(() => ipcMain.removeHandler(channel));
    }
  };

  const registerSendSyncGroup = <K extends keyof NonNullable<S['sendSync']>>(
    handlerMap: Partial<Record<K, any>> | undefined,
    sendSyncWrapper: (fn: any, event: IpcMainEvent, args: unknown[]) => unknown
  ) => {
    if (!handlerMap || !schema.sendSync) return;

    for (const key of Object.keys(handlerMap) as Array<keyof typeof handlerMap>) {
      const fn = handlerMap[key];
      if (typeof fn !== 'function') continue;

      const token = schema.sendSync[key as string];
      if (!token) continue;
      
      const channel = sendSyncChannel(token);

      const listener = (event: IpcMainEvent, ...args: unknown[]) => {
        event.returnValue = sendSyncWrapper(fn, event, args);
      };

      ipcMain.on(channel, listener);

      unregisters.push(() => ipcMain.removeListener(channel, listener));
    }
  };

  registerInvokeGroup(handlers.invoke, (fn, _event, args) => fn(...args));
  registerInvokeGroup(handlers.invokeWithEvent, (fn, event, args) => fn(event, ...args));
  registerInvokeGroup(handlers.invokeWithSenderId, (fn, event, args) => fn(event.sender.id, ...args));

  registerSendSyncGroup(handlers.sendSync, (fn, _event, args) => fn(...args));
  registerSendSyncGroup(handlers.sendSyncWithEvent, (fn, event, args) => fn(event, ...args));
  registerSendSyncGroup(handlers.sendSyncWithSenderId, (fn, event, args) => fn(event.sender.id, ...args));

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
