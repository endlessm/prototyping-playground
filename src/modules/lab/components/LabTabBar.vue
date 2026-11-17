<script setup lang="ts">
import { LAB_TABS, labAddress, tabAt } from '../utils/lab'

// The bench's tabs, as links: each tab is its own address, so the back
// button and shared links follow them. The current one is announced.
const props = defineProps<{ systemId: string; slug: string }>()
const { t } = useI18n()
const route = useRoute()

const current = computed(() => tabAt(route.path, props.systemId, props.slug))
</script>

<template>
  <nav
    :aria-label="t('lab.tabs.label')"
    class="flex gap-1 border-b border-default"
  >
    <ULink
      v-for="tab in LAB_TABS"
      :key="tab.id"
      :to="labAddress(systemId, slug, tab.path)"
      :aria-current="current === tab ? 'page' : undefined"
      :class="[
        '-mb-px rounded-t-md border-b-2 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary',
        current === tab
          ? 'border-primary font-medium text-highlighted'
          : 'border-transparent text-muted hover:text-highlighted',
      ]"
    >
      {{ t(tab.label) }}
    </ULink>
  </nav>
</template>
