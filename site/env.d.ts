/// <reference types="vite/client" />

declare module '*.md' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

/*
 * The two virtual modules are declared in terms of the plugin's own exported
 * types rather than restated here — restating them is exactly the kind of
 * duplicated-interface drift this library exists to prevent.
 */

/** Build-time highlighted source snippets, read from the real repository files. */
declare module 'virtual:shiki-snippets' {
  import type { Snippet } from './plugins/shiki-snippets'
  export const snippets: Record<string, Snippet>
  export type { Snippet }
}

/** Real measurements taken from the built library in `dist/`. */
declare module 'virtual:lib-metrics' {
  import type { Metrics } from './plugins/metrics'
  export const metrics: Metrics
  export type { Metrics, MetricsFile } from './plugins/metrics'
}
