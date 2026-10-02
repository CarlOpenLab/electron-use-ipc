<script setup lang="ts">
import { metrics } from 'virtual:lib-metrics'
import { headerNav, site } from '@/data/site'
import ThemeToggle from './ThemeToggle.vue'
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-sm">
    <div class="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
      <RouterLink to="/" class="flex shrink-0 items-center gap-2">
        <span class="size-1.5 rounded-full bg-accent" aria-hidden="true" />
        <span class="font-mono text-sm font-medium tracking-tight">{{ site.name }}</span>
      </RouterLink>

      <nav class="ml-auto flex min-w-0 items-center gap-1" aria-label="Main">
        <template v-for="link in headerNav" :key="link.href">
          <!-- GitHub and npm are repeated in the footer, so they yield first on
               narrow screens rather than pushing the theme toggle off the edge. -->
          <a
            v-if="link.external"
            :href="link.href"
            target="_blank"
            rel="noreferrer"
            class="hidden shrink-0 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-code hover:text-foreground sm:inline-block"
          >
            {{ link.label }}
          </a>
          <RouterLink
            v-else
            :to="link.href"
            class="shrink-0 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-code hover:text-foreground sm:px-2.5"
          >
            {{ link.label }}
          </RouterLink>
        </template>
      </nav>

      <span class="chip hidden shrink-0 md:inline">v{{ metrics.version }}</span>
      <ThemeToggle class="shrink-0" />
    </div>
  </header>
</template>
