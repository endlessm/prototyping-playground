<script setup lang="ts">
// Shown in place of a file's page that crashed, with the error to copy into
// an agent chat or a bug report.
const props = defineProps<{ error: unknown }>()
const { t } = useI18n()
const copied = ref(false)
const message = computed(() =>
  props.error instanceof Error ? props.error.message : String(props.error),
)

async function copy() {
  await navigator.clipboard.writeText(
    (props.error instanceof Error && props.error.stack) || message.value,
  )
  copied.value = true
}
</script>

<template>
  <div role="alert" class="max-w-2xl space-y-3">
    <p class="text-sm font-medium text-highlighted">
      {{ t('fileError.title') }}
    </p>
    <pre
      class="overflow-auto rounded-md bg-muted p-3 text-sm whitespace-pre-wrap text-muted"
      >{{ message }}</pre>
    <UButton
      color="neutral"
      variant="outline"
      size="sm"
      :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
      :label="copied ? t('fileError.copied') : t('fileError.copy')"
      @click="copy"
    />
  </div>
</template>
