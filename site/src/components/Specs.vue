<script setup lang="ts">
import { computed } from 'vue'
import { metrics } from 'virtual:lib-metrics'

interface Stat {
  value: string
  unit?: string
  label: string
}

/**
 * Every number here is measured from the built library at build time
 * (plugins/metrics.ts). Nothing is hard-coded, so the page cannot advertise a
 * size the package does not actually have.
 */
const stats = computed<Stat[]>(() => {
  const renderer = metrics.renderer
  return [
    { value: String(metrics.runtimeDeps), label: 'Runtime dependencies' },
    {
      value: renderer ? String(renderer.brotli) : '—',
      unit: 'B',
      label: 'Renderer entry · brotli',
    },
    { value: String(metrics.exportCount), label: 'Runtime exports' },
    { value: '1 → 3', label: 'Contract → processes' },
  ]
})

const packed = computed(() => metrics.packed)
</script>

<template>
  <section aria-label="Package metrics">
    <!-- The 1px rules stay full-bleed — they mark the page's horizontal bands —
         while the grid is contained so the figures sit on the same vertical axis
         as the headings above them. gap-px over a border-coloured background:
         the seam itself is the 1px rule, which stays exactly one pixel at any
         column count. Cells carry px-4/px-6, which is the container's own
         padding, so the first figure lands exactly on that axis. -->
    <div class="border-y border-border">
      <dl class="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="flex flex-col-reverse justify-end gap-2 bg-background px-4 py-6 sm:px-6 sm:py-8"
        >
          <!-- DOM order is dt -> dd for correct semantics; flex-col-reverse
               puts the number on top visually. -->
          <dt class="label">{{ stat.label }}</dt>
          <dd class="text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
            {{ stat.value }}
            <span v-if="stat.unit" class="ml-0.5 text-base font-normal text-muted-foreground">
              {{ stat.unit }}
            </span>
          </dd>
        </div>
      </dl>
    </div>

    <div v-if="packed" class="border-b border-border">
      <p class="mx-auto max-w-6xl px-4 py-3 text-xs tabular-nums text-muted-foreground sm:px-6">
        Published package: {{ packed.unpackedSize.toLocaleString('en-US') }} B across
        {{ packed.fileCount }} files · all figures measured from
        <code class="font-mono">dist/</code> at build time
      </p>
    </div>
  </section>
</template>
