import type { EventToken, InvokeToken, SendSyncToken } from './types'

/** Internal channel namespace to avoid collisions. */
const NS = '__eui__'

/** Resolve the ipc channel for an invoke token. */
export const invokeChannel = (t: InvokeToken): string => `${NS}:${t.__path}`
/** Resolve the IPC channel for a synchronous token. */
export const sendSyncChannel = (t: SendSyncToken): string => `${NS}:${t.__path}`
/** Resolve the ipc channel for an event token. */
export const eventChannel = (t: EventToken): string => `${NS}:${t.__path}`
