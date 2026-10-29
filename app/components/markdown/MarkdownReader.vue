<script setup lang="ts">
import MDCRenderer from '@nuxtjs/mdc/runtime/components/MDCRenderer.vue'
import type { ParsedDocument } from '../../markdown/parse'
import { EMBED_TAG } from '../../markdown/rehype-file-embeds'
import { MERMAID_TAG } from '../../markdown/remark-mermaid'
import MermaidDiagram from '../MermaidDiagram.vue'
import MarkdownEmbed from './MarkdownEmbed.vue'
import MarkdownLink from './MarkdownLink.vue'
import MarkdownToc from './MarkdownToc.vue'

// A Markdown document in the studio's reading style (Nuxt UI's prose), with
// its title and description, and "On this page" when the frontmatter asks
// for it and there are two headings or more. Opening it scrolls to the
// heading in the address, or to the top; edits to the open document keep
// the place. Going to a heading animates unless the person prefers reduced
// motion.
const props = defineProps<{
  document: ParsedDocument
  /** What the reader shows; a new one scrolls to its heading or the top. */
  page: string
}>()

const components = {
  a: MarkdownLink,
  [EMBED_TAG]: MarkdownEmbed,
  [MERMAID_TAG]: MermaidDiagram,
}

const route = useRoute()
const motion = usePreferredReducedMotion()
const scroller = useTemplateRef('scroller')

function scrollToHeading(id: string, animate: boolean) {
  const target = id && document.getElementById(id)
  if (!target || !scroller.value?.contains(target)) return false
  target.scrollIntoView({
    block: 'start',
    behavior: animate && motion.value !== 'reduce' ? 'smooth' : 'auto',
  })
  return true
}
const hashId = () => decodeURIComponent(route.hash.slice(1))

// A new page opens at the top, or at its heading once that has rendered:
// prose components render a moment after the text arrives.
let waiting: MutationObserver | undefined
const stopWaiting = () => {
  waiting?.disconnect()
  waiting = undefined
}
watch(
  () => props.page,
  () =>
    nextTick(() => {
      stopWaiting()
      scroller.value?.scrollTo({ top: 0 })
      const id = hashId()
      if (!id || scrollToHeading(id, false) || !scroller.value) return
      waiting = new MutationObserver(() => {
        if (scrollToHeading(id, false)) stopWaiting()
      })
      waiting.observe(scroller.value, { childList: true, subtree: true })
      setTimeout(stopWaiting, 3000)
    }),
  { immediate: true, flush: 'post' },
)
onBeforeUnmount(stopWaiting)
// Choosing a heading on the page, from a link or "On this page".
let chosen = ''
watch(
  () => route.hash,
  () => {
    if (hashId() === chosen) return
    chosen = ''
    scrollToHeading(hashId(), true)
  },
)
function select(id: string) {
  scrollToHeading(id, true)
  if (hashId() === id) return
  chosen = id
  void navigateTo({ query: route.query, hash: `#${id}` }, { replace: true })
}

const toc = computed(
  () => props.document.toc && props.document.headings.length >= 2,
)
</script>

<template>
  <!-- `relative` keeps the footnotes' hidden heading inside the scroller. -->
  <div
    ref="scroller"
    data-document-scroll
    class="relative h-full min-h-0 overflow-y-auto bg-default"
  >
    <div
      class="mx-auto flex max-w-5xl items-start justify-center gap-12 px-8 pt-12 pb-24"
    >
      <article class="min-w-0 max-w-3xl flex-1">
        <header
          v-if="document.title || document.description || $slots.actions"
          class="mb-10"
        >
          <div class="mb-3 flex items-start justify-between gap-4">
            <h1
              v-if="document.title"
              class="text-3xl font-semibold tracking-tight text-highlighted"
            >
              {{ document.title }}
            </h1>
            <slot name="actions" />
          </div>
          <p
            v-if="document.description"
            class="text-base leading-relaxed text-muted"
          >
            {{ document.description }}
          </p>
        </header>
        <Suspense>
          <MDCRenderer
            :body="document.body"
            :tag="false"
            :components="components"
          />
        </Suspense>
      </article>
      <MarkdownToc
        v-if="toc"
        :headings="document.headings"
        :scroller="scroller"
        @select="select"
      />
    </div>
  </div>
</template>
