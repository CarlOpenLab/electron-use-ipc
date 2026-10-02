<script setup lang="ts">
import { useHead } from '@unhead/vue'
import ApiTable from '@/components/ApiTable.vue'
import CodeCompare from '@/components/CodeCompare.vue'
import FeatureGrid from '@/components/FeatureGrid.vue'
import Hero from '@/components/Hero.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import Specs from '@/components/Specs.vue'
import { site } from '@/data/site'

useHead({
  title: `${site.name} — Type-safe IPC for Electron`,
  meta: [{ name: 'description', content: site.description }],
})
</script>

<template>
  <div>
    <Hero />
    <Specs />

    <SectionHeader
      index="01 / The contract"
      title="Write the shape down once."
      lede="A token carries its channel path at runtime and its types at compile time. defineApi stamps the paths; TypeScript keeps the literals. This is the only place your IPC surface is described."
    />
    <CodeCompare
      left="api"
      right="main"
      left-note="Shared"
      right-note="Main"
      footer="The handler's parameters are not annotated — they are inferred from the token. Change getUser's return type in shared/api.ts and this file stops compiling until it matches."
    />

    <SectionHeader
      index="02 / The consumers"
      title="Every other side infers from it."
      lede="Preload forwards tokens without knowing what they mean. The renderer gets call signatures, return types and event payloads straight from the same definition."
    />
    <CodeCompare
      left="preload"
      right="renderer"
      left-note="Preload"
      right-note="Renderer"
      footer="No casts, no as User, no duplicated interfaces. call('1') is typed (id: string) => Promise<User> purely from api.invoke.getUser."
    />

    <SectionHeader
      index="03 / The difference"
      title="Instead of casts, compile errors."
      lede="Hand-wired IPC has three places to drift and a cast at the end to hide it. With a contract, a wrong argument is a build failure rather than a runtime surprise."
    />
    <CodeCompare
      left="plain-ipc"
      right="neg-check"
      left-note="Before"
      right-note="After"
      footer="The right-hand file is a real test in this repository. Each @ts-expect-error must be used — if a bad call ever stopped erroring, tsc would fail on the unused directive."
    />

    <SectionHeader
      index="04 / Properties"
      title="Small, and framework-agnostic."
      lede="The renderer entry imports neither Electron nor a UI framework. It exposes signals, so binding it to React, Vue, Solid or plain DOM is a few lines each."
    />
    <FeatureGrid />

    <SectionHeader
      index="05 / Reference"
      title="The whole surface."
      lede="Eleven runtime exports and no dependencies. Nine of them are the API you will actually call — the other two resolve channel names, which you only need if you are writing your own transport."
    />
    <ApiTable />
  </div>
</template>
