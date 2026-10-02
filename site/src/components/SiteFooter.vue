<script setup lang="ts">
import { site } from '@/data/site'
import InstallCommand from './InstallCommand.vue'
</script>

<template>
  <footer class="border-t border-border">
    <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 class="max-w-2xl text-2xl font-semibold text-foreground sm:text-3xl">
        Ship IPC that the compiler checks.
      </h2>
      <p class="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        One contract file, three processes, zero casts. Works with React, Vue, Solid or
        plain DOM — the core has no framework runtime and no dependencies.
      </p>
      <div class="mt-8 flex flex-wrap items-center gap-3">
        <InstallCommand :command="site.installCommand" />
        <a
          :href="site.links.repo"
          target="_blank"
          rel="noreferrer"
          class="inline-flex h-11 items-center gap-2 rounded-md border border-border px-5 text-sm font-medium text-foreground transition-colors hover:border-muted-foreground/40"
        >
          View on GitHub
        </a>
      </div>
    </div>

    <div class="border-t border-border">
      <div
        class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-xs text-muted-foreground sm:px-6"
      >
        <span>{{ site.license }} © {{ site.year }} {{ site.author }}</span>
        <span class="text-border" aria-hidden="true">|</span>
        <span>{{ site.org }}</span>
        <a
          :href="site.links.npm"
          target="_blank"
          rel="noreferrer"
          class="ml-auto transition-colors hover:text-foreground"
        >
          npm
        </a>
        <a
          :href="site.links.repo"
          target="_blank"
          rel="noreferrer"
          class="transition-colors hover:text-foreground"
        >
          GitHub
        </a>
      </div>
    </div>
  </footer>
</template>
