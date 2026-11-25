<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import LabTabBar from '../components/LabTabBar.vue'
import { provideLabComponent } from '../composables/useLabComponent'
import {
  useComponentPages,
  type SystemCatalog,
} from '../../systems/composables/useSystemCatalog'
import { stemOf } from '../../../../tooling/systems/components'
import { labComponents, labTitle, tabAt } from '../utils/lab'

// The bench: the open component's title, description and tab bar, kept on
// screen while its tabs change. It gives the component to the tab pages
// (`useLabComponent`). An unknown component is not found.
const props = defineProps<{ system: SystemCatalog }>()
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()
const { pages, reload } = await useComponentPages()

const component = computed(() =>
  labComponents(props.system).find(
    ({ slug }) => slug === String(route.params.component),
  ),
)
const data = computed(() =>
  component.value
    ? pages.value[`${props.system.id}/${component.value.slug}`]
    : undefined,
)
provideLabComponent({
  system: computed(() => props.system),
  component: computed(() => component.value!),
  stem: computed(() =>
    stemOf(component.value!.source ?? component.value!.name),
  ),
  data,
  reload,
})

const title = computed(() =>
  component.value ? labTitle(component.value.title) : '',
)

const tab = computed(() =>
  component.value
    ? tabAt(route.path, props.system.id, component.value.slug)
    : undefined,
)
useHead({
  title: () =>
    [
      ...(component.value && tab.value
        ? [t(tab.value.label), title.value]
        : [t('notFound.title')]),
      t('lab.title'),
      studio.name,
    ].join(' — '),
})
</script>

<template>
  <div v-if="!component" class="mx-auto w-full max-w-3xl px-4 py-6">
    <AppNotFound to="/lab" label="lab.viewComponents" />
  </div>
  <div v-else class="w-full px-4 py-6">
    <header class="mb-4">
      <h1 class="text-3xl font-semibold tracking-tight text-highlighted">
        {{ title }}
      </h1>
      <p v-if="component.description" class="mt-2 text-muted">
        {{ component.description }}
      </p>
    </header>
    <LabTabBar
      :system-id="system.id"
      :slug="component.slug"
      :app="Boolean(component.app)"
    />
    <div class="pt-6">
      <NuxtPage />
    </div>
  </div>
</template>
