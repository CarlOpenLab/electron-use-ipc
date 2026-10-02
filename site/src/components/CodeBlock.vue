<script setup lang="ts">
import { computed } from 'vue'
import { useSnippet } from '@/composables/useSnippets'
import CodeSurface from './CodeSurface.vue'

const props = defineProps<{
  /** Key registered in plugins/shiki-snippets.ts */
  name: string
  title?: string
  note?: string
}>()

const snippet = computed(() => useSnippet(props.name))
</script>

<template>
  <CodeSurface :title="title ?? snippet.path" :note="note">
    <!-- Highlighted at build time; identical on server and client, so v-html
         cannot cause a hydration mismatch. -->
    <div v-html="snippet.html" />
  </CodeSurface>
</template>
