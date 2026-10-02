<script setup lang="ts">
defineProps<{
  index: string
  title: string
  lede?: string
}>()
</script>

<template>
  <header class="mx-auto max-w-6xl px-4 pb-6 pt-16 sm:px-6 md:pt-20">
    <p class="label">{{ index }}</p>
    <h2 class="mt-3 max-w-2xl text-2xl font-semibold text-foreground sm:text-3xl">
      {{ title }}
    </h2>
    <p v-if="lede" class="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
      {{ lede }}
    </p>
  </header>
</template>
