<script setup lang="ts">
// Asked when leaving a canvas whose last edits couldn't be saved. Closes
// with true to discard them.
const emit = defineEmits<{ close: [discard: boolean] }>()
const { t } = useI18n()
</script>

<template>
  <UModal
    :title="t('canvas.leave.title')"
    :description="t('canvas.leave.description')"
    :close="false"
    :dismissible="true"
    @update:open="(open: boolean) => !open && emit('close', false)"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :label="t('canvas.leave.keep')"
          autofocus
          @click="emit('close', false)"
        />
        <UButton
          color="error"
          :label="t('canvas.leave.discard')"
          @click="emit('close', true)"
        />
      </div>
    </template>
  </UModal>
</template>
