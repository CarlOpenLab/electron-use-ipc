<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { toggle } = useTheme()
</script>

<template>
  <!--
    Both icons are always rendered; CSS alone decides which one shows. Branching
    on `isDark` would make the client's first render differ from the SSG output
    and break hydration.
  -->
  <button
    type="button"
    class="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground"
    aria-label="Toggle color theme"
    @click="toggle"
  >
    <svg
      class="size-4 dark:hidden"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
    <svg
      class="hidden size-4 dark:block"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  </button>
</template>
