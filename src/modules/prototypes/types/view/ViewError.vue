<script setup lang="ts">
// Shown in place of a view that failed: the compiler's or the browser's
// message, ready to copy into an agent chat.
defineProps<{ detail: string }>()

const { t } = useI18n()
const { copy, copied } = useClipboard({ copiedDuring: 1500, legacy: true })
</script>

<template>
  <div role="alert" class="max-w-3xl space-y-3 p-8">
    <p class="text-sm font-medium text-highlighted">{{ t('view.error') }}</p>
    <pre
      class="overflow-auto rounded-md bg-muted p-3 text-sm whitespace-pre-wrap text-muted"
      >{{ detail }}</pre>
    <UButton
      size="sm"
      color="neutral"
      variant="outline"
      :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
      :label="copied ? t('view.copied') : t('view.copyError')"
      @click="copy(detail)"
    />
  </div>
</template>
