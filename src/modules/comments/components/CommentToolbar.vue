<script setup lang="ts">
import { shortcutLabel } from '../../../../app/utils/shortcuts'

// The tool's controls in the page's bottom-right corner, left of the list
// while it is open. Copy for agent waits for the agent text.
defineProps<{
  commenting: boolean
  pinsShown: boolean
  listOpen: boolean
  /** How many threads are open, all named states included. */
  openCount: number
  /** Comment needs a surface to point at. */
  canPoint: boolean
}>()
const emit = defineEmits<{ comment: []; pins: []; list: [] }>()

const { t } = useI18n()
const shortcut = shortcutLabel('comment')
</script>

<template>
  <div
    role="toolbar"
    :aria-label="t('comments.toolbar.label')"
    data-comment-ui
    :style="{ right: `${16 + (listOpen ? 340 : 0)}px` }"
    class="pointer-events-auto absolute bottom-4 flex items-center gap-1 rounded-full border border-default bg-default p-1 shadow-lg"
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
        :disabled="!canPoint"
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
    <UTooltip :text="t('comments.toolbar.all')">
      <UButton
        icon="i-lucide-panel-right"
        :aria-label="
          openCount
            ? t('comments.toolbar.allCount', { count: openCount })
            : t('comments.toolbar.all')
        "
        :aria-pressed="listOpen"
        :color="listOpen ? 'info' : 'neutral'"
        :variant="listOpen ? 'soft' : 'ghost'"
        size="sm"
        class="rounded-full"
        @click="emit('list')"
      >
        <template v-if="openCount" #trailing>
          <span aria-hidden="true" class="text-xs font-semibold tabular-nums">{{
            openCount
          }}</span>
        </template>
      </UButton>
    </UTooltip>
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
