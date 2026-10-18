/**
 * Core type tokens.
 *
 * The trick: a "token" is a runtime-light object (just a channel path + kind
 * marker) that carries generic type information through the type system.
 * Define once in `defineApi`, infer everywhere else.
 */

/** A tuple of invoke arguments. */
export type AnyArgs = readonly unknown[]

/** Type token for a request/response IPC method. */
export interface InvokeToken<
  Args extends AnyArgs = [],
  Return = void,
  WithEventParam extends boolean = false,
> {
  readonly __kind: 'invoke'
  readonly __path: string
  readonly __args: Args
  readonly __return: Return
  readonly __withEventParam: WithEventParam
}

/** Type token for a synchronous request/response IPC method. */
export interface SendSyncToken<
  Args extends AnyArgs = [],
  Return = void,
  WithEventParam extends boolean = false,
> {
  readonly __kind: 'sendSync'
  readonly __path: string
  readonly __args: Args
  readonly __return: Return
  readonly __withEventParam: WithEventParam
}

/** Type token for a one-way event pushed from main to renderer. */
export interface EventToken<Payload = void> {
  readonly __kind: 'event'
  readonly __path: string
  readonly __payload: Payload
}

/**
 * Shape of an API definition.
 * 
 * `invoke`/`sendSync`/`events` are all required so that
 * e.g. `api.invoke.foo` never widens to `| undefined`.
 * 
 * Note that `defineApi` will accept a `Partial<ApiSchema>` and handle the
 * not-undefined requirement for you.
 **/
export interface ApiSchema {
  invoke: Record<string, InvokeToken<any, any, any>>
  sendSync: Record<string, SendSyncToken<any, any, any>>
  events: Record<string, EventToken<any>>
}

/* ----------------------- type-level extractors ----------------------- */

export type SendSyncArgs<T> = T extends SendSyncToken<infer A, any, any> ? A : never
export type SendSyncReturn<T> = T extends SendSyncToken<any, infer R, any> ? R : never
export type SendSyncWithEventParam<T> = T extends SendSyncToken<any, any, infer E> ? E : false

export type InvokeArgs<T> = T extends InvokeToken<infer A, any, any> ? A : never
export type InvokeReturn<T> = T extends InvokeToken<any, infer R, any > ? R : never
export type InvokeWithEventParam<T> = T extends InvokeToken<any, any, infer E> ? E : false

export type EventPayload<T> = T extends EventToken<infer P> ? P : never

/** The bridge contract exposed on `window.api` by the preload script. */
export interface Bridge {
  invoke<A extends AnyArgs, R, W extends boolean>(
    token: InvokeToken<A, R, W>,
    ...args: A
  ): Promise<R>
  
  sendSync<A extends AnyArgs, R, W extends boolean>(
    token: SendSyncToken<A, R, W>,
    ...args: A
  ): R

  on<P>(
    token: EventToken<P>,
    cb: (payload: P) => void
  ): () => void
}
