import { onMounted, ref } from 'vue'

/**
 * Theme state, kept SSR-safe.
 *
 * The `dark` class is applied by the inline script in index.html before first
 * paint; `<html>` is not part of the Vue tree, so that never affects hydration.
 *
 * `isDark` deliberately starts `false` on both the server and the client's
 * first render — anything else would make the hydration vnode differ from the
 * server HTML. The real value is read back from the DOM in `onMounted`, which
 * only ever runs in the browser.
 *
 * Do not branch markup on `isDark`. Everything that varies with the theme is
 * driven by `dark:` utilities instead; this ref exists only for the toggle's
 * own bookkeeping.
 */
const isDark = ref(false)

function apply(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

export function useTheme() {
  onMounted(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })

  function toggle(): void {
    isDark.value = !isDark.value
    try {
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    } catch {
      // Private mode or blocked storage: the theme still applies for this page.
    }
    apply(isDark.value)
  }

  return { isDark, toggle }
}
