<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import SystemNav from '../components/SystemNav.vue'
import { useSystemCatalog } from '../composables/useSystemCatalog'
import { useSystemTransition } from '../composables/useSystemTransition'

// A system's frame: its navigation, which stays while the person moves
// between the system's pages, and the open page beside it. Each page starts
// at the top. An unknown system is not found.
definePageMeta({ key: (route) => `system:${route.params.systemId}` })

const route = useRoute()
const { systems, systemOf } = await useSystemCatalog()
const system = computed(() => systemOf(route.params.systemId as string))
// A change made from the system's menu ends here once the studio reloads.
useSystemTransition(
  () => systems.value.map(({ id }) => id),
  () => system.value?.id,
)

const page = useTemplateRef<HTMLElement>('page')
watch(
  () => route.path,
  () => page.value?.closest('[data-slot="body"]')?.scrollTo({ top: 0 }),
  { flush: 'post' },
)
</script>

<template>
  <SystemNav v-if="system" :key="system.id" :system="system" />
  <UDashboardPanel id="system-page">
    <template #body>
      <div ref="page" class="contents">
        <AppNotFound v-if="!system" />
        <NuxtPage v-else :system="system" />
      </div>
    </template>
  </UDashboardPanel>
</template>
