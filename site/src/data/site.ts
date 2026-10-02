/** Single source of truth for site-level metadata. */
export const site = {
  name: 'electron-use-ipc',
  packageName: '@cc-heart/electron-use-ipc',
  installCommand: 'pnpm add @cc-heart/electron-use-ipc',

  title: 'Type-safe IPC for Electron.',
  titleMuted: 'Define once. Infer everywhere.',
  description:
    'Write the contract once in shared code and every arg, return value and event payload is inferred across main, preload and renderer — no duplicated types, no casts.',

  license: 'MIT',
  author: 'carl chen',
  org: 'CarlOpenLab',
  year: 2026,

  links: {
    repo: 'https://github.com/CarlOpenLab/electron-use-ipc',
    npm: 'https://www.npmjs.com/package/@cc-heart/electron-use-ipc',
  },
} as const

export interface NavLink {
  label: string
  href: string
  external?: boolean
}

export const headerNav: NavLink[] = [
  { label: 'Docs', href: '/docs/getting-started' },
  { label: 'API', href: '/docs/api-reference' },
  { label: 'GitHub', href: site.links.repo, external: true },
  { label: 'npm', href: site.links.npm, external: true },
]
