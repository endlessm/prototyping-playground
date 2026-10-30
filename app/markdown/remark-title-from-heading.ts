// A Markdown file's title is the `title` in its frontmatter. In plain
// Markdown it is usually the first heading. When the frontmatter has a title,
// an opening level-one heading that repeats it leaves the body; without one,
// an opening level-one heading becomes the title and leaves the body. A
// skill's SKILL.md has no title in its format, so without a heading its
// `name` is the title ("document-component" → "Document component").
// Ported from the React studio's remark plugin; the frontmatter arrives as
// the file's data, as Nuxt's MDC parser passes it.
import type { Root, RootContent } from 'mdast'
import type { VFile } from 'vfile'

const SKILL_FILE = 'SKILL.md'

const textOf = (node: RootContent | Root): string =>
  'value' in node && typeof node.value === 'string'
    ? node.value
    : 'children' in node
      ? (node.children as RootContent[]).map(textOf).join('')
      : ''

export function skillTitle(name: string) {
  const words = name.replace(/-+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export default function remarkTitleFromHeading() {
  return (tree: Root, file: VFile) => {
    const data = file.data as Record<string, unknown>
    const first = tree.children[0]
    const opening =
      first?.type === 'heading' && first.depth === 1 ? textOf(first).trim() : ''
    if (typeof data.title === 'string' && data.title.trim()) {
      if (opening && opening === data.title.trim()) tree.children.shift()
      return
    }
    if (opening) {
      data.title = opening
      tree.children.shift()
      return
    }
    const name = file.path?.split(/[\\/]/).pop()
    if (name === SKILL_FILE && typeof data.name === 'string')
      data.title = skillTitle(data.name)
  }
}
