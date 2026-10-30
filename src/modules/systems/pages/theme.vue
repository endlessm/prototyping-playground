<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import SystemPage from '../components/SystemPage.vue'
import SystemPageHeader from '../components/SystemPageHeader.vue'
import SystemThemeFrame from '../components/SystemThemeFrame.vue'
import { themePages } from '../utils/pages'

// One of a system's theme pages: the tokens of one kind its stylesheet
// declares, drawn and measured inside the system's preview document. Its
// source is the stylesheet, shared by every theme page. A kind the theme
// doesn't declare is not found; Typography always shows.
const props = defineProps<{ system: SystemCatalog }>()
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()

const page = computed(() =>
  themePages(props.system).find(({ id }) => id === route.params.page),
)
const title = computed(() =>
  page.value ? t(`systems.pages.${page.value.group}`) : '',
)
useHead({
  title: () =>
    `${title.value} — ${props.system.label} — ${t('systems.title')} — ${studio.name}`,
})
</script>

<template>
  <div v-if="!page" class="mx-auto w-full max-w-3xl px-4 py-6">
    <AppNotFound />
  </div>
  <SystemPage
    v-else
    :system="system"
    :source="system.stylesheet?.slice(system.folder.length + 1)"
  >
    <SystemPageHeader
      :title="title"
      :description="
        t(`systems.theme.description.${page.group}`, { name: system.label })
      "
    />
    <SystemThemeFrame :system="system" :group="page.group" />
  </SystemPage>
</template>
