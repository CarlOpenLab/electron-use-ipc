/**
 * A single synchronous Shiki highlighter, shared by the landing page's virtual
 * snippet module and the markdown pipeline. Everything runs at build time, so
 * the shipped page contains highlighted HTML and zero highlighting runtime.
 *
 * `createHighlighterCoreSync` + the JavaScript regex engine are used instead of
 * the async `createHighlighter` so `markdownOptions.highlight` can stay a plain
 * synchronous callback. That avoids the `@shikijs/markdown-it` /
 * `markdown-it-async` pairing, which does not match `unplugin-vue-markdown`'s
 * engine (`markdown-exit`, not markdown-it).
 */
import { createHighlighterCoreSync, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import langBash from 'shiki/langs/bash.mjs'
import langJson from 'shiki/langs/json.mjs'
import langTypeScript from 'shiki/langs/typescript.mjs'
import langVue from 'shiki/langs/vue.mjs'
import themeDark from 'shiki/themes/github-dark-default.mjs'
import themeLight from 'shiki/themes/github-light-default.mjs'

const THEME_LIGHT = 'github-light-default'
const THEME_DARK = 'github-dark-default'

const GRAMMARS = [langTypeScript, langBash, langJson, langVue]

/** Maps fence languages (and common aliases) onto the grammars we ship. */
const ALIASES: Record<string, string> = {
  ts: 'typescript',
  typescript: 'typescript',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  bash: 'bash',
  json: 'json',
  jsonc: 'json',
  vue: 'vue',
}

let highlighter: HighlighterCore | undefined

function engine(): HighlighterCore {
  highlighter ??= createHighlighterCoreSync({
    themes: [themeLight, themeDark],
    langs: GRAMMARS,
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  })
  return highlighter
}

function escapeHtml(code: string): string {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Highlight `code` into dual-theme HTML.
 *
 * `defaultColor: false` makes Shiki emit only `--shiki-light` / `--shiki-dark`
 * custom properties, so one HTML payload serves both themes. Unknown languages
 * fall back to escaped plain text rather than throwing at build time.
 */
export function highlight(code: string, lang = 'typescript'): string {
  const resolved = ALIASES[lang.trim().toLowerCase()]
  if (!resolved) return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`

  return engine().codeToHtml(code, {
    lang: resolved,
    themes: { light: THEME_LIGHT, dark: THEME_DARK },
    defaultColor: false,
  })
}
