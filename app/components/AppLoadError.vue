<script setup lang="ts">
// A page that failed to load: what went wrong, and a way to try again.
defineProps<{ error: unknown }>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
</script>

<template>
  <div role="alert" class="space-y-3">
    <p class="text-sm font-medium text-highlighted">
      {{ t('loadError.title') }}
    </p>
    <p class="text-sm text-muted">
      {{ error instanceof Error ? error.message : String(error) }}
    </p>
    <UButton
      color="neutral"
      variant="outline"
      :label="t('loadError.retry')"
      @click="$emit('retry')"
    />
  </div>
</template>
