<script setup lang="ts">
import type { ManifestPrototype } from '../../../../app/composables/useManifest'

// Asked before a prototype goes to the computer's trash, in development.
// The file service moves its whole folder there; a refusal shows here.
// Closes with true once it is deleted.
const props = defineProps<{
  prototype: ManifestPrototype
  /** Where deleted files go on this computer. */
  place: 'recycle-bin' | 'trash'
}>()
const emit = defineEmits<{ close: [deleted: boolean] }>()
const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL
const deleting = ref(false)
const failure = ref('')

async function remove() {
  deleting.value = true
  failure.value = ''
  try {
    await requestJson(`${base}_studio/files/prototypes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'delete', prototype: props.prototype.id }),
    })
    emit('close', true)
  } catch (error) {
    failure.value = (error as Error).message
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <UModal
    :title="
      t('prototypes.organize.deleteDialog.title', { title: prototype.title })
    "
    :description="
      t('prototypes.organize.deleteDialog.description', {
        place: t(`files.trash.${place}`),
      })
    "
    :close="false"
    @update:open="(open: boolean) => !open && emit('close', false)"
  >
    <template v-if="failure" #body>
      <p role="alert" class="text-sm text-error">{{ failure }}</p>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :label="t('prototypes.organize.deleteDialog.cancel')"
          autofocus
          @click="emit('close', false)"
        />
        <UButton
          color="error"
          :loading="deleting"
          :label="
            deleting
              ? t('prototypes.organize.deleteDialog.deleting')
              : t('prototypes.organize.deleteDialog.confirm')
          "
          @click="remove"
        />
      </div>
    </template>
  </UModal>
</template>
