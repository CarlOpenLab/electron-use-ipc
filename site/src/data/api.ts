/** The public API surface, mirroring the README's table plus `signal`. */
export type ApiSide = 'shared' | 'main' | 'preload' | 'renderer' | 'core'

export interface ApiEntry {
  name: string
  signature: string
  side: ApiSide
  purpose: string
}

export const apiEntries: ApiEntry[] = [
  {
    name: 'defineApi',
    signature: 'defineApi(schema)',
    side: 'shared',
    purpose: 'Stamps channel paths onto tokens while preserving literal types.',
  },
  {
    name: 'defineInvoke',
    signature: 'defineInvoke<Args, Return>()',
    side: 'shared',
    purpose: 'Type token for a request/response method.',
  },
  {
    name: 'defineEvent',
    signature: 'defineEvent<Payload>()',
    side: 'shared',
    purpose: 'Type token for a one-way main → renderer event.',
  },
  {
    name: 'registerMain',
    signature: 'registerMain(api, { invoke })',
    side: 'main',
    purpose: 'Registers handlers; returns { emit, dispose }.',
  },
  {
    name: 'exposeBridge',
    signature: 'exposeBridge(api, name?)',
    side: 'preload',
    purpose: 'Exposes a typed window[name] through contextBridge.',
  },
  {
    name: 'useInvoke',
    signature: 'useInvoke(token, opts?)',
    side: 'renderer',
    purpose: 'Hook returning { data, error, loading, call } signals.',
  },
  {
    name: 'useEvent',
    signature: 'useEvent(token)',
    side: 'renderer',
    purpose: 'Hook returning Signal<Payload | undefined> for pushed events.',
  },
  {
    name: 'invoke',
    signature: 'invoke(token, ...args)',
    side: 'renderer',
    purpose: 'One-shot typed call, no reactive state.',
  },
  {
    name: 'signal',
    signature: 'signal(initial)',
    side: 'core',
    purpose: 'The framework-agnostic reactive primitive behind every hook.',
  },
]
