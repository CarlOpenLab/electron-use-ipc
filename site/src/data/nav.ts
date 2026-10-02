/**
 * The docs sidebar. Order here is the reading order and drives the pager, so
 * it walks the architecture the library is built around:
 * contract -> main -> preload -> renderer -> reference.
 */
export interface DocPage {
  path: string
  title: string
  summary: string
}

export const docsNav: DocPage[] = [
  {
    path: '/docs/getting-started',
    title: 'Getting started',
    summary: 'Install and wire the four files, end to end.',
  },
  {
    path: '/docs/shared-contract',
    title: 'The shared contract',
    summary: 'defineApi, defineInvoke and defineEvent — one source of truth.',
  },
  {
    path: '/docs/main-process',
    title: 'Main process',
    summary: 'registerMain, inferred handlers and typed event emission.',
  },
  {
    path: '/docs/preload-bridge',
    title: 'Preload bridge',
    summary: 'exposeBridge and how window.api stays typed.',
  },
  {
    path: '/docs/renderer-hooks',
    title: 'Renderer hooks',
    summary: 'useInvoke, useEvent and the signal primitive.',
  },
  {
    path: '/docs/api-reference',
    title: 'API reference',
    summary: 'Every export, the channel namespace and error handling.',
  },
]

/**
 * The SSG output is `docs/<page>/index.html`, so both `/docs/x` and `/docs/x/`
 * are valid URLs. Compare on a normalized form or the pager silently disappears
 * on trailing-slash visits.
 */
export function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

export function docIndex(path: string): number {
  const target = normalizePath(path)
  return docsNav.findIndex((page) => page.path === target)
}
