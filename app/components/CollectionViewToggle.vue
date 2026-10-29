<script setup lang="ts">
import type { CollectionView } from '../composables/useCollectionView'

// The "View as" switch in a collection's header: cards or a list. The
// choice applies to every collection (useCollectionView).
const view = useCollectionView()
const { t } = useI18n()
const choices = [
  { value: 'cards', icon: 'i-lucide-layout-grid' },
  { value: 'list', icon: 'i-lucide-list' },
] as const
function choose(choice: CollectionView) {
  view.value = choice
}
</script>

<template>
  <UFieldGroup role="group" :aria-label="t('collection.viewAs')">
    <UTooltip
      v-for="choice in choices"
      :key="choice.value"
      :text="t(`collection.${choice.value}`)"
    >
      <UButton
        :icon="choice.icon"
        :aria-label="t(`collection.${choice.value}`)"
        :aria-pressed="view === choice.value"
        :active="view === choice.value"
        color="neutral"
        variant="outline"
        active-variant="soft"
        square
        @click="choose(choice.value)"
      />
    </UTooltip>
  </UFieldGroup>
</template>
