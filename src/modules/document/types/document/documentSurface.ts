// A document's artifact surface. The reader is in the studio's own DOM, so
// what is under a point, where something is now and the selected text are
// read straight from it. A target is a block (a heading, paragraph, list
// item, table row, code block, diagram or embed, an embed being commented on
// as a whole) or a quote, the selected words with a little text either side.
// After the file changes, a quote is found again by its words and context,
// then by the block it was in; a block by its kind and text (an embed by its
// file), the heading it was under and its place there (`anchors.ts`).
import {
  boxOf,
  fraction,
  inside,
  interceptElement,
  sampledChanges,
} from '../../../../../app/utils/domSurface'
import type {
  ArtifactSurface,
  SurfaceAnchor,
  SurfaceLocation,
  SurfacePoint,
  SurfaceTarget,
} from '../../../../../app/utils/artifactSurface'
import {
  findBlock,
  findQuote,
  quoteAt,
  type BlockInfo,
  type TextQuote,
} from './anchors'

/** What a document anchor records, beside every anchor's fields. */
export type DocumentAnchor = SurfaceAnchor &
  BlockInfo &
  Partial<Pick<TextQuote, 'prefix' | 'suffix'>>

// The kinds of block, most specific first: a paragraph in a list item is
// the list item, anything in an embed is the embed.
const BLOCKS: [selector: string, kind: string][] = [
  ['figure[data-embed]', 'embed'],
  ['figure[data-diagram-state]', 'diagram'],
  ['pre', 'code block'],
  ['tr', 'table row'],
  ['li', 'list item'],
  ['h1, h2, h3, h4, h5, h6', 'heading'],
  ['p', 'paragraph'],
]
const ANY_BLOCK = BLOCKS.map(([selector]) => selector).join(', ')
const HEADINGS = 'h1, h2, h3, h4, h5, h6'
// Where the flattened text puts a space, as the eye does.
const BOUNDARIES = `${ANY_BLOCK}, td, th, blockquote, header`
// Text that isn't the document's own words.
const SKIPPED = 'svg, iframe, figure[data-embed], style, script, button'
const MAX_TEXT = 120
const MAX_LABEL_TEXT = 40

const squash = (text: string | null | undefined) =>
  (text ?? '').replace(/\s+/g, ' ').trim()
const clip = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length - 1)}…` : text
const capital = (text: string) => text[0]!.toUpperCase() + text.slice(1)

interface Block extends BlockInfo {
  element: Element
}

/** The block a node is in, and its kind. */
function blockOf(node: Node | null, article: Element) {
  const element = node instanceof Element ? node : (node?.parentElement ?? null)
  if (!element || !article.contains(element)) return null
  for (const [selector, kind] of BLOCKS) {
    const match = element.closest(selector)
    if (match && article.contains(match)) return { element: match, kind }
  }
  return null
}

function textOf(element: Element, kind: string) {
  if (kind === 'embed') return squash(element.getAttribute('data-embed-label'))
  if (kind === 'table row')
    return clip(
      [...element.children]
        .map((cell) => squash(cell.textContent))
        .filter(Boolean)
        .join(' · '),
      MAX_TEXT,
    )
  if (kind === 'diagram') return ''
  return clip(squash(element.textContent), MAX_TEXT)
}

function labelOf(block: BlockInfo) {
  const kind = capital(block.block)
  const name = block.text || block.embed
  return name ? `${kind} "${clip(name, MAX_LABEL_TEXT)}"` : kind
}

/** Every block in document order, with its heading and place under it. */
function blocksOf(article: Element): Block[] {
  const blocks: Block[] = []
  const counts = new Map<string, number>()
  let heading = ''
  let headingId = ''
  for (const element of article.querySelectorAll(ANY_BLOCK)) {
    const own = blockOf(element, article)
    if (own?.element !== element) continue
    if (element.matches(HEADINGS)) {
      heading = textOf(element, 'heading')
      headingId = element.id
    }
    const key = `${headingId}\n${heading}\n${own.kind}`
    const index = counts.get(key) ?? 0
    counts.set(key, index + 1)
    const embed = element.getAttribute('data-embed') ?? undefined
    blocks.push({
      element,
      block: own.kind,
      text: textOf(element, own.kind),
      heading,
      headingId,
      index,
      ...(embed ? { embed } : {}),
    })
  }
  return blocks
}

/** The article's words as one string, each character's place in the DOM. */
function flatten(article: Element) {
  let text = ''
  const places: { node: Text; offset: number }[] = []
  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest(SKIPPED)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  })
  let boundary: Element | null = null
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const textNode = node as Text
    const own = textNode.parentElement?.closest(BOUNDARIES) ?? null
    if (own !== boundary && text && !text.endsWith(' ')) {
      text += ' '
      places.push({ node: textNode, offset: 0 })
    }
    boundary = own
    const data = textNode.data
    for (let offset = 0; offset < data.length; offset++) {
      const space = /\s/.test(data[offset]!)
      if (space && (!text || text.endsWith(' '))) continue
      text += space ? ' ' : data[offset]
      places.push({ node: textNode, offset })
    }
  }
  return { text, places }
}

function rangeOf(
  places: ReturnType<typeof flatten>['places'],
  start: number,
  end: number,
) {
  const first = places[start]
  const last = places[end - 1]
  if (!first || !last) return null
  const range = document.createRange()
  range.setStart(first.node, first.offset)
  range.setEnd(last.node, last.offset + 1)
  return range
}

const unspaced = (text: string) => text.replace(/\s+/g, '')

export function createDocumentSurface(element: HTMLElement): ArtifactSurface {
  const scroller = () =>
    element.querySelector<HTMLElement>('[data-document-scroll]')
  const article = () => scroller()?.querySelector('article') ?? null
  const visible = () => {
    const area = scroller()
    return area ? boxOf(area.getBoundingClientRect()) : null
  }

  // One measurement asks for several anchors at once: the blocks and the
  // text are read once for all of them.
  let memo: { blocks?: Block[]; flat?: ReturnType<typeof flatten> } | null =
    null
  const memoised = () => {
    if (!memo) {
      memo = {}
      queueMicrotask(() => (memo = null))
    }
    return memo
  }
  const blocks = (root: Element) => (memoised().blocks ??= blocksOf(root))
  const flat = (root: Element) => (memoised().flat ??= flatten(root))

  function describe(subject: Element, root: Element) {
    return blocks(root).find((block) => block.element === subject) ?? null
  }

  function targetOf(block: Block, point: SurfacePoint): SurfaceTarget {
    const box = boxOf(block.element.getBoundingClientRect())
    const info: BlockInfo = {
      block: block.block,
      text: block.text,
      heading: block.heading,
      headingId: block.headingId,
      index: block.index,
      ...(block.embed ? { embed: block.embed } : {}),
    }
    const label = labelOf(info)
    const anchor: DocumentAnchor = {
      kind: info.block,
      label,
      at: {
        x: fraction((point.x - box.left) / (box.width || 1)),
        y: fraction((point.y - box.top) / (box.height || 1)),
      },
      ...info,
    }
    return { anchor, label, box }
  }

  function targetAt(point: SurfacePoint): SurfaceTarget | null {
    const root = article()
    const area = visible()
    if (!root || !area || !inside(point, area)) return null
    const own = blockOf(document.elementFromPoint(point.x, point.y), root)
    const block = own && describe(own.element, root)
    return block ? targetOf(block, point) : null
  }

  // The selected words, with the block they start in to fall back on, and
  // the pin at the selection's end.
  function selection(): SurfaceTarget | null {
    const root = article()
    const chosen = window.getSelection()
    if (!root || !chosen?.rangeCount || chosen.isCollapsed) return null
    const range = chosen.getRangeAt(0)
    if (!root.contains(range.commonAncestorContainer)) return null
    const own = blockOf(range.startContainer, root)
    const block = own && describe(own.element, root)
    if (!block) return null
    const { text, places } = flat(root)
    const within = new Map<Node, boolean>()
    let start = -1
    let end = -1
    places.forEach(({ node, offset }, index) => {
      if (!within.has(node)) within.set(node, range.intersectsNode(node))
      if (!within.get(node)) return
      if (node === range.startContainer && offset < range.startOffset) return
      if (node === range.endContainer && offset >= range.endOffset) return
      if (start === -1) start = index
      end = index + 1
    })
    while (start !== -1 && start < end && text[start] === ' ') start++
    while (end > start && text[end - 1] === ' ') end--
    if (start === -1 || start >= end) return null
    const quote = quoteAt(text, start, end)
    const rects = range.getClientRects()
    const last = rects[rects.length - 1] ?? range.getBoundingClientRect()
    const target = targetOf(block, {
      x: last.right,
      y: last.top + last.height / 2,
    })
    const box = boxOf(range.getBoundingClientRect())
    const heading = block.heading
    const label = heading
      ? `Text in "${clip(heading, MAX_LABEL_TEXT)}"`
      : 'Text'
    const anchor: DocumentAnchor = {
      ...(target.anchor as DocumentAnchor),
      kind: 'text',
      label,
      at: {
        x: fraction((last.right - box.left) / (box.width || 1)),
        y: fraction((last.top + last.height / 2 - box.top) / (box.height || 1)),
      },
      quote: quote.exact,
      prefix: quote.prefix,
      suffix: quote.suffix,
    }
    return { anchor, label, box }
  }

  // Each anchor's place, kept while it still holds what it held.
  const quotes = new Map<string, Range>()
  const found = new Map<string, Element>()
  const keyOf = (anchor: DocumentAnchor) =>
    JSON.stringify([
      anchor.quote,
      anchor.prefix,
      anchor.suffix,
      anchor.block,
      anchor.text,
      anchor.embed,
      anchor.headingId,
      anchor.index,
    ])

  function findRange(anchor: DocumentAnchor, root: Element) {
    if (!anchor.quote) return null
    const key = keyOf(anchor)
    const known = quotes.get(key)
    if (
      known &&
      known.startContainer.isConnected &&
      known.endContainer.isConnected &&
      root.contains(known.startContainer) &&
      unspaced(known.toString()) === unspaced(anchor.quote)
    )
      return known
    quotes.delete(key)
    const { text, places } = flat(root)
    const at = findQuote(text, {
      exact: anchor.quote,
      prefix: anchor.prefix ?? '',
      suffix: anchor.suffix ?? '',
    })
    const range = at && rangeOf(places, at.start, at.end)
    if (range) quotes.set(key, range)
    return range
  }

  function findElement(anchor: DocumentAnchor, root: Element) {
    const key = keyOf(anchor)
    const known = found.get(key)
    if (known?.isConnected && root.contains(known)) {
      const own = blockOf(known, root)
      if (
        own?.element === known &&
        own.kind === anchor.block &&
        (anchor.embed
          ? known.getAttribute('data-embed') === anchor.embed
          : textOf(known, own.kind) === anchor.text)
      )
        return known
    }
    found.delete(key)
    const match = findBlock(blocks(root), anchor)?.element ?? null
    if (match) found.set(key, match)
    return match
  }

  function place(anchor: SurfaceAnchor) {
    const root = article()
    if (!root || !anchor.block) return null
    const stored = anchor as DocumentAnchor
    const range = findRange(stored, root)
    if (range) return { range, box: boxOf(range.getBoundingClientRect()) }
    const block = findElement(stored, root)
    return block ? { block, box: boxOf(block.getBoundingClientRect()) } : null
  }

  function locate(anchor: SurfaceAnchor): SurfaceLocation {
    const found = place(anchor)
    const area = visible()
    if (!found || !area || (!found.box.width && !found.box.height))
      return { state: 'missing' }
    const { box } = found
    const point = {
      x: box.left + box.width * anchor.at.x,
      y: box.top + box.height * anchor.at.y,
    }
    return inside(point, area)
      ? { state: 'shown', box, point }
      : { state: 'offscreen', box, point }
  }

  function reveal(anchor: SurfaceAnchor) {
    const found = place(anchor)
    const target = found?.block ?? found?.range?.startContainer.parentElement
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    target?.scrollIntoView({
      block: 'center',
      behavior: reduced ? 'auto' : 'smooth',
    })
  }

  return {
    element,
    targetAt,
    selection,
    locate,
    reveal,
    onChange: sampledChanges(),
    intercept: (input) => interceptElement(element, input),
  }
}
