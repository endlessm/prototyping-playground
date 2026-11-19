<script setup lang="ts">
import SystemPreviewFrame from './SystemPreviewFrame.vue'

// Something a system renders itself, in its own look: one example of a
// component page, or the system's own Overview content. It shows in the
// system's preview document, in a frame as tall as its content, so pop-ups
// stay inside it. One that fails shows its error in its place, and nothing
// else on the page breaks. It updates by itself when its file changes.
defineProps<{
  systemId: string
  /** The preview document's ID for it. */
  artifact: string
  title: string
}>()
// An example whose content is wider than the frame, or holds something that
// stretches across it (a block button, a table), says it needs more room.
const emit = defineEmits<{ wide: [] }>()
const { t } = useI18n()

function fit(view: Window & typeof globalThis, app: HTMLElement) {
  if (needsRoom(view, app)) emit('wide')
}

function needsRoom(view: Window & typeof globalThis, app: HTMLElement) {
  const row = app.querySelector<HTMLElement>('[data-example]')
  if (!row) return false
  if (view.document.documentElement.scrollWidth > view.innerWidth) return true
  const style = view.getComputedStyle(row)
  const inner =
    row.clientWidth -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight)
  return [...row.children].some(
    (child) => child.getBoundingClientRect().width >= inner - 1,
  )
}
</script>

<template>
  <SystemPreviewFrame
    :system-id="systemId"
    :artifact="artifact"
    :title="title"
    :min-height="96"
    :error-height="160"
    :loading-text="t('systems.component.exampleLoading')"
    :error-text="t('systems.component.exampleError')"
    @fit="fit"
  />
</template>
