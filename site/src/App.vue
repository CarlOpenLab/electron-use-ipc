<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import DocsLayout from '@/layouts/DocsLayout.vue'

const route = useRoute()

const layouts = {
  default: DefaultLayout,
  docs: DocsLayout,
} as const

/**
 * Layout is chosen from route meta rather than markdown frontmatter: the route
 * table in main.ts stays the single place that decides how a page is dressed,
 * and the .md files stay pure content.
 */
const layout = computed(() => {
  const name = route.meta.layout
  return (typeof name === 'string' && name in layouts
    ? layouts[name as keyof typeof layouts]
    : DefaultLayout)
})
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>
