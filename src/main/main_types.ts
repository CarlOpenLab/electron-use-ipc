
import { BrowserWindow, IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import type {
  ApiSchema,
  EventPayload,
  InvokeArgs,
  InvokeReturn,
  InvokeWithEventParam,
  SendSyncArgs,
  SendSyncReturn,
  SendSyncWithEventParam,
} from '../core/types'

type InvokeHandler<T> =
  InvokeWithEventParam<T> extends true
    ? (
        event: IpcMainInvokeEvent,
        ...args: InvokeArgs<T>
      ) => InvokeReturn<T> | Promise<InvokeReturn<T>>
    : (
        ...args: InvokeArgs<T>
      ) => InvokeReturn<T> | Promise<InvokeReturn<T>>

type SendSyncHandler<T> =
  SendSyncWithEventParam<T> extends true
    ? (
        event: IpcMainEvent,
        ...args: SendSyncArgs<T>
      ) => SendSyncReturn<T>
    : (
        ...args: SendSyncArgs<T>
      ) => SendSyncReturn<T>

/** Mapped handler map for async `invoke` calls to the main process. */
export type InvokeHandlers<S extends ApiSchema> = {
  [K in keyof NonNullable<S['invoke']>]?: InvokeHandler<
    NonNullable<S['invoke']>[K]
  >
}

/** Mapped handler for synchronous main-process calls. */
export type SendSyncHandlers<S extends ApiSchema> = {
  [K in keyof NonNullable<S['sendSync']>]?: SendSyncHandler<
    NonNullable<S['sendSync']>[K]
  >
}

/** The event emitter returned by `registerMain`. */
export interface EventEmitter<S extends ApiSchema> {
  /** Send an event from the main process to all windows */
  emit<K extends keyof NonNullable<S['events']>>(
    token: NonNullable<S['events']>[K],
    ...payload: EventPayload<NonNullable<S['events']>[K]> extends void ? [] : [EventPayload<NonNullable<S['events']>[K]>]
  ): void

  /** Send an event from the main process to a single specified window */
  emitTo<K extends keyof NonNullable<S['events']>>(
    window: BrowserWindow,
    token: NonNullable<S['events']>[K],
    ...payload: EventPayload<NonNullable<S['events']>[K]> extends void ? [] : [EventPayload<NonNullable<S['events']>[K]>]
  ): void

  dispose(): void
}
