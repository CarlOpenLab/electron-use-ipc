<script setup lang="ts">
import { docsNav } from '@/data/nav'
</script>

<template>
  <nav aria-label="Documentation">
    <p class="label px-3 pb-3">Documentation</p>
    <ul class="space-y-px">
      <li v-for="(page, index) in docsNav" :key="page.path">
        <RouterLink
          :to="page.path"
          class="flex items-baseline gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-code hover:text-foreground"
          active-class="bg-code text-foreground"
        >
          <span class="font-mono text-[11px] tabular-nums text-muted-foreground">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span>{{ page.title }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
