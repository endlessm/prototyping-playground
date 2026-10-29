<script setup lang="ts">
// Asked before unsaved changes are lost. Closes with true to discard them.
defineProps<{ path: string }>()
const emit = defineEmits<{ close: [discard: boolean] }>()
const { t } = useI18n()
</script>

<template>
  <UModal
    :title="t('source.discard.title')"
    :description="t('source.discard.description', { path })"
    :close="false"
    :dismissible="true"
    @update:open="(open: boolean) => !open && emit('close', false)"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :label="t('source.discard.keep')"
          autofocus
          @click="emit('close', false)"
        />
        <UButton
          color="error"
          :label="t('source.discard.discard')"
          @click="emit('close', true)"
        />
      </div>
    </template>
  </UModal>
</template>
