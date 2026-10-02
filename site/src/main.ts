import { ViteSSG } from 'vite-ssg'
import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import App from './App.vue'
import './style.css'

import ApiTable from '@/components/ApiTable.vue'
import CodeBlock from '@/components/CodeBlock.vue'
import CodeCompare from '@/components/CodeCompare.vue'
import DocsIndex from '@/pages/DocsIndex.vue'
import Landing from '@/pages/Landing.vue'
import NotFound from '@/pages/NotFound.vue'
import ApiReference from '@/pages/docs/api-reference.md'
import GettingStarted from '@/pages/docs/getting-started.md'
import MainProcess from '@/pages/docs/main-process.md'
import PreloadBridge from '@/pages/docs/preload-bridge.md'
import RendererHooks from '@/pages/docs/renderer-hooks.md'
import SharedContract from '@/pages/docs/shared-contract.md'
import { docsNav } from '@/data/nav'

/**
 * Titles live in `data/nav.ts` so the sidebar and the <title> can never
 * disagree. This throws at build time if a route is missing from the nav.
 */
function docRoute(path: string, component: Component): RouteRecordRaw {
  const page = docsNav.find((entry) => entry.path === path)
  if (!page) throw new Error(`[site] "${path}" is not listed in docsNav`)
  return { path, component, meta: { layout: 'docs', title: page.title } }
}

export const routes: RouteRecordRaw[] = [
  { path: '/', component: Landing, meta: { layout: 'default' } },
  { path: '/docs', component: DocsIndex, meta: { layout: 'docs', title: 'Documentation' } },
  docRoute('/docs/getting-started', GettingStarted),
  docRoute('/docs/shared-contract', SharedContract),
  docRoute('/docs/main-process', MainProcess),
  docRoute('/docs/preload-bridge', PreloadBridge),
  docRoute('/docs/renderer-hooks', RendererHooks),
  docRoute('/docs/api-reference', ApiReference),
  { path: '/:pathMatch(.*)*', component: NotFound, meta: { layout: 'default', title: 'Not found' } },
]

export const createApp = ViteSSG(
  App,
  {
    routes,
    // vite-ssg hands this straight to createWebHistory/createMemoryHistory and
    // has no BASE_URL fallback of its own. Without it a sub-path deployment
    // (GitHub Pages project site) would resolve every URL against `/`, match
    // no route, and render NotFound on every page.
    base: import.meta.env.BASE_URL,
    scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  },
  ({ app }) => {
    // Registered globally so markdown pages can drop real, highlighted source
    // into the prose: <CodeBlock name="renderer" />
    app.component('CodeBlock', CodeBlock)
    app.component('CodeCompare', CodeCompare)
    app.component('ApiTable', ApiTable)
  },
)
