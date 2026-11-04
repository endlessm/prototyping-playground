<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import SystemNav from '../components/SystemNav.vue'
import { pageHandoff } from '../../../../app/utils/pageHandoff'
import { useSystemCatalog } from '../composables/useSystemCatalog'
import { creationOf } from '../utils/destination'

// A system's frame: its navigation, which stays while the person moves
// between the system's pages, and the open page beside it. Each page starts
// at the top. An unknown system is not found.
definePageMeta({ key: (route) => `system:${route.params.systemId}` })

const route = useRoute()
const { systemOf } = await useSystemCatalog()
const system = computed(() => systemOf(route.params.systemId as string))
// A new system's tab finishes once its Overview shows.
const handoff = import.meta.dev ? pageHandoff() : undefined
if (handoff)
  watchEffect(() => {
    if (system.value && creationOf(handoff.destination()) === system.value.id)
      handoff.markReady()
  })

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
