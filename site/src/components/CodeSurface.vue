<script setup lang="ts">
/**
 * The 1px blueprint frame every code block sits in. No shadow, no radius —
 * the panel is defined purely by its hairline border.
 */
defineProps<{
  title?: string
  note?: string
}>()
</script>

<template>
  <figure class="flex min-w-0 flex-col bg-background">
    <figcaption
      v-if="title || note"
      class="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5 sm:px-6"
    >
      <span v-if="title" class="truncate font-mono text-xs text-muted-foreground">
        {{ title }}
      </span>
      <span v-if="note" class="label shrink-0">{{ note }}</span>
    </figcaption>
    <div class="code-wrap min-w-0 flex-1 overflow-x-auto px-4 py-5 font-mono text-[13px] leading-relaxed sm:px-6">
      <slot />
    </div>
  </figure>
</template>
