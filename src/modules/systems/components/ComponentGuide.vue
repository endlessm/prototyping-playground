<script setup lang="ts">
import MDCRenderer from '@nuxtjs/mdc/runtime/components/MDCRenderer.vue'
import MarkdownLink from '../../../../app/components/markdown/MarkdownLink.vue'
import MermaidDiagram from '../../../../app/components/MermaidDiagram.vue'
import {
  parseDocument,
  type ParsedDocument,
} from '../../../../app/markdown/parse'
import { MERMAID_TAG } from '../../../../app/markdown/remark-mermaid'

// A component's Markdown page, below the page's own title and description,
// through the studio's Markdown pipeline. Its headings are sized to the
// page's own sections. A page that can't be read shows why, and the rest of
// the component page still shows.
const props = defineProps<{ source: string; file: string }>()
const { t } = useI18n()

const components = { a: MarkdownLink, [MERMAID_TAG]: MermaidDiagram }
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
      parsed.value = document
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
  <div
    v-if="error"
    role="alert"
    class="rounded-md border border-default p-3 text-sm"
  >
    <p class="text-default">{{ t('systems.component.pageError') }}</p>
    <pre class="mt-2 font-mono text-xs whitespace-pre-wrap text-muted">{{
      error
    }}</pre>
  </div>
  <div
    v-else-if="parsed"
    data-component-guide
    class="[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:text-base"
  >
    <Suspense>
      <MDCRenderer :body="parsed.body" :tag="false" :components="components" />
    </Suspense>
  </div>
</template>
