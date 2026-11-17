<script setup lang="ts">
// Asked when leaving a Breakdown with unsaved knob changes. Closes with true
// to discard them and leave.
const emit = defineEmits<{ close: [discard: boolean] }>()
const { t } = useI18n()
</script>

<template>
  <UModal
    :title="t('lab.save.leave.title')"
    :description="t('lab.save.leave.description')"
    :close="false"
    :dismissible="true"
    @update:open="(open: boolean) => !open && emit('close', false)"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :label="t('lab.save.leave.keep')"
          autofocus
          @click="emit('close', false)"
        />
        <UButton
          color="error"
          :label="t('lab.save.leave.discard')"
          @click="emit('close', true)"
        />
      </div>
    </template>
  </UModal>
</template>
