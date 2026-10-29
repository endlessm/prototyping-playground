// A file image on its own line (a file of the prototype, or an artifact's
// permanent address) becomes a file embed, not an image request;
// an inline one stays a link, so previews never nest inside paragraphs.
// Ordinary pictures stay images. Each embed is keyed by its file and how
// many times that file came before, so it keeps its place (and its running
// preview) while the text around it changes. Ported from the React studio's
// rehype plugin.
import type { Element, ElementContent, Root, RootContent } from 'hast'

export const EMBED_TAG = 'prototype-artifact'

const PICTURE = /\.(png|jpe?g|gif|webp|svg|avif|ico)(?:[?#]|$)/i
// An artifact's (or a named state's) permanent address.
const PERMANENT = /^\/prototypes\/[^/?#]+\/artifacts\/[^/?#]+\/?(?:[?#]|$)/
const isFile = (node: RootContent | ElementContent): node is Element =>
  node.type === 'element' &&
  node.tagName === 'img' &&
  typeof node.properties.src === 'string' &&
  (PERMANENT.test(node.properties.src) ||
    (/\.[a-z0-9]+(?:[?#]|$)/i.test(node.properties.src) &&
      !PICTURE.test(node.properties.src)))

export default function rehypeFileEmbeds() {
  return (tree: Root) => {
    const seen = new Map<string, number>()
    const walk = (node: Root | Element) => {
      node.children = node.children.map((child) => {
        if (child.type !== 'element') return child
        const only = child.children.length === 1 && child.children[0]
        if (child.tagName === 'p' && only && isFile(only)) {
          const source = only.properties.src as string
          const count = seen.get(source) ?? 0
          seen.set(source, count + 1)
          const label = only.properties.alt
          return {
            type: 'element',
            tagName: EMBED_TAG,
            properties: {
              source,
              label: typeof label === 'string' && label ? label : '',
              key: `${EMBED_TAG}:${source}:${count}`,
            },
            children: [],
          }
        }
        if (isFile(child)) {
          const label = child.properties.alt
          return {
            type: 'element',
            tagName: 'a',
            properties: { href: child.properties.src },
            children: [
              {
                type: 'text',
                value: typeof label === 'string' && label ? label : '',
              },
            ],
          }
        }
        walk(child)
        return child
      }) as typeof node.children
    }
    walk(tree)
  }
}
