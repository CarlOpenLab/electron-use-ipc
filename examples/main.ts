import { registerMain } from '../src/main'
import { api, type User } from './shared/api'

const users = new Map<string, User>()

// `main` is captured by closures below; declare first so handlers can emit.
const main = registerMain(api, {
  invoke: {
    // (id: string) => Promise<User>  — inferred from the token
    getUser: async (id) => {
      const u = users.get(id)
      if (!u) throw new Error(`no user ${id}`)
      return u
    },
    // () => Promise<User[]>
    listUsers: async () => [...users.values()],
    // (name: string) => Promise<User>
    createUser: async (name) => {
      const u: User = { id: crypto.randomUUID(), name }
      users.set(u.id, u)
      // typed event broadcast: payload must be User
      main.emit(api.events['user:updated'], u)
      return u
    },
  },
})

// void event: no payload allowed
main.emit(api.events['server:shutdown'])

main.dispose()
