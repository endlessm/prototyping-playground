<script setup lang="ts">
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import SystemPage from './SystemPage.vue'
import SystemPageHeader from './SystemPageHeader.vue'

// The Context or Skills section itself: what it is for, where its files
// are, and that being listed doesn't load a file into a conversation.
const props = defineProps<{
  system: SystemCatalog
  section: 'context' | 'skills'
}>()
const { t } = useI18n()
const studio = useStudioConfig()

const title = computed(() => t(`systems.pages.${props.section}`))
const empty = computed(() =>
  props.section === 'context'
    ? !props.system.context.length
    : !props.system.skills.length,
)
useHead({
  title: () =>
    `${title.value} — ${props.system.label} — ${t('systems.title')} — ${studio.name}`,
})
</script>

<template>
  <SystemPage :system="system">
    <SystemPageHeader
      :title="title"
      :description="t(`systems.section.${section}`)"
    />
    <p class="text-sm text-default">
      {{ empty ? t('systems.section.empty') : t('systems.section.select') }}
    </p>
    <p class="mt-4 text-sm text-muted">{{ t('systems.section.loading') }}</p>
  </SystemPage>
</template>
