<script setup lang="ts">
// Asked before a comment and its replies are deleted for good. Opened
// through useOverlay; closes with true to delete. A refusal shows as the
// tool's toast, with the service's sentence. With `count`, it asks about
// several comments chosen in the list.
defineProps<{ number: number; replies: number; count?: number }>()
const emit = defineEmits<{ close: [confirmed: boolean] }>()
const { t } = useI18n()
</script>

<template>
  <UModal
    :title="
      count
        ? t('comments.deleteDialog.titleMany', { count })
        : t('comments.deleteDialog.title', { number })
    "
    :description="
      count
        ? t('comments.deleteDialog.descriptionMany')
        : replies
          ? t('comments.deleteDialog.withReplies', { count: replies }, replies)
          : t('comments.deleteDialog.description')
    "
    :close="false"
    @update:open="(open: boolean) => !open && emit('close', false)"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :label="t('comments.deleteDialog.cancel')"
          autofocus
          @click="emit('close', false)"
        />
        <UButton
          color="error"
          :label="
            count
              ? t('comments.deleteDialog.confirmMany', { count })
              : t('comments.deleteDialog.confirm')
          "
          @click="emit('close', true)"
        />
      </div>
    </template>
  </UModal>
</template>
