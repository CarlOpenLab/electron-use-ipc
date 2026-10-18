import type {
  AnyArgs,
  ApiSchema,
  EventToken,
  InvokeToken,
  SendSyncToken,
} from './types'

/**
 * Define an async request/response IPC method. Returns a type token.
 * 
 * Overloads are the only reliable way to insure that type inference
 * correctly captures the optional `withEventParam` parameter.
 * 
 * @example
 *   getUser: defineInvoke<[string], User>({ withEventParam: true })
 */
export function defineInvoke<Args extends AnyArgs, Return>(
  options: { withEventParam: true },
): InvokeToken<Args, Return, true>

/**
 * Define an async request/response IPC method. Returns a type token.
 * 
 * Overloads are the only reliable way to insure that type inference
 * correctly captures the optional `withEventParam` parameter.
 * 
 * @example
 *   getUser: defineInvoke<[string], User>()
 */
export function defineInvoke<Args extends AnyArgs, Return>(
  options?: { withEventParam?: false },
): InvokeToken<Args, Return, false>

/**
 * Define a request/response IPC method. Returns a type token.
 * 
 * @example
 *   getUser: defineInvoke<[string], User>({ withEventParam: false })
 */
export function defineInvoke<
  Args extends AnyArgs = [],
  Return = void,
>(
  options?: { withEventParam?: boolean },
): InvokeToken<
  Args,
  Return,
  boolean
> {
  return {
    __kind: 'invoke',
    __path: '',
    __withEventParam: options?.withEventParam === true,
  } as never
}

/**
 * Define a synchronous request/response IPC method. Returns a type token.
 * 
 * Overloads are the only reliable way to insure that type inference
 * correctly captures the optional `withEventParam` parameter.
 * 
 * @example
 *   getUser: defineSendSync<[string], User>({ withEventParam: true })
 */
export function defineSendSync<Args extends AnyArgs, Return>(
  options: { withEventParam: true },
): SendSyncToken<Args, Return, true>

/**
 * Define a synchronous request/response IPC method. Returns a type token.
 * 
 * Overloads are the only reliable way to insure that type inference
 * correctly captures the optional `withEventParam` parameter.
 * 
 * @example
 *   getUser: defineSendSync<[string], User>()
 */
export function defineSendSync<Args extends AnyArgs, Return>(
  options?: { withEventParam?: false },
): SendSyncToken<Args, Return, false>

/**
 * Define a synchronous request/response IPC method. Returns a type token.
 * 
 * @example
 *   getUser: defineSendSync<[string], User>({ withEventParam: false })
 */
export function defineSendSync(
  options?: { withEventParam?: boolean },
): SendSyncToken<AnyArgs, unknown, boolean> {
  return {
    __kind: 'sendSync',
    __path: '',
    __withEventParam: options?.withEventParam === true,
  } as SendSyncToken<AnyArgs, unknown, boolean>
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
 * channel path (derived from its key). Type of the schema is preserved, so all
 * downstream consumers infer args/return/payload automatically.
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
export function defineApi<const S extends Partial<ApiSchema>>(schema: S): S & ApiSchema {
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
  } as S & ApiSchema
}
