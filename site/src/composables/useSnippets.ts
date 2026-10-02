import { snippets, type Snippet } from 'virtual:shiki-snippets'

/**
 * Access to the build-time highlighted source files registered in
 * `plugins/shiki-snippets.ts`. Throws loudly on an unknown name rather than
 * rendering an empty code block.
 */
export function useSnippet(name: string): Snippet {
  const snippet = snippets[name]
  if (!snippet) {
    const known = Object.keys(snippets).join(', ')
    throw new Error(`[site] unknown snippet "${name}". Registered: ${known}`)
  }
  return snippet
}

export { snippets }
export type { Snippet }
