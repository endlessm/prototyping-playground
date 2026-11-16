<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import LabComponentList from '../components/LabComponentList.vue'
import { useSystemCatalog } from '../../systems/composables/useSystemCatalog'
import { labSystems } from '../utils/lab'

// The Lab's frame for one system: its component list in the section panel,
// kept on screen while the bench beside it changes component and tab. An
// unknown or archived system is not found, beside the list `/lab` opens.
definePageMeta({ key: (route) => `lab:${route.params.systemId}` })

const route = useRoute()
const manifest = await useManifest()
const { systems } = await useSystemCatalog()

const offered = computed(() =>
  labSystems(systems.value, manifest.value.defaultSystem),
)
const system = computed(() =>
  systems.value.find(
    ({ id, status }) =>
      id === String(route.params.systemId) && status === 'active',
  ),
)
const listed = computed(() => system.value ?? offered.value[0])

const { t } = useI18n()
const studio = useStudioConfig()
// The bench titles its own pages; an unknown system has no bench.
useHead({
  title: () =>
    system.value
      ? undefined
      : [t('notFound.title'), t('lab.title'), studio.name].join(' — '),
})

const page = useTemplateRef<HTMLElement>('page')
watch(
  () => route.path,
  () => page.value?.closest('[data-slot="body"]')?.scrollTo({ top: 0 }),
  { flush: 'post' },
)
</script>

<template>
  <LabComponentList
    v-if="listed"
    :key="listed.id"
    :system="listed"
    :systems="offered"
  />
  <UDashboardPanel id="lab-page">
    <template #body>
      <div ref="page" class="contents">
        <div v-if="!system" class="mx-auto w-full max-w-3xl px-4 py-6">
          <AppNotFound />
        </div>
        <NuxtPage v-else :system="system" />
      </div>
    </template>
  </UDashboardPanel>
</template>
