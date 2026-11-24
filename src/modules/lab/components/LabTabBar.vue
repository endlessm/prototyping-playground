<script setup lang="ts">
import { LAB_TABS, labAddress, tabAt } from '../utils/lab'

// The bench's tabs, as links: each tab is its own address, so the back
// button and shared links follow them. The current one is announced. Only an
// app component has Versions, and a version's Changes sits under it.
const props = defineProps<{ systemId: string; slug: string; app: boolean }>()
const { t } = useI18n()
const route = useRoute()

const exact = computed(() => tabAt(route.path, props.systemId, props.slug))
const versions = LAB_TABS.find(({ id }) => id === 'versions')!
const current = computed(
  () =>
    exact.value ??
    (route.path.startsWith(
      `${labAddress(props.systemId, props.slug)}/versions/`,
    )
      ? versions
      : undefined),
)
const tabs = computed(() =>
  LAB_TABS.filter((tab) => props.app || !('app' in tab)),
)
</script>

<template>
  <nav
    :aria-label="t('lab.tabs.label')"
    class="flex gap-1 border-b border-default"
  >
    <ULink
      v-for="tab in tabs"
      :key="tab.id"
      :to="labAddress(systemId, slug, tab.path)"
      :aria-current="
        current === tab ? (exact === tab ? 'page' : 'true') : undefined
      "
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
