<script setup lang="ts">
// Asked before a file or folder goes to the computer's trash. For a folder,
// it names the files inside that the tree isn't showing. Closes with true
// to delete.
const props = defineProps<{
  /** As the tree shows it. */
  name: string
  folder: boolean
  /** Inside a folder and not shown in the tree, relative to it. */
  hidden: string[]
  /** Where deleted files go on this computer. */
  trash: 'recycle-bin' | 'trash'
}>()
const emit = defineEmits<{ close: [remove: boolean] }>()
const { t } = useI18n()

const description = computed(() => {
  const place = t(`files.trash.${props.trash}`)
  const moves = props.folder
    ? t('files.delete.folder', { place })
    : t('files.delete.file', { place })
  if (!props.hidden.length) return moves
  // A hidden folder's files are counted once by its name.
  const names = [
    ...new Set(
      props.hidden.map((file) =>
        file.includes('/') ? `${file.split('/')[0]}/` : file,
      ),
    ),
  ]
  const shown = names.slice(0, 3).join(', ') + (names.length > 3 ? ', …' : '')
  return `${moves} ${t(
    'files.delete.hidden',
    { count: props.hidden.length, names: shown },
    props.hidden.length,
  )}`
})
</script>

<template>
  <UModal
    :title="t('files.delete.title', { name })"
    :description="description"
    :close="false"
    @update:open="(open: boolean) => !open && emit('close', false)"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :label="t('files.delete.cancel')"
          autofocus
          @click="emit('close', false)"
        />
        <UButton
          color="error"
          :label="t('files.delete.confirm')"
          @click="emit('close', true)"
        />
      </div>
    </template>
  </UModal>
</template>
