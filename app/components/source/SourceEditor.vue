<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { saveShortcut, shortcutLabel } from '../../utils/shortcuts'
import { sourceLanguage } from '../../utils/sourceLanguage'
import { StudioRequestError } from '../../utils/studioRequest'
import SourceCode from './SourceCode.vue'
import SourceDiscardModal from './SourceDiscardModal.vue'
import type { SourceAccess, SourceFile } from './sourceAccess'

// A file's source, to read and save: its path, whether it can be saved and
// why not, unsaved changes, and Save. Changes made on disk elsewhere reload
// a clean editor; with unsaved changes, a bar offers the choice. Leaving
// with unsaved changes asks first.
const props = defineProps<{
  access: SourceAccess
  /** Where the file is, until it has loaded. */
  path: string
}>()

const { t } = useI18n()
const toast = useStudioToast()
const overlay = useOverlay()
const discardModal = overlay.create(SourceDiscardModal)

// The file as this editor last read or saved it.
const file = shallowRef<SourceFile>()
const text = ref('')
const failure = ref<string>()
const saving = ref(false)
// The file changed on disk while there were unsaved changes.
const conflict = shallowRef<SourceFile>()

const path = computed(() => file.value?.path ?? props.path)
const editable = computed(
  () => import.meta.dev && Boolean(file.value?.editable),
)
const dirty = computed(
  () => Boolean(file.value) && text.value !== file.value!.content,
)

function take(next: SourceFile) {
  file.value = next
  text.value = next.content
  conflict.value = undefined
}

// Reads newer than the last one win; a save in progress reads after it ends.
let reads = 0
async function refresh() {
  if (saving.value) return
  const ticket = ++reads
  const next = await props.access.read().catch(() => undefined)
  if (ticket !== reads || !next || !file.value) return
  if (next.version === file.value.version) {
    // Permissions may have changed even when the text hasn't.
    file.value = { ...next, content: file.value.content }
    return
  }
  if (dirty.value) conflict.value = next
  else take(next)
}

onMounted(async () => {
  try {
    take(await props.access.read())
  } catch (error) {
    failure.value = (error as Error).message
  }
})

async function save() {
  const current = file.value
  if (!current || !editable.value || !dirty.value || saving.value) return
  const content = text.value
  saving.value = true
  ++reads // An older read can't overwrite what is saved now.
  try {
    const { version, warnings } = await props.access.write(
      content,
      current.version,
    )
    file.value = { ...current, content, version }
    conflict.value = undefined
    toast.success(t('source.saved'))
    for (const warning of warnings) toast.error(warning)
  } catch (error) {
    // A file that moved on shows the conflict bar instead.
    if (!(error instanceof StudioRequestError && error.code === 'changed'))
      toast.error((error as Error).message)
  } finally {
    saving.value = false
    void refresh()
  }
}

function keepMine() {
  if (!conflict.value) return
  // Saving now overwrites the version on disk.
  file.value = { ...conflict.value, content: file.value!.content }
  conflict.value = undefined
}

// Changes on disk, including this editor's own saves (same version).
function changed({ files }: { files: string[] }) {
  if (files.includes(path.value)) void refresh()
}
if (import.meta.hot) {
  const hot = import.meta.hot
  hot.on('studio:source', changed)
  // Changes made while the connection was down are not replayed.
  hot.on('vite:ws:connect', refresh)
  onBeforeUnmount(() => {
    hot.off('studio:source', changed)
    hot.off('vite:ws:connect', refresh)
  })
}

useEventListener(
  window,
  'keydown',
  (event: KeyboardEvent) => {
    if (!saveShortcut(event)) return
    event.preventDefault()
    void save()
  },
  { capture: true },
)

// Leaving (another page, Done, a reload or closing the tab) asks first.
async function mayLeave() {
  if (!dirty.value) return true
  return Boolean(await discardModal.open({ path: path.value }).result)
}
onBeforeRouteLeave(mayLeave)
onBeforeRouteUpdate(mayLeave)
useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
  if (dirty.value) event.preventDefault()
})

// A page that switches files inside one editor (a skill's files) asks
// first too.
defineExpose({ mayLeave })
</script>

<template>
  <div class="flex h-full min-h-0 min-w-0 flex-col bg-default">
    <div
      class="flex h-14 shrink-0 items-center gap-3 border-b border-default px-4 text-xs"
    >
      <span class="min-w-0 truncate font-mono text-muted" :title="path">
        {{ path }}
      </span>
      <span class="ml-auto shrink-0 text-muted">
        {{
          !file
            ? ''
            : !editable
              ? t('source.readOnly')
              : dirty
                ? t('source.unsaved')
                : ''
        }}
      </span>
      <div class="flex shrink-0 items-center gap-1.5">
        <UTooltip
          v-if="editable"
          :text="t('source.saveHint', { shortcut: shortcutLabel('save') })"
        >
          <UButton
            size="sm"
            :disabled="!dirty || saving"
            :label="saving ? t('source.saving') : t('source.save')"
            @click="save"
          />
        </UTooltip>
        <slot name="actions" />
      </div>
    </div>
    <p
      v-if="file && !editable && file.reason"
      role="status"
      class="shrink-0 border-b border-default px-4 py-2 text-xs text-muted"
    >
      {{ file.reason }}
    </p>
    <div
      v-if="conflict"
      role="alert"
      class="flex shrink-0 items-center gap-3 border-b border-default bg-elevated px-4 py-2 text-xs"
    >
      <span class="min-w-0 flex-1">{{ t('source.changed') }}</span>
      <UButton
        size="sm"
        color="neutral"
        variant="outline"
        :label="t('source.loadNew')"
        @click="take(conflict)"
      />
      <UButton
        size="sm"
        color="neutral"
        variant="outline"
        :label="t('source.keepMine')"
        @click="keepMine"
      />
    </div>
    <p
      v-if="failure"
      role="alert"
      class="shrink-0 border-b border-default px-4 py-2 text-xs text-error"
    >
      {{ failure }}
    </p>
    <SourceCode
      v-if="file"
      v-model="text"
      :language="sourceLanguage(path)"
      :editable="editable"
      :label="t('source.label', { path })"
    />
    <p v-else-if="!failure" class="p-4 text-xs text-muted">
      {{ t('source.loading') }}
    </p>
  </div>
</template>
