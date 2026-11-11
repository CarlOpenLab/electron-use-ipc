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
> {
  readonly __kind: 'invoke'
  readonly __path: string
  readonly __args: Args
  readonly __return: Return
}

/** Type token for a synchronous request/response IPC method. */
export interface SendSyncToken<
  Args extends AnyArgs = [],
  Return = void,
> {
  readonly __kind: 'sendSync'
  readonly __path: string
  readonly __args: Args
  readonly __return: Return
}

/** Type token for a one-way event pushed from main to renderer. */
export interface EventToken<Payload = void> {
  readonly __kind: 'event'
  readonly __path: string
  readonly __payload: Payload
}

/**
 * Shape of a *fully filled* API definition, used as the constraint of
 * `registerMain` / `exposeBridge`. All three groups are required so that
 * `api.invoke.foo` never widens to `| undefined` in those helpers.
 */
export interface ApiSchema {
  invoke: Record<string, InvokeToken<any, any>>
  sendSync: Record<string, SendSyncToken<any, any>>
  events: Record<string, EventToken<any>>
}

/**
 * The return type of `defineApi`: groups the caller omitted are filled with
 * `{}`, while groups that WERE supplied keep their exact literal keys.
 *
 * IMPORTANT: do not replace this with `S & ApiSchema`. Intersecting with
 * `ApiSchema` introduces a `Record<string, InvokeToken<any, any>>` index
 * signature, which turns typos such as `api.invoke.getUesr` into a valid
 * `InvokeToken<any, any>` and defeats the whole point of the library.
 */
export type FilledApi<S extends Partial<ApiSchema>> = {
  invoke: S extends { invoke: infer I } ? I : {}
  sendSync: S extends { sendSync: infer SS } ? SS : {}
  events: S extends { events: infer E } ? E : {}
}

/* ----------------------- type-level extractors ----------------------- */

export type SendSyncArgs<T> = T extends SendSyncToken<infer A, any> ? A : never
export type SendSyncReturn<T> = T extends SendSyncToken<any, infer R> ? R : never

export type InvokeArgs<T> = T extends InvokeToken<infer A, any> ? A : never
export type InvokeReturn<T> = T extends InvokeToken<any, infer R> ? R : never

export type EventPayload<T> = T extends EventToken<infer P> ? P : never

/** The bridge contract exposed on `window.api` by the preload script. */
export interface Bridge {
  invoke<A extends AnyArgs, R>(
    token: InvokeToken<A, R>,
    ...args: A
  ): Promise<R>

  sendSync<A extends AnyArgs, R>(
    token: SendSyncToken<A, R>,
    ...args: A
  ): R | IpcErrorEnvelope

  on<P>(
    token: EventToken<P>,
    cb: (payload: P) => void
  ): () => void
}

/**
 * Structured-clone-safe envelope used to carry a main-process exception back
 * through `ipcRenderer.sendSync`. See `core/errors.ts`.
 */
export interface IpcErrorEnvelope {
  readonly __eui_error__: string
}
