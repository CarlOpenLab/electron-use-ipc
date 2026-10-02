export interface Feature {
  title: string
  text: string
  href: string
}

export const features: Feature[] = [
  {
    title: 'End-to-end inference',
    text: 'One defineApi() call types every argument, return value and payload across all three processes. No duplicated interfaces, no casts.',
    href: '/docs/shared-contract',
  },
  {
    title: 'Hook-style signals',
    text: 'useInvoke() and useEvent() hand back a tiny reactive signal — data, error and loading — that any framework can bind to.',
    href: '/docs/renderer-hooks',
  },
  {
    title: 'Zero runtime dependencies',
    text: 'The published package depends on nothing. The signal primitive is a Set and three closures, inlined into the bundle.',
    href: '/docs/api-reference',
  },
  {
    title: 'Framework-agnostic core',
    text: 'The renderer entry never imports Electron or a UI framework. Adapters for React, Vue and Solid are a handful of lines each.',
    href: '/docs/renderer-hooks',
  },
]
