<script setup lang="ts">
import CodeBlock from './CodeBlock.vue'

defineProps<{
  left: string
  right: string
  leftNote?: string
  rightNote?: string
  /** Optional explanatory strip along the bottom of the comparison. */
  footer?: string
}>()
</script>

<template>
  <div class="border-y border-border">
    <!-- The band's rules run full-bleed; the panes are contained so their file
         labels share an axis with the section headings. Each pane keeps its own
         px-4/px-6 — that is the container's horizontal padding, applied inside
         the pane rather than around it. -->
    <div class="mx-auto grid max-w-6xl divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
      <CodeBlock :name="left" :note="leftNote" />
      <CodeBlock :name="right" :note="rightNote" />
    </div>
    <div v-if="footer" class="border-t border-border">
      <p class="mx-auto max-w-6xl px-4 py-4 text-xs leading-5 text-muted-foreground sm:px-6">
        {{ footer }}
      </p>
    </div>
  </div>
</template>
