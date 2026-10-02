/**
 * Exposes the repository's real source files to the site as build-time
 * highlighted HTML.
 *
 * Two virtual modules:
 *   - `virtual:shiki-snippets` — `examples/**` and `src/**` read as text and
 *     highlighted with Shiki. Nothing is imported, so the library's static
 *     `import ... from 'electron'` can never reach the bundle.
 *   - `virtual:lib-metrics` — measurements of the built `dist/`.
 *
 * A virtual module is used rather than a codegen script on purpose: a stale
 * generated file would silently display outdated library code, which is the
 * worst possible failure for a site whose credibility rests on showing the
 * real source.
 */
import { readFileSync } from 'node:fs'
import { normalizePath, type HmrContext, type ModuleNode, type Plugin } from 'vite'
import { highlight } from './highlight'
import { measure } from './metrics'

/** Shape of one highlighted source file, as consumed by the components. */
export interface Snippet {
  /** Raw source text, exactly as it exists in the repository. */
  code: string
  /** Shiki HTML with dual-theme CSS variables, ready for `v-html`. */
  html: string
  /** Repository-relative path, e.g. `examples/main.ts`. */
  path: string
  /** Language id passed to Shiki. */
  lang: string
}

const SNIPPETS_ID = 'virtual:shiki-snippets'
const RESOLVED_SNIPPETS_ID = '\0' + SNIPPETS_ID
const METRICS_ID = 'virtual:lib-metrics'
const RESOLVED_METRICS_ID = '\0' + METRICS_ID

/** Repo root — `site/`'s parent. */
const REPO_ROOT = new URL('../../', import.meta.url).pathname

/** The single source of truth for what the site displays. Change here only. */
const SNIPPETS: Record<string, string> = {
  // The library's own worked example, shown verbatim on the landing page.
  api: 'examples/shared/api.ts',
  main: 'examples/main.ts',
  preload: 'examples/preload.ts',
  renderer: 'examples/renderer.ts',
  'neg-check': 'examples/neg-check.ts',

  // Site-authored code, kept as real files so they are highlightable and
  // reviewable like everything else.
  'plain-ipc': 'site/snippets/plain-ipc.ts',
  'adapter-react': 'site/snippets/adapter-react.ts',
  'adapter-vue': 'site/snippets/adapter-vue.ts',

  // Library internals quoted in the docs.
  'core-signal': 'src/core/signal.ts',
  'main-register': 'src/main/index.ts',
}

const LANGS: Record<string, string> = { ts: 'typescript' }

function langOf(path: string): string {
  const ext = path.slice(path.lastIndexOf('.') + 1)
  return LANGS[ext] ?? 'text'
}

/** `JSON.stringify` + `<` escaping, so no snippet can break out of a script tag. */
function serialize(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function shikiSnippets(): Plugin {
  let isBuild = false

  const abs = (rel: string) => normalizePath(`${REPO_ROOT}${rel}`)
  const watched = new Set(Object.values(SNIPPETS).map(abs))

  function renderSnippets(): string {
    const entries = Object.entries(SNIPPETS).map(([name, rel]) => {
      const file = abs(rel)
      const code = readFileSync(file, 'utf8')
      // Read as text only. Importing would pull electron into the bundle.
      const html = highlight(code, langOf(rel))
      return `  ${serialize(name)}: { code: ${serialize(code)}, html: ${serialize(html)}, path: ${serialize(rel)}, lang: ${serialize(langOf(rel))} }`
    })
    return `export const snippets = {\n${entries.join(',\n')}\n}\n`
  }

  function renderMetrics(): string {
    const metrics = measure(normalizePath(REPO_ROOT).replace(/\/$/, ''))
    if (!metrics.available && isBuild) {
      throw new Error(
        '[site] dist/ is missing, so the landing page cannot show real metrics.\n' +
          '       Run `pnpm -C .. build` (or `pnpm build` in site/) before building the site.',
      )
    }
    return `export const metrics = ${serialize(metrics)}\n`
  }

  return {
    name: 'site:shiki-snippets',
    enforce: 'pre',

    configResolved(config) {
      isBuild = config.command === 'build'
      // Snippets live outside `site/`; without this the dev server 403s them.
      config.server.fs.allow = [...(config.server.fs.allow ?? []), REPO_ROOT]
    },

    resolveId(id) {
      if (id === SNIPPETS_ID) return RESOLVED_SNIPPETS_ID
      if (id === METRICS_ID) return RESOLVED_METRICS_ID
    },

    // Snippet sources sit outside the Vite root, so they are not watched by
    // default. Without this, editing `examples/main.ts` would not trigger
    // handleHotUpdate at all.
    buildStart() {
      for (const file of watched) this.addWatchFile(file)
    },

    load(id) {
      if (id === RESOLVED_SNIPPETS_ID) return renderSnippets()
      if (id === RESOLVED_METRICS_ID) return renderMetrics()
    },

    handleHotUpdate(ctx: HmrContext): void | ModuleNode[] {
      if (!watched.has(normalizePath(ctx.file))) return
      // A snippet file is not itself a module, so nothing links the change to
      // the virtual module that read it: `load()` would keep returning the
      // cached HTML and the reload below would re-serve the old code. Invalidate
      // explicitly, so the next request re-reads the file.
      for (const id of [RESOLVED_SNIPPETS_ID, RESOLVED_METRICS_ID]) {
        const mod = ctx.server.moduleGraph.getModuleById(id)
        if (mod) ctx.server.moduleGraph.invalidateModule(mod)
      }
      // The virtual module exports plain strings, so a granular HMR boundary
      // would still fall back to a reload. Reloading outright also guarantees
      // the page can never show new HTML next to old code text.
      ctx.server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}
