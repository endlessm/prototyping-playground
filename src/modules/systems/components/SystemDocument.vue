<script setup lang="ts">
import MarkdownReader from '../../../../app/components/markdown/MarkdownReader.vue'
import {
  parseDocument,
  type ParsedDocument,
} from '../../../../app/markdown/parse'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import { documentLink } from '../utils/pages'

// A Context or Skills document, read through the studio's Markdown reader
// (the same pipeline as prototype documents and the Manual): its title from
// the frontmatter or first heading, raw HTML shown as text, Mermaid, and
// relative links to the system's other documents opening in the studio.
// Text that can't be read shows why.
const props = defineProps<{
  system: SystemCatalog
  /** Repository-relative. */
  file: string
  source: string
  title: string
}>()
const { t } = useI18n()

provideMarkdownLinks((href) => documentLink(props.system, props.file, href))

const parsed = shallowRef<ParsedDocument>()
const error = ref('')
let parses = 0
watch(
  () => props.source,
  async (source) => {
    const parse = ++parses
    try {
      const document = await parseDocument(source, { file: props.file })
      if (parse !== parses) return
      // A document without a title of its own takes the listed one.
      parsed.value = { ...document, title: document.title ?? props.title }
      error.value = ''
    } catch (failure) {
      if (parse !== parses) return
      error.value = (failure as Error).message
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="error" role="alert" class="mx-auto max-w-3xl px-8 pt-12 text-sm">
    <p class="text-default">{{ t('systems.component.pageError') }}</p>
    <pre class="mt-2 font-mono text-xs whitespace-pre-wrap text-muted">{{
      error
    }}</pre>
  </div>
  <MarkdownReader v-else-if="parsed" :document="parsed" :page="file" />
</template>
