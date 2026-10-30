<script setup lang="ts">
const emit = defineEmits<{ close: [discard: boolean] }>()
const { t } = useI18n()
</script>
<template>
  <UModal
    :title="t('settings.discardTitle')"
    :description="t('settings.discardDescription')"
    :close="false"
    @update:open="(open: boolean) => !open && emit('close', false)"
  >
    <template #footer>
      <UButton
        :label="t('settings.keepEditing')"
        @click="emit('close', false)"
      />
      <UButton
        color="error"
        :label="t('settings.discardLeave')"
        @click="emit('close', true)"
      />
    </template>
  </UModal>
</template>
