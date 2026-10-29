// Raw HTML in a Markdown file is shown as the text that was typed, not
// rendered and not dropped: documents are plain Markdown, and something like
// <placeholder> in a sentence should still read. An HTML comment is dropped
// instead, so it can hold a note for whoever edits the file. Ported from the
// React studio's remark plugin.
import type { Nodes, Paragraph, Root, Text } from 'mdast'

const PHRASING = new Set([
  'paragraph',
  'heading',
  'emphasis',
  'strong',
  'delete',
  'link',
  'linkReference',
  'tableCell',
])

function walk(node: Nodes) {
  if (!('children' in node)) return
  const parent = node as { type: string; children: Nodes[] }
  parent.children = parent.children.flatMap((child): Nodes[] => {
    if (child.type !== 'html') {
      walk(child)
      return [child]
    }
    if (/^<!--[\s\S]*-->\s*$/.test(child.value)) return []
    const text: Text = { type: 'text', value: child.value }
    const paragraph: Paragraph = { type: 'paragraph', children: [text] }
    return [PHRASING.has(parent.type) ? text : paragraph]
  })
}

export default function remarkHtmlAsText() {
  return (tree: Root) => walk(tree)
}
