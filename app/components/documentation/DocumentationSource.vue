<script setup lang="ts">
import SourceEditor from '../source/SourceEditor.vue'
import { shortcutLabel } from '../../utils/shortcuts'

// A chapter's or guidance document's source, read and saved through the dev
// server's file service (an Admin saves). A banner says it is shared. A
// skill's supporting files open from the picker; files that aren't text are
// edited outside the studio. Switching files with unsaved changes asks
// first. Done returns to the page.
const props = defineProps<{
  /** Repository-relative. */
  path: string
  /** A skill's files, inside the skill's folder, to pick from. */
  files?: string[]
}>()
const emit = defineEmits<{ done: [] }>()
const { t } = useI18n()

const TEXT =
  /\.(md|markdown|txt|json|ya?ml|toml|csv|js|mjs|cjs|ts|vue|css|html|sh|py)$/i
const folder = computed(() => props.path.split('/').slice(0, -1).join('/'))
const picked = ref(props.path.split('/').at(-1)!)
const current = computed(() =>
  props.files ? `${folder.value}/${picked.value}` : props.path,
)
const text = computed(() => TEXT.test(current.value))
const editor = useTemplateRef<{ mayLeave: () => Promise<boolean> }>('editor')
defineExpose({ mayLeave: async () => (await editor.value?.mayLeave()) ?? true })

async function choose(next: string) {
  if (next === picked.value) return
  if (editor.value && !(await editor.value.mayLeave())) return
  picked.value = next
}

const access = useGuidanceFiles().access(() => current.value)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <p
      role="note"
      class="shrink-0 border-b border-default bg-elevated/50 px-4 py-2 text-xs text-muted"
    >
      {{ t('documentation.sharedBanner') }}
    </p>
    <SourceEditor
      v-if="text"
      ref="editor"
      :key="current"
      :access="access"
      :path="current"
      class="min-h-0 flex-1"
    >
      <template #actions>
        <USelect
          v-if="files"
          :model-value="picked"
          :items="files"
          size="sm"
          class="w-56"
          :aria-label="t('documentation.skillFile')"
          @update:model-value="choose"
        />
        <UTooltip
          :text="t('source.doneHint', { shortcut: shortcutLabel('source') })"
        >
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            :label="t('source.done')"
            @click="emit('done')"
          />
        </UTooltip>
      </template>
    </SourceEditor>
    <div v-else class="space-y-4 p-4">
      <div class="flex items-center gap-2">
        <USelect
          :model-value="picked"
          :items="files"
          size="sm"
          class="w-56"
          :aria-label="t('documentation.skillFile')"
          @update:model-value="choose"
        />
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          :label="t('source.done')"
          @click="emit('done')"
        />
      </div>
      <p class="text-sm text-muted">{{ t('documentation.binary') }}</p>
    </div>
  </div>
</template>
