<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import SourceCode from '../../../../app/components/source/SourceCode.vue'
import SourceDiscardModal from '../../../../app/components/source/SourceDiscardModal.vue'
import { saveShortcut, shortcutLabel } from '../../../../app/utils/shortcuts'
import type { PlaygroundCode } from '../composables/usePlaygroundDraft'

// The code beside the stage, locally, in the studio's code editor: a draft,
// which says whether it is saved and offers Save (also ⌘S or Ctrl+S) and
// Discard while the stage renders it, or a read-only text with the reason,
// such as an app component's original. Inspect marks the selected element's
// lines (`highlight`). The `actions` slot sits in the header, before Save and
// Discard (an original's New version); `notice` sits under the reason.
const props = defineProps<{
  draft: PlaygroundCode
  highlight?: { from: number; to: number } | null
}>()
const { t } = useI18n()
const overlay = useOverlay()
const discardModal = overlay.create(SourceDiscardModal)

const draft = props.draft
const name = computed(() => draft.fileName())
const status = computed(() => {
  if (!draft.file.value) return ''
  if (!draft.editable.value) return t('lab.editor.readOnly')
  if (draft.saving.value) return t('lab.editor.saving')
  return draft.unsaved.value
    ? t('lab.editor.unsaved', { file: name.value })
    : t('lab.editor.allSaved')
})

async function discard() {
  const confirmed = await discardModal.open({
    path: name.value,
    description: t('lab.editor.discardDescription', { file: name.value }),
  }).result
  if (confirmed) await draft.discard()
}

useEventListener(
  window,
  'keydown',
  (event: KeyboardEvent) => {
    if (!saveShortcut(event)) return
    event.preventDefault()
    void draft.save()
  },
  { capture: true },
)
</script>

<template>
  <section
    :aria-label="t('lab.editor.label', { file: name })"
    class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-default bg-default"
  >
    <div
      class="flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b border-default px-4 py-2 text-xs"
    >
      <span class="min-w-0 truncate font-mono text-muted" :title="name">
        {{ name }}
      </span>
      <span role="status" class="ml-auto shrink-0 text-muted">{{
        status
      }}</span>
      <slot name="actions" />
      <template v-if="draft.editable.value">
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          :label="t('lab.editor.discard')"
          :disabled="!draft.unsaved.value || draft.saving.value"
          @click="discard"
        />
        <UTooltip
          :text="t('lab.editor.saveHint', { shortcut: shortcutLabel('save') })"
        >
          <UButton
            size="xs"
            :label="t('lab.editor.save')"
            :disabled="!draft.unsaved.value"
            :loading="draft.saving.value"
            @click="draft.save()"
          />
        </UTooltip>
      </template>
    </div>
    <p
      v-if="
        draft.file.value && !draft.editable.value && draft.file.value.reason
      "
      class="shrink-0 border-b border-default px-4 py-2 text-xs text-muted"
    >
      {{ draft.file.value.reason }}
      <slot name="notice" />
    </p>
    <div
      v-if="draft.conflict.value"
      role="alert"
      class="flex shrink-0 flex-wrap items-center gap-2 border-b border-default bg-elevated px-4 py-2 text-xs"
    >
      <span class="min-w-0 flex-1">{{ t('lab.editor.changed') }}</span>
      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        :label="t('lab.editor.keepMine')"
        @click="draft.keepMine()"
      />
    </div>
    <p
      v-if="draft.failure.value"
      role="alert"
      class="shrink-0 px-4 py-2 text-xs text-error"
    >
      {{ draft.failure.value }}
    </p>
    <SourceCode
      v-else-if="draft.file.value"
      v-model="draft.code.value"
      language="vue"
      :editable="draft.editable.value"
      :autofocus="false"
      :highlight="highlight"
      :label="t('lab.editor.label', { file: name })"
    />
    <p v-else class="p-4 text-xs text-muted">{{ t('lab.editor.loading') }}</p>
  </section>
</template>
