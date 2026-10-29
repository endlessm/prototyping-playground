<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import SystemPage from '../components/SystemPage.vue'
import SystemPageHeader from '../components/SystemPageHeader.vue'
import { THEME_PAGES } from '../utils/pages'

// One of a system's theme pages: the tokens of one kind its stylesheet
// declares, by name. Its source is the stylesheet. A kind the theme doesn't
// declare is not found. (Ticket 25 shows each token's live value.)
const props = defineProps<{ system: SystemCatalog }>()
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()

const page = computed(() =>
  THEME_PAGES.find(({ id }) => id === route.params.page),
)
const tokens = computed(() =>
  props.system.tokens.filter(({ group }) => group === page.value?.group),
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
  <div v-if="!tokens.length" class="mx-auto w-full max-w-3xl px-4 py-6">
    <AppNotFound />
  </div>
  <SystemPage
    v-else
    :system="system"
    :source="system.stylesheet?.slice(system.folder.length + 1)"
  >
    <SystemPageHeader :title="title" />
    <ul class="divide-y divide-default rounded-lg border border-default">
      <li
        v-for="token in tokens"
        :key="token.name"
        class="px-4 py-2 font-mono text-sm text-default"
      >
        {{ token.name }}
      </li>
    </ul>
  </SystemPage>
</template>
