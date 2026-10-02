<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { docIndex, docsNav } from '@/data/nav'

const route = useRoute()

// docIndex normalizes the trailing slash, which SSG-style URLs may carry.
const index = computed(() => docIndex(route.path))
const previous = computed(() => (index.value > 0 ? docsNav[index.value - 1] : undefined))
const next = computed(() =>
  index.value >= 0 && index.value < docsNav.length - 1 ? docsNav[index.value + 1] : undefined,
)
</script>

<template>
  <nav
    v-if="previous || next"
    class="mt-16 grid gap-px border-t border-border bg-border"
    :class="previous && next ? 'sm:grid-cols-2' : 'sm:grid-cols-1'"
    aria-label="Pagination"
  >
    <RouterLink
      v-if="previous"
      :to="previous.path"
      class="group flex flex-col gap-1 bg-background px-6 py-5 transition-colors hover:bg-code"
    >
      <span class="label">Previous</span>
      <span class="text-sm font-medium text-foreground transition-transform group-hover:-translate-x-0.5">
        {{ previous.title }}
      </span>
    </RouterLink>
    <RouterLink
      v-if="next"
      :to="next.path"
      class="group flex flex-col items-end gap-1 bg-background px-6 py-5 text-right transition-colors hover:bg-code"
    >
      <span class="label">Next</span>
      <span class="text-sm font-medium text-foreground transition-transform group-hover:translate-x-0.5">
        {{ next.title }}
      </span>
    </RouterLink>
  </nav>
</template>
