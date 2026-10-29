<script setup lang="ts">
// The heading over a collection's archived items, with what archiving
// means. `id` names the section it heads.
defineProps<{ id: string }>()
const { t } = useI18n()
</script>

<template>
  <h2
    class="mb-3 flex items-center gap-0.5 text-sm font-semibold text-highlighted"
  >
    <span :id="id">{{ t('collection.archived') }}</span>
    <UTooltip :text="t('collection.archivedHint')">
      <UButton
        icon="i-lucide-info"
        :aria-label="t('collection.aboutArchived')"
        color="neutral"
        variant="link"
        size="xs"
        square
      />
    </UTooltip>
  </h2>
</template>
