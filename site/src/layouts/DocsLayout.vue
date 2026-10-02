<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DocPager from '@/components/DocPager.vue'
import DocSidebar from '@/components/DocSidebar.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { site } from '@/data/site'

const route = useRoute()

useHead({
  title: computed(() => {
    const title = typeof route.meta.title === 'string' ? route.meta.title : 'Docs'
    return `${title} — ${site.name}`
  }),
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteHeader />

    <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6 lg:flex-row lg:gap-10">
      <!-- The sidebar's 1px rule is the column divider; it runs the full height
           of the content area rather than hugging the nav. -->
      <aside
        class="border-b border-border py-8 lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r lg:py-0"
      >
        <div class="lg:sticky lg:top-14 lg:py-10 lg:pr-6">
          <DocSidebar />
        </div>
      </aside>

      <main class="min-w-0 flex-1 py-10">
        <slot />
        <DocPager />
      </main>
    </div>

    <SiteFooter />
  </div>
</template>
