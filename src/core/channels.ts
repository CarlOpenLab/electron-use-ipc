import type { EventToken, InvokeToken } from './types'

/** Internal channel namespace to avoid collisions. */
const NS = '__eui__'

/** Resolve the ipc channel for an invoke token. */
export const invokeChannel = (t: InvokeToken): string => `${NS}:${t.__path}`
/** Resolve the ipc channel for an event token. */
export const eventChannel = (t: EventToken): string => `${NS}:${t.__path}`
