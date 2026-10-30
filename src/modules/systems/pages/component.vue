<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import ComponentPage from '../components/ComponentPage.vue'
import SystemPage from '../components/SystemPage.vue'
import {
  useComponentPages,
  type SystemCatalog,
} from '../composables/useSystemCatalog'

// A component's page at `components/<slug>`, or, locally, its files in
// source mode. Source mode never renders the page (no examples, no
// Markdown), so a broken file can still be opened and fixed.

// The editor exists only in the studio running locally.
const ComponentEditor = import.meta.dev
  ? defineAsyncComponent(() => import('../components/ComponentEditor.vue'))
  : undefined

const props = defineProps<{ system: SystemCatalog }>()
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()
const { pages, reload } = await useComponentPages()

const component = computed(() =>
  props.system.components.find(
    ({ slug }) => slug === String(route.params.component),
  ),
)
const data = computed(() =>
  component.value
    ? pages.value[`${props.system.id}/${component.value.slug}`]
    : undefined,
)

useHead({
  title: () =>
    [
      component.value?.title,
      t('systems.pages.components'),
      props.system.label,
      t('systems.title'),
      studio.name,
    ]
      .filter(Boolean)
      .join(' — '),
})
</script>

<template>
  <div v-if="!component" class="mx-auto w-full max-w-3xl px-4 py-6">
    <AppNotFound />
  </div>
  <SystemPage
    v-else
    :key="component.slug"
    :system="system"
    :source="component.files[0]!.slice(system.folder.length + 1)"
  >
    <ComponentPage
      :system="system"
      :component="component"
      :data="data"
      @retry="reload"
    />
    <template v-if="ComponentEditor" #source="{ done }">
      <ComponentEditor :system="system" :component="component" @done="done" />
    </template>
  </SystemPage>
</template>
