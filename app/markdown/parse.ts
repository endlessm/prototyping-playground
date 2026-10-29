// The studio's Markdown pipeline, shared by every reader (prototype
// documents now, the Manual later): Nuxt's MDC parser with GitHub-style
// Markdown, heading anchors and, in the app, code highlighted with the
// studio's palette (`mdc.highlight` in `nuxt.config.ts`), plus the studio's
// own plugins: the title from the first heading, raw HTML as text, file
// embeds and Mermaid fences. MDC's own component syntax and raw HTML
// passthrough are off: documents are plain Markdown.
import type { MDCElement, MDCNode, MDCRoot } from '@nuxtjs/mdc'
import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { frontmatterOf } from '../../src/modules/document/types/document/frontmatter'
import rehypeFileEmbeds from './rehype-file-embeds'
import remarkHtmlAsText from './remark-html-as-text'
import remarkMermaid from './remark-mermaid'
import remarkTitleFromHeading from './remark-title-from-heading'

export type MarkdownNode = MDCNode | MDCRoot

export interface MarkdownHeading {
  id: string
  text: string
  level: 2 | 3
}

export interface ParsedDocument {
  title?: string
  description?: string
  /** Whether the frontmatter asks for "On this page". */
  toc: boolean
  /** Level 2 and 3 headings, in order. */
  headings: MarkdownHeading[]
  body: MDCRoot
}

const OPTIONS = {
  remark: {
    plugins: {
      'remark-mdc': false,
      'remark-emoji': false,
      'studio-title-from-heading': { instance: remarkTitleFromHeading },
      'studio-html-as-text': { instance: remarkHtmlAsText },
      'studio-mermaid': { instance: remarkMermaid },
    },
  },
  rehype: {
    plugins: {
      'rehype-raw': false,
      'studio-file-embeds': { instance: rehypeFileEmbeds },
    },
  },
  contentHeading: false,
  toc: false,
} as const

const FOOTNOTES_HEADING = 'footnote-label'

const textOf = (node: MDCNode): string =>
  node.type === 'text'
    ? node.value
    : node.type === 'element'
      ? node.children.map(textOf).join('')
      : ''

function headingsOf(body: MDCRoot) {
  const headings: MarkdownHeading[] = []
  const walk = (node: MDCNode | MDCRoot) => {
    if (node.type === 'element' && (node.tag === 'h2' || node.tag === 'h3')) {
      const id = (node as MDCElement).props?.id
      // GitHub-style footnotes come with a heading only screen readers see.
      if (typeof id === 'string' && id !== FOOTNOTES_HEADING)
        headings.push({
          id,
          text: textOf(node).trim(),
          level: node.tag === 'h2' ? 2 : 3,
        })
      return
    }
    if (node.type === 'element' || node.type === 'root')
      node.children.forEach(walk)
  }
  walk(body)
  return headings
}

const plain = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

/**
 * A Markdown file's text, parsed for reading. Throws on frontmatter that
 * isn't valid YAML, with the parser's message.
 */
export async function parseDocument(
  source: string,
  options: { file?: string } = {},
): Promise<ParsedDocument> {
  const text = source.replace(/^\uFEFF/, '')
  frontmatterOf(text)
  const parsed = await parseMarkdown(
    text,
    OPTIONS as Parameters<typeof parseMarkdown>[1],
    { fileOptions: options.file ? { path: options.file } : {} },
  )
  const data = parsed.data as Record<string, unknown>
  return {
    title: plain(data.title),
    description: plain(data.description),
    toc: data.toc === true,
    headings: headingsOf(parsed.body),
    body: parsed.body,
  }
}
