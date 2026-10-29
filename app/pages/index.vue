<script setup lang="ts">
import blocks from '#studio/home-blocks'
import { orderHomeBlocks } from '../utils/home'

// Home: a greeting, a search field, and under them one block for each
// module that has something to show. Locally your own work comes first; the
// deployed site names the studio, adds the tagline, and puts what
// colleagues come for first. The panel is narrow and centred, so it reads
// as a welcome and suits the narrow window an agent's harness gives it.
const studio = useStudioConfig()
const { t } = useI18n()
const palette = useCommandPalette()
const local = import.meta.dev
const shown = orderHomeBlocks(blocks, local).map((block) => ({
  id: block.id,
  component: defineAsyncComponent(block.component),
}))
useHead({ title: studio.name })
</script>

<template>
  <UDashboardPanel id="home">
    <template #body>
      <div class="mx-auto w-full max-w-xl pt-[12vh] pb-10">
        <header class="mb-6">
          <h1
            class="text-center text-2xl font-semibold tracking-tight text-highlighted"
          >
            {{ studio.name }}
          </h1>
          <p
            v-if="!local && studio.tagline"
            class="mt-1.5 text-center text-sm text-muted"
          >
            {{ studio.tagline }}
          </p>
        </header>
        <UCard :ui="{ body: 'p-0 sm:p-0 pb-1' }">
          <!-- The panel's first row is its search: it opens the command
               palette every page has, where a first-time visitor sees it. -->
          <button
            type="button"
            class="flex h-11 w-full items-center gap-2.5 border-b border-default px-4 text-left text-sm text-muted transition-colors outline-none hover:bg-elevated/50 focus-visible:bg-elevated/50"
            @click="palette.show()"
          >
            <UIcon name="i-lucide-search" class="size-4" />
            <span class="flex-1">{{ t('home.search') }}</span>
            <UKbd :value="shortcutLabel('palette')" />
          </button>
          <div class="pt-1.5">
            <component
              :is="block.component"
              v-for="block in shown"
              :key="block.id"
            />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
