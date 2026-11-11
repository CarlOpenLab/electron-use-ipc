// Minimal in-memory stand-in for Electron's IPC modules, used by the runtime
// test suite. `tests/build.mjs` aliases the bare `electron` specifier here.
// No real Electron binary is downloaded or started.

type Listener = (event: any, ...args: any[]) => any

const invokeHandlers = new Map<string, Listener>()
const mainListeners = new Map<string, Set<Listener>>()
const rendererListeners = new Map<string, Set<Listener>>()

export const sent: Array<{ channel: string; payload: unknown; windowId: number }> = []

let windows: BrowserWindow[] = []
let nextId = 1

export class BrowserWindow {
  destroyed = false
  webContents: {
    id: number
    send: (channel: string, payload: unknown) => void
  }

  constructor() {
    const id = nextId++
    this.webContents = {
      id,
      send: (channel, payload) => {
        sent.push({ channel, payload, windowId: id })
        for (const l of rendererListeners.get(channel) ?? []) l({}, payload)
      },
    }
  }

  isDestroyed(): boolean {
    return this.destroyed
  }

  static getAllWindows(): BrowserWindow[] {
    return windows
  }
}

export const ipcMain = {
  handle(channel: string, listener: Listener): void {
    // Mirrors Electron: only one handler per channel.
    if (invokeHandlers.has(channel)) {
      throw new Error(`Attempted to register a second handler for '${channel}'`)
    }
    invokeHandlers.set(channel, listener)
  },
  removeHandler(channel: string): void {
    invokeHandlers.delete(channel)
  },
  on(channel: string, listener: Listener): void {
    let set = mainListeners.get(channel)
    if (!set) {
      set = new Set()
      mainListeners.set(channel, set)
    }
    set.add(listener)
  },
  removeListener(channel: string, listener: Listener): void {
    mainListeners.get(channel)?.delete(listener)
  },
}

export const ipcRenderer = {
  invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    const handler = invokeHandlers.get(channel)
    if (!handler) {
      return Promise.reject(new Error(`No handler registered for '${channel}'`))
    }
    return Promise.resolve(handler({ sender: { id: 42 } }, ...args))
  },
  sendSync(channel: string, ...args: unknown[]): unknown {
    const listeners = mainListeners.get(channel)
    if (!listeners || listeners.size === 0) {
      throw new Error(`No handler registered for '${channel}'`)
    }
    const event: { sender: { id: number }; returnValue: unknown } = {
      sender: { id: 42 },
      returnValue: undefined,
    }
    for (const listener of listeners) listener(event, ...args)
    return event.returnValue
  },
  on(channel: string, listener: Listener): void {
    let set = rendererListeners.get(channel)
    if (!set) {
      set = new Set()
      rendererListeners.set(channel, set)
    }
    set.add(listener)
  },
  removeListener(channel: string, listener: Listener): void {
    rendererListeners.get(channel)?.delete(listener)
  },
}

export const contextBridge = {
  exposeInMainWorld(key: string, api: unknown): void {
    const g = globalThis as any
    g.window = g.window ?? {}
    g.window[key] = api
  },
}

export const nativeTheme = { shouldUseDarkColors: true }

export function __reset(): void {
  invokeHandlers.clear()
  mainListeners.clear()
  rendererListeners.clear()
  sent.length = 0
  windows = []
  nextId = 1
  ;(globalThis as any).window = undefined
}

export function __makeWindow(): BrowserWindow {
  const win = new BrowserWindow()
  windows.push(win)
  return win
}
