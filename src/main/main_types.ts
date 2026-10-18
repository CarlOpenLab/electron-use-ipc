
import { BrowserWindow, IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import type {
  ApiSchema,
  EventPayload,
  InvokeArgs,
  InvokeReturn,
  SendSyncArgs,
  SendSyncReturn,
} from '../core/types'

type MaybePromise<T> = T | Promise<T>;

export type InvokeHandler<
  T,
  TContext extends unknown[] = []
> = (...args: [...TContext, ...InvokeArgs<T>]) => MaybePromise<InvokeReturn<T>>;

export type SendSyncHandler<
  T,
  TContext extends unknown[] = []
> = (...args: [...TContext, ...SendSyncArgs<T>]) => SendSyncReturn<T>;

/** Mapped handler map for async `invoke` calls to the main process. */
export type InvokeHandlers<
  S extends ApiSchema,
  TContext extends unknown[] = []
> = {
  [K in keyof NonNullable<S['invoke']>]?: InvokeHandler<
    NonNullable<S['invoke']>[K],
    TContext
  >;
}

/** Mapped handler for synchronous main-process calls. */
export type SendSyncHandlers<
  S extends ApiSchema,
  TContext extends unknown[] = []
> = {
  [K in keyof NonNullable<S['sendSync']>]?: SendSyncHandler<
    NonNullable<S['sendSync']>[K],
    TContext
  >;
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
