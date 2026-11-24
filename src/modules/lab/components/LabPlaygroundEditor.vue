<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import SourceCode from '../../../../app/components/source/SourceCode.vue'
import SourceDiscardModal from '../../../../app/components/source/SourceDiscardModal.vue'
import { saveShortcut, shortcutLabel } from '../../../../app/utils/shortcuts'
import type { PlaygroundCode } from '../composables/playgroundCode'

// The code beside the stage, locally, in the studio's code editor: a draft,
// which says whether it is saved and offers Save (also ⌘S or Ctrl+S) and
// Discard while the stage renders it, or a read-only text with the reason,
// such as an app component's original. Inspect marks the selected element's
// lines (`highlight`). Its header keeps one layout at every width: what is
// open (`heading`, or the file's name) and whether it is saved, then the
// `actions` slot (New version, Show original, Changes) with Discard and Save
// together at the end. `notice` sits under the reason.
const props = defineProps<{
  draft: PlaygroundCode
  highlight?: { from: number; to: number } | null
  /** What is open, in words, such as "Version: Blue nav · by Ana". */
  heading?: string
  /** What the code is called, such as a version's name; its file's name otherwise. */
  named?: string
}>()
defineSlots<{ actions?: () => unknown; notice?: () => unknown }>()
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
    ? t('lab.editor.unsaved')
    : t('lab.editor.allSaved')
})
const label = computed(() =>
  t('lab.editor.label', { file: props.named ?? name.value }),
)

async function discard() {
  const confirmed = await discardModal.open({
    path: name.value,
    description: t('lab.editor.discardDescription'),
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
    :aria-label="label"
    class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-default bg-default"
  >
    <div class="shrink-0 space-y-2 border-b border-default px-4 py-2">
      <div class="flex min-h-7 items-center gap-3">
        <p
          class="min-w-0 flex-1 truncate"
          :class="
            heading ? 'text-sm text-default' : 'font-mono text-xs text-muted'
          "
          :title="heading ?? name"
        >
          {{ heading ?? name }}
        </p>
        <span role="status" class="shrink-0 text-xs text-muted">{{
          status
        }}</span>
      </div>
      <div
        v-if="$slots.actions || draft.editable.value"
        class="flex flex-wrap items-center gap-2"
      >
        <slot name="actions" />
        <div
          v-if="draft.editable.value"
          class="ms-auto flex shrink-0 items-center gap-2"
        >
          <UButton
            size="xs"
            color="neutral"
            variant="outline"
            :label="t('lab.editor.discard')"
            :disabled="!draft.unsaved.value || draft.saving.value"
            @click="discard"
          />
          <UTooltip
            :text="
              t('lab.editor.saveHint', { shortcut: shortcutLabel('save') })
            "
          >
            <UButton
              size="xs"
              :label="t('lab.editor.save')"
              :disabled="!draft.unsaved.value"
              :loading="draft.saving.value"
              @click="draft.save()"
            />
          </UTooltip>
        </div>
      </div>
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
      :label="label"
    />
    <p v-else class="p-4 text-xs text-muted">{{ t('lab.editor.loading') }}</p>
  </section>
</template>
