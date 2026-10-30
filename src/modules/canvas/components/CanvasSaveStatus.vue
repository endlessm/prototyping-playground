<script setup lang="ts">
import type { SaveState } from '../utils/canvasFile'

// Whether your edits are on disk, at the canvas's bottom right. Screen
// readers hear it as a status; a failed save offers Retry.
defineProps<{ state: SaveState }>()
const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()
</script>

<template>
  <div
    role="status"
    data-save-status
    class="absolute right-3 bottom-3 z-10 flex items-center gap-2 rounded-md border border-default bg-default px-3 py-1.5 text-xs text-muted"
  >
    {{ t(`canvas.save.${state}`) }}
    <UButton
      v-if="state === 'failed'"
      size="xs"
      color="neutral"
      variant="outline"
      :label="t('canvas.save.retry')"
      @click="emit('retry')"
    />
  </div>
</template>
