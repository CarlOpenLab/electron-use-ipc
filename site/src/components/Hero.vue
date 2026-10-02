<script setup lang="ts">
import { metrics } from 'virtual:lib-metrics'
import { site } from '@/data/site'
import InstallCommand from './InstallCommand.vue'

const facts = [`v${metrics.version}`, site.license, `Electron ${metrics.electronPeer || '>=20'}`]
</script>

<template>
  <section class="relative overflow-hidden border-b border-border">
    <!-- Engineering grid, scoped to the hero and faded out before the fold. -->
    <div
      class="blueprint-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]"
      aria-hidden="true"
    />

    <div class="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
      <p
        class="chip inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1"
      >
        <span class="size-1.5 rounded-full bg-accent motion-safe:animate-pulse" aria-hidden="true" />
        <span>{{ facts.join(' · ') }}</span>
      </p>

      <h1 class="mt-6 max-w-3xl text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
        {{ site.title }}
        <span class="block text-muted-foreground">{{ site.titleMuted }}</span>
      </h1>

      <p class="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
        {{ site.description }}
      </p>

      <div class="mt-10 flex flex-wrap items-center gap-3">
        <InstallCommand :command="site.installCommand" />
        <RouterLink
          to="/docs/getting-started"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <span>Read the docs</span>
          <svg
            class="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
