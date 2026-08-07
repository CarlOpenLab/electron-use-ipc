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

/** Type token for a one-way event pushed from main to renderer. */
export interface EventToken<Payload = void> {
  readonly __kind: 'event'
  readonly __path: string
  readonly __payload: Payload
}

/** Shape of an API definition. `invoke`/`events` are required (use `{}` if empty)
 * so that `api.invoke.foo` never widens to `| undefined`. */
export interface ApiSchema {
  invoke: Record<string, InvokeToken<any, any>>
  events: Record<string, EventToken<any>>
}

/* ----------------------- type-level extractors ----------------------- */

export type InvokeArgs<T> = T extends InvokeToken<infer A, any> ? A : never
export type InvokeReturn<T> = T extends InvokeToken<any, infer R> ? R : never
export type EventPayload<T> = T extends EventToken<infer P> ? P : never

/** Mapped handler map for the main process. */
export type InvokeHandlers<S extends ApiSchema> = {
  [K in keyof NonNullable<S['invoke']>]?: (
    ...args: InvokeArgs<NonNullable<S['invoke']>[K]>
  ) => InvokeReturn<NonNullable<S['invoke']>[K]> | Promise<InvokeReturn<NonNullable<S['invoke']>[K]>>
}

/** The event emitter returned by `registerMain`. */
export interface EventEmitter<S extends ApiSchema> {
  emit<K extends keyof NonNullable<S['events']>>(
    token: NonNullable<S['events']>[K],
    ...payload: EventPayload<NonNullable<S['events']>[K]> extends void ? [] : [EventPayload<NonNullable<S['events']>[K]>]
  ): void
  dispose(): void
}

/** The bridge contract exposed on `window.api` by the preload script. */
export interface Bridge {
  invoke<A extends AnyArgs, R>(token: InvokeToken<A, R>, ...args: A): Promise<R>
  on<P>(token: EventToken<P>, cb: (payload: P) => void): () => void
}
