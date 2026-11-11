import type { IpcErrorEnvelope } from './types'

/**
 * A deliberately unusual discriminator: a normal handler return value that
 * happens to contain this exact string is effectively impossible, whereas a
 * short field name could collide with user data.
 */
const TAG = '@cc-heart/electron-use-ipc/error@1'

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
    (value as Record<string, unknown>).__eui_error__ === TAG
  )
}

/** Convert a thrown value into something that can cross the IPC boundary. */
export function toIpcErrorEnvelope(error: unknown): IpcErrorEnvelope {
  const err = error instanceof Error ? error : undefined
  return {
    __eui_error__: TAG,
    message: err ? err.message : String(error),
    name: err?.name ?? 'Error',
    ...(err?.stack !== undefined ? { stack: err.stack } : {}),
  }
}
