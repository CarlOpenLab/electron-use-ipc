import { fileURLToPath } from 'node:url'
import Tailwind from '@tailwindcss/vite'
import Vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import { defineConfig } from 'vite'
// Type-only import: also loads vite-ssg's `declare module 'vite'` augmentation,
// which is what makes `ssgOptions` below typecheck.
import type { ViteSSGOptions } from 'vite-ssg'
import { highlight } from './plugins/highlight'
import { shikiSnippets } from './plugins/shiki-snippets'

/**
 * GitHub Pages serves a project site from `/<repo>/`, so the deploy workflow
 * sets BASE_PATH. Everything else derives from it: hashed asset URLs, the
 * router's history base (src/main.ts) and the docs' cross-links (below). Unset
 * locally, so `pnpm dev` keeps serving from the root.
 */
const base = process.env.BASE_PATH || '/'

/** Same value with no trailing slash, for concatenating paths. */
const basePrefix = base.replace(/\/$/, '')

const ssgOptions: Partial<ViteSSGOptions> = {
  entry: 'src/main.ts',
  // /docs/api-reference -> docs/api-reference/index.html (clean URLs)
  dirStyle: 'nested',
  formatting: 'minify',
  // Routes are enumerated in src/main.ts, so there is nothing dynamic to crawl.
  includedRoutes: (paths) => paths.filter((p) => !p.includes(':') && !p.includes('*')),
}

export default defineConfig({
  base,
  plugins: [
    // `enforce: 'pre'` — must resolve the virtual modules before anything else.
    shikiSnippets(),
    // Markdown files are compiled to Vue SFCs, so plugin-vue must accept them.
    Vue({ include: [/\.vue$/, /\.md$/] }),
    Markdown({
      wrapperClasses: 'doc-prose',
      headEnabled: false,
      /**
       * Docs cross-link with router paths (`/docs/main-process`). Those are
       * root-absolute, so off a sub-path they would navigate clean out of the
       * site. Prefix them with the base at token level — the only place that
       * knows both the link and the base, and it keeps the .md files authored
       * against the router's own paths.
       */
      markdownSetup(md) {
        md.core.ruler.push('site:base-links', (state) => {
          // Runs after the inline ruler, so inline tokens carry their children.
          for (const token of state.tokens) {
            for (const child of token.children ?? []) {
              for (const attr of ['href', 'src']) {
                const value = child.attrGet(attr)
                if (value?.startsWith('/') && !value.startsWith('//')) {
                  child.attrSet(attr, basePrefix + value)
                }
              }
            }
          }
        })
      },
      markdownOptions: {
        html: true,
        linkify: false,
        // Synchronous Shiki, straight in. No @shikijs/markdown-it: that plugin
        // targets markdown-it, while this one runs on markdown-exit.
        highlight: (code, lang) => highlight(code, lang),
      },
    }),
    Tailwind(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Snippet sources live in the repository root, outside the Vite root.
  server: { fs: { allow: ['..'] } },
  ssgOptions,
})
