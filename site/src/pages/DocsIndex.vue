<script setup lang="ts">
import { docsNav } from '@/data/nav'
</script>

<template>
  <div>
    <header class="border-b border-border pb-8">
      <p class="label">Documentation</p>
      <h1 class="mt-3 text-3xl font-semibold text-foreground">electron-use-ipc</h1>
      <p class="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        Six short pages that follow the library's own shape: define the contract, then wire
        each of the three processes that infer from it.
      </p>
    </header>

    <ul class="grid gap-px bg-border">
      <li v-for="(page, index) in docsNav" :key="page.path" class="group bg-background">
        <RouterLink :to="page.path" class="flex gap-5 px-6 py-5 transition-colors hover:bg-code">
          <span class="font-mono text-xs tabular-nums text-muted-foreground">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span class="min-w-0">
            <span class="flex items-center gap-2 font-medium text-foreground">
              {{ page.title }}
              <svg
                class="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
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
            </span>
            <span class="mt-1 block text-sm text-muted-foreground">{{ page.summary }}</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
