import type { IpcErrorEnvelope } from './types'

const KEY = '__eui_error__'

/**
 * `ipcRenderer.sendSync` has no equivalent of `invoke`'s promise rejection:
 * whatever is written to `event.returnValue` is delivered verbatim. Errors are
 * therefore carried back as a plain, structured-clone-safe envelope and
 * rethrown in the renderer by `sendSync()`.
 */
export function isIpcErrorEnvelope(value: unknown): value is IpcErrorEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    KEY in value &&
    typeof (value as Record<string, unknown>)[KEY] === 'string'
  )
}

/** Convert a thrown value into something that can cross the IPC boundary. */
export function toIpcErrorEnvelope(error: unknown): IpcErrorEnvelope {
  return {
    __eui_error__: error instanceof Error ? error.message : String(error),
  }
}
