<script setup lang="ts">
import { requestJson } from '../../../../app/utils/studioRequest'
import { stemOf } from '../../../../tooling/systems/components'
import type {
  CatalogComponent,
  SystemCatalog,
} from '../composables/useSystemCatalog'
import SystemSource from './SystemSource.vue'

// A component's files in source mode: its Page, its Examples and the
// Component itself, one tab each. Switching tabs with unsaved edits asks
// first. A missing page or examples file can be created from a template.
const props = defineProps<{
  system: SystemCatalog
  component: CatalogComponent
}>()
const emit = defineEmits<{ done: [] }>()
const { t } = useI18n()
const toast = useStudioToast()

type Part = 'doc' | 'examplesFile' | 'source'
const stem = computed(() =>
  stemOf(props.component.source ?? props.component.name),
)
const tabs = computed(() => [
  { label: t('systems.editor.page'), value: 'doc' as Part },
  { label: t('systems.editor.examples'), value: 'examplesFile' as Part },
  ...(props.component.source
    ? [{ label: t('systems.editor.component'), value: 'source' as Part }]
    : []),
])
const current = ref<Part>(
  (['doc', 'examplesFile', 'source'] as const).find(
    (part) => props.component[part],
  ) ?? 'doc',
)
const file = computed(() => props.component[current.value])
const missing = computed(() =>
  current.value === 'doc' ? `${stem.value}.md` : `${stem.value}.examples.vue`,
)

const editor = useTemplateRef<{ mayLeave: () => Promise<boolean> }>('editor')
async function choose(next: string | number) {
  if (next === current.value) return
  if (editor.value && !(await editor.value.mayLeave())) return
  current.value = next as Part
}

const url = `${useRuntimeConfig().app.baseURL}_studio/files/system-source`
const creating = ref(false)
async function create() {
  creating.value = true
  try {
    const { files } = await requestJson<{ files: string[] }>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: props.system.id,
        component: props.component.slug,
      }),
    })
    toast.success(t('systems.editor.created', { files: files.join(', ') }))
  } catch (error) {
    toast.error(t('systems.editor.createFailed'), (error as Error).message)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="border-b border-default px-4 pt-2">
      <UTabs
        :model-value="current"
        :items="tabs"
        :content="false"
        variant="link"
        size="sm"
        @update:model-value="choose"
      />
    </div>
    <div class="min-h-0 flex-1">
      <SystemSource
        v-if="file"
        ref="editor"
        :key="file"
        :system="system"
        :path="file.slice(system.folder.length + 1)"
        @done="emit('done')"
      />
      <div v-else class="mx-auto max-w-xl space-y-4 px-4 py-10">
        <p class="text-sm text-default">
          {{ t('systems.editor.missing', { file: missing }) }}
        </p>
        <p class="text-sm text-muted">
          {{ t('systems.editor.createFilesHint') }}
        </p>
        <div class="flex gap-2">
          <UButton
            size="sm"
            :label="t('systems.editor.createFiles')"
            :loading="creating"
            @click="create"
          />
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            :label="t('source.done')"
            @click="emit('done')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
