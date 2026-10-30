<script setup lang="ts">
import AppFileError from '../AppFileError.vue'
import MarkdownReader from '../markdown/MarkdownReader.vue'
import { parseDocument, type ParsedDocument } from '../../markdown/parse'

// A Manual chapter or guidance document: read through the studio's Markdown
// reader or, locally, edited in source mode (`?mode=source`, or ⌘' /
// Ctrl+'). Source mode never renders the text, so a broken file can still be
// opened and fixed. Saving updates the open page in place.
const props = defineProps<{
  /** Its text; undefined while it isn't readable (source mode still opens). */
  source?: string
  /** Repository-relative. */
  file: string
  /** What the reader shows; a new one opens at the top. */
  page: string
  /** The title when the text has none of its own. */
  title?: string
  /** A skill's files, for the source picker. */
  files?: string[]
}>()

// The editor exists only in the studio running locally, so the deployed
// site never loads it.
const DocumentationSource = import.meta.dev
  ? defineAsyncComponent(() => import('./DocumentationSource.vue'))
  : undefined

const { t } = useI18n()
const rendered = useTemplateRef<HTMLElement>('rendered')
const mode = useSourceMode(rendered)
const editing = computed(() =>
  Boolean(mode.source.value && DocumentationSource),
)

const parsed = shallowRef<ParsedDocument>()
const error = ref<unknown>()
let parses = 0
watch(
  () => props.source,
  async (source) => {
    if (source === undefined) return
    const parse = ++parses
    try {
      const document = await parseDocument(source, { file: props.file })
      if (parse !== parses) return
      parsed.value = {
        ...document,
        title: document.title ?? props.title,
      }
      error.value = undefined
    } catch (failure) {
      if (parse === parses) error.value = failure
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="editing" class="h-full min-h-0">
    <DocumentationSource
      :key="file"
      :path="file"
      :files="files"
      @done="mode.toggle"
    />
  </div>
  <div
    v-else
    ref="rendered"
    tabindex="-1"
    class="h-full min-h-0 outline-none"
    :data-document-state="error ? 'error' : parsed ? 'ready' : 'loading'"
  >
    <div v-if="error" class="p-8">
      <AppFileError :error="error" />
    </div>
    <MarkdownReader v-else-if="parsed" :document="parsed" :page="page">
      <template #footer>
        <slot name="footer" />
      </template>
    </MarkdownReader>
    <p v-else role="status" class="p-8 text-sm text-muted">
      {{ t('documentation.loading') }}
    </p>
  </div>
</template>
