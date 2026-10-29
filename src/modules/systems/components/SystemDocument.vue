<script setup lang="ts">
import { Marked, type Tokens } from 'marked'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import { documentLink } from '../utils/pages'

// A Context or Skills document, read in the studio's own style: GitHub
// Markdown with its frontmatter's title, raw HTML shown as text, and links
// to the system's other documents opening in the studio. Prototype
// documents get the shared document renderer (ticket 16), which replaces
// this one.
const props = defineProps<{
  system: SystemCatalog
  /** Repository-relative. */
  file: string
  source: string
  title: string
}>()
const router = useRouter()

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`)
const SAFE = /^(https?:|mailto:|#|\/|\.{0,2}\/?[^:]*$)/i

const html = computed(() => {
  const body = props.source.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '')
  const marked = new Marked({ gfm: true })
  marked.use({
    renderer: {
      html: ({ text }: Tokens.HTML | Tokens.Tag) => escape(text),
      link(
        this: { parser: { parseInline: (tokens: Tokens.Generic[]) => string } },
        token: Tokens.Link,
      ) {
        const label = this.parser.parseInline(token.tokens)
        const inside = documentLink(props.system, props.file, token.href)
        if (inside)
          return `<a href="${escape(router.resolve(inside).href)}" data-studio-link="${escape(inside)}">${label}</a>`
        if (!SAFE.test(token.href)) return label
        const external = /^https?:/i.test(token.href)
        return `<a href="${escape(token.href)}"${external ? ' target="_blank" rel="noreferrer"' : ''}>${label}</a>`
      },
    },
  })
  const rendered = marked.parse(body, { async: false })
  // A document without its own first heading takes its title.
  return /^\s*#\s/.test(body)
    ? rendered
    : `<h1>${escape(props.title)}</h1>${rendered}`
})

function follow(event: MouseEvent) {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
    'a[data-studio-link]',
  )
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return
  event.preventDefault()
  void navigateTo(link.dataset.studioLink!)
}
</script>

<template>
  <!-- Markdown rendered with raw HTML escaped. -->
  <!-- eslint-disable vue/no-v-html -->
  <article
    class="text-default [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-default [&_blockquote]:pl-4 [&_blockquote]:text-muted [&_code]:rounded [&_code]:bg-elevated [&_code]:px-1 [&_code]:text-sm [&_h1]:mb-6 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-highlighted [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-highlighted [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-highlighted [&_hr]:my-6 [&_hr]:border-default [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_p]:leading-7 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-elevated [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:my-4 [&_table]:w-full [&_table]:text-sm [&_td]:border [&_td]:border-default [&_td]:px-3 [&_td]:py-1.5 [&_th]:border [&_th]:border-default [&_th]:bg-elevated [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
    @click="follow"
    v-html="html"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>
