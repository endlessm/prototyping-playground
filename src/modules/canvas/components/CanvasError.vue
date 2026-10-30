<script setup lang="ts">
// A canvas file that can't be opened: what to do, with the reason below,
// ready to copy into an agent chat.
defineProps<{ detail: string }>()
const { t } = useI18n()
</script>

<template>
  <div class="max-w-2xl p-8">
    <UAlert
      role="alert"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      :title="t('canvas.error')"
    >
      <template #description>
        <pre
          class="mt-2 overflow-auto rounded-md bg-muted p-3 text-sm whitespace-pre-wrap text-muted"
          >{{ detail }}</pre>
      </template>
    </UAlert>
  </div>
</template>
