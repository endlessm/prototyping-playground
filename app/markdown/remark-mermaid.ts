// A `mermaid` fence becomes a diagram the reader draws from its source;
// authors still write plain Markdown. Ported from the React studio's rehype
// plugin, one step earlier: Nuxt's MDC runs its code highlighter before any
// rehype plugin a page adds, and a diagram is not code to highlight.
import type { Root, RootContent } from 'mdast'

export const MERMAID_TAG = 'mermaid-diagram'

function walk(node: { children?: RootContent[] }) {
  if (!node.children) return
  node.children = node.children.map((child) => {
    if (child.type === 'code' && child.lang?.toLowerCase() === 'mermaid')
      // Turned into `<mermaid-diagram source="…">` by remark-rehype.
      return {
        type: 'mermaidDiagram',
        data: {
          hName: MERMAID_TAG,
          hProperties: { source: `${child.value}\n` },
        },
      } as unknown as RootContent
    walk(child as { children?: RootContent[] })
    return child
  })
}

export default function remarkMermaid() {
  return (tree: Root) => walk(tree)
}
