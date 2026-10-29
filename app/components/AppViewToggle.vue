<script setup lang="ts">
// The cards-or-list switch in a collection's header.
const { t } = useI18n()
const view = useCollectionView()
</script>

<template>
  <UFieldGroup :aria-label="t('collection.viewAs')" role="group">
    <UTooltip
      v-for="choice in ['cards', 'list'] as const"
      :key="choice"
      :text="t(`collection.${choice}`)"
    >
      <UButton
        :icon="choice === 'cards' ? 'i-lucide-layout-grid' : 'i-lucide-list'"
        color="neutral"
        :variant="view === choice ? 'subtle' : 'outline'"
        :aria-label="t(`collection.${choice}`)"
        :aria-pressed="view === choice"
        @click="() => void (view = choice)"
      />
    </UTooltip>
  </UFieldGroup>
</template>
