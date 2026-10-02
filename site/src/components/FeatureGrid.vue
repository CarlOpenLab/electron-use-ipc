<script setup lang="ts">
import { features } from '@/data/features'
</script>

<template>
  <div class="border-b border-border">
    <!-- Contained gap-grid: the seams are 1px inside the content column, the
         section's own rule above/below stays full-bleed. Cell padding is the
         container's px-4/px-6 so each title lands on the headings' axis. -->
    <ul class="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-border sm:grid-cols-2">
      <li v-for="feature in features" :key="feature.title" class="group bg-background">
        <RouterLink
          :to="feature.href"
          class="flex h-full flex-col px-4 py-8 transition-colors hover:bg-code sm:px-6"
        >
          <h3 class="flex items-center justify-between gap-4 font-semibold tracking-tight text-foreground">
            <span>{{ feature.title }}</span>
            <svg
              class="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
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
          </h3>
          <p class="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {{ feature.text }}
          </p>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
