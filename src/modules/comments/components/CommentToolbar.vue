<script setup lang="ts">
import { shortcutLabel } from '../../../../app/utils/shortcuts'

// The tool's controls in the page's bottom-right corner. All comments and
// Copy for agent wait for the list and the agent text.
defineProps<{
  commenting: boolean
  pinsShown: boolean
}>()
const emit = defineEmits<{ comment: []; pins: [] }>()

const { t } = useI18n()
const shortcut = shortcutLabel('comment')
</script>

<template>
  <div
    role="toolbar"
    :aria-label="t('comments.toolbar.label')"
    data-comment-ui
    class="pointer-events-auto absolute right-4 bottom-4 flex items-center gap-1 rounded-full border border-default bg-default p-1 shadow-lg"
  >
    <UTooltip :text="t('comments.toolbar.comment')" :kbds="[shortcut]">
      <UButton
        icon="i-lucide-message-square-plus"
        :label="t('comments.toolbar.comment')"
        :color="commenting ? 'info' : 'neutral'"
        :variant="commenting ? 'soft' : 'ghost'"
        size="sm"
        class="rounded-full"
        :aria-pressed="commenting"
        aria-keyshortcuts="Meta+Alt+M Control+Alt+M"
        @click="emit('comment')"
      />
    </UTooltip>
    <USeparator orientation="vertical" class="h-5" />
    <UTooltip
      :text="
        pinsShown ? t('comments.toolbar.hide') : t('comments.toolbar.show')
      "
    >
      <UButton
        :icon="pinsShown ? 'i-lucide-eye' : 'i-lucide-eye-off'"
        :aria-label="
          pinsShown ? t('comments.toolbar.hide') : t('comments.toolbar.show')
        "
        :aria-pressed="!pinsShown"
        color="neutral"
        variant="ghost"
        size="sm"
        class="rounded-full"
        @click="emit('pins')"
      />
    </UTooltip>
    <UButton
      icon="i-lucide-panel-right"
      :aria-label="t('comments.toolbar.all')"
      color="neutral"
      variant="ghost"
      size="sm"
      class="rounded-full"
      disabled
    />
    <UButton
      icon="i-lucide-copy"
      :aria-label="t('comments.toolbar.copy')"
      color="neutral"
      variant="ghost"
      size="sm"
      class="rounded-full"
      disabled
    />
  </div>
</template>
