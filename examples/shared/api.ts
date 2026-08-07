import { defineApi, defineEvent, defineInvoke } from '../../src'

export interface User {
  id: string
  name: string
}

/**
 * Single source of truth: define the contract once.
 * Every arg / return / payload type flows from here to main, preload, renderer.
 */
export const api = defineApi({
  invoke: {
    getUser: defineInvoke<[string], User>(),
    listUsers: defineInvoke<[], User[]>(),
    createUser: defineInvoke<[string], User>(),
  },
  events: {
    'user:updated': defineEvent<User>(),
    'server:shutdown': defineEvent<void>(),
  },
})
