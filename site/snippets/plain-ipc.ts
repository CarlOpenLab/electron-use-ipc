/**
 * BEFORE — the same feature wired by hand.
 *
 * This file is illustrative content for the landing page, not
 * compiled. It is kept as a real file so it highlights from
 * source like every other snippet.
 *
 * Three files, three chances to drift: the channel name is a
 * bare string, the payload types are restated at each boundary,
 * and nothing connects them.
 */

// ── main.ts ─────────────────────────
import { ipcMain } from 'electron'

ipcMain.handle('get-user', async (_event, id) => {
  // `id` is `any` here — the cast is a promise, not a check
  return db.users.get(id as string)
})

// ── preload.ts ──────────────────────
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getUser: (id: string) => ipcRenderer.invoke('get-user', id),
  onUserUpdated: (cb: (user: User) => void) =>
    ipcRenderer.on('user:updated', (_e, user) => cb(user)),
})

// ── renderer.ts ─────────────────────
interface User {
  id: string
  name: string
}

// cast it and hope
const user = (await window.api.getUser('1')) as User
// `any` all the way down
window.api.onUserUpdated((u: any) => console.log(u.name))
