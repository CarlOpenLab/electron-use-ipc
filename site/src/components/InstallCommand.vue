<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const props = defineProps<{
  command: string
}>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.command)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Clipboard blocked (insecure context). The command stays selectable.
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <button
    type="button"
    class="group inline-flex h-11 min-w-0 items-center gap-3 rounded-md border border-border bg-code px-4 font-mono text-sm text-foreground transition-colors hover:border-muted-foreground/40"
    @click="copy"
  >
    <span class="select-none text-muted-foreground" aria-hidden="true">$</span>
    <span class="truncate">{{ command }}</span>
    <span
      class="ml-1 shrink-0 text-xs text-muted-foreground transition-colors group-hover:text-foreground"
      :aria-label="copied ? 'Copied' : 'Copy to clipboard'"
    >
      {{ copied ? 'Copied!' : 'Copy' }}
    </span>
  </button>
</template>
