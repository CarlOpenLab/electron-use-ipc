import type {
  AnyArgs,
  ApiSchema,
  EventToken,
  FilledApi,
  InvokeToken,
  SendSyncToken,
} from './types'

/**
 * Define a request/response IPC method. Returns a type token.
 *
 * @example
 *   getUser: defineInvoke<[string], User>()
 */
export function defineInvoke<
  Args extends AnyArgs = [],
  Return = void,
>(): InvokeToken<Args, Return> {
  return {
    __kind: 'invoke',
    __path: '',
  } as unknown as InvokeToken<Args, Return>
}

/**
 * Define a synchronous request/response IPC method. Returns a type token.
 *
 * @example
 *   isDarkMode: defineSendSync<[], boolean>()
 */
export function defineSendSync<
  Args extends AnyArgs = [],
  Return = void,
>(): SendSyncToken<Args, Return> {
  return {
    __kind: 'sendSync',
    __path: '',
  } as unknown as SendSyncToken<Args, Return>
}

/**
 * Define a one-way event (main -> renderer). Returns a type token.
 * @example
 *   'user:updated': defineEvent<User>()
 */
export function defineEvent<Payload = void>(): EventToken<Payload> {
  return { __kind: 'event', __path: '' } as unknown as EventToken<Payload>
}

/**
 * Define an IPC API contract. Walks the schema and stamps each token with its
 * channel path (derived from its key). Groups the caller omitted are filled
 * with `{}`; supplied groups keep their exact literal types.
 *
 * @example
 *   export const api = defineApi({
 *     invoke: {
 *       getUser: defineInvoke<[string], User>(),
 *       listUsers: defineInvoke<[], User[]>(),
 *     },
 *     events: {
 *       'user:updated': defineEvent<User>(),
 *     },
 *   })
 */
export function defineApi<const S extends Partial<ApiSchema>>(
  schema: S,
): FilledApi<S> {
  if (schema.invoke) {
    for (const key of Object.keys(schema.invoke)) {
      const t = schema.invoke[key]
      if (t && t.__kind === 'invoke') (t as { __path: string }).__path = `invoke:${key}`
    }
  }
  if (schema.sendSync) {
    for (const key of Object.keys(schema.sendSync)) {
      const t = schema.sendSync[key]
      if (t && t.__kind === 'sendSync') {
        (t as { __path: string }).__path = `sendSync:${key}`
      }
    }
  }
  if (schema.events) {
    for (const key of Object.keys(schema.events)) {
      const t = schema.events[key]
      if (t && t.__kind === 'event') (t as { __path: string }).__path = `event:${key}`
    }
  }
  return {
    invoke: {},
    sendSync: {},
    events: {},
    ...schema,
  } as unknown as FilledApi<S>
}
