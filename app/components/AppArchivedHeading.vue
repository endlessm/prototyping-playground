<script setup lang="ts">
// The heading of a collection's archived items, which the deployed site
// leaves out.
const { t } = useI18n()
</script>

<template>
  <div class="mb-3 flex items-center gap-0.5">
    <h2 class="text-sm font-semibold text-highlighted">
      {{ t('collection.archived') }}
    </h2>
    <UTooltip :text="t('collection.archivedInfo')">
      <UButton
        icon="i-lucide-info"
        color="neutral"
        variant="link"
        size="xs"
        :aria-label="t('collection.archivedHint')"
      />
    </UTooltip>
  </div>
</template>
