<script setup lang="ts">
import { apiEntries } from '@/data/api'
</script>

<template>
  <div class="overflow-x-auto border-b border-border">
    <!-- The rule above and below stay full-bleed; the table itself is contained
         so its first column shares the headings' axis. Below sm the table is
         wider than the viewport, mx-auto resolves to 0 and it scrolls from the
         left edge as before. -->
    <table class="mx-auto w-full max-w-6xl min-w-[44rem] border-collapse text-left text-sm">
      <thead>
        <tr class="border-b border-border">
          <th scope="col" class="label px-4 py-3 font-medium sm:px-6">Function</th>
          <th scope="col" class="label px-4 py-3 font-medium sm:px-6">Signature</th>
          <th scope="col" class="label px-4 py-3 font-medium sm:px-6">Side</th>
          <th scope="col" class="label px-4 py-3 font-medium sm:px-6">Purpose</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="entry in apiEntries"
          :key="entry.name"
          class="border-b border-border transition-colors last:border-b-0 hover:bg-code"
        >
          <td class="whitespace-nowrap px-4 py-3 font-mono text-foreground sm:px-6">{{ entry.name }}</td>
          <td class="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground sm:px-6">
            {{ entry.signature }}
          </td>
          <td class="px-4 py-3 sm:px-6">
            <span class="label rounded-sm border border-border px-2 py-0.5">{{ entry.side }}</span>
          </td>
          <td class="px-4 py-3 text-muted-foreground sm:px-6">{{ entry.purpose }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
