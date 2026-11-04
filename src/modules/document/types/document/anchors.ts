// How a document's surface finds a target again after the file changes,
// with no DOM: the reader flattens its text into one string (whitespace
// squashed, a space between blocks) and describes its blocks, and these
// pick the match. A quote is a text-quote selector, its exact words with a
// little of the text either side, found again by those words and the best
// context. A block is found again by its kind and text (an embed by the file
// it embeds), the heading it was under and its place there telling equal
// ones apart.

/** Selected text, with the text just before and after it. */
export interface TextQuote {
  exact: string
  prefix: string
  suffix: string
}

/** A block of the document as the surface describes it. */
export interface BlockInfo {
  /** `heading`, `paragraph`, `list item`, `table row`, `code block`, `embed`… */
  block: string
  /** Its text, squashed and clipped; an embed's caption. */
  text: string
  /** The nearest heading at or before it, and that heading's anchor. */
  heading: string
  headingId: string
  /** Its place among the blocks of its kind under that heading. */
  index: number
  /** The embedded file's reference, as written in the document. */
  embed?: string
}

export const QUOTE_CONTEXT = 32

/** The quote of `text` from `start` to `end`, with its context. */
export function quoteAt(
  text: string,
  start: number,
  end: number,
  context = QUOTE_CONTEXT,
): TextQuote {
  return {
    exact: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - context), start),
    suffix: text.slice(end, end + context),
  }
}

function sharedEnd(a: string, b: string) {
  let length = 0
  while (
    length < a.length &&
    length < b.length &&
    a[a.length - 1 - length] === b[b.length - 1 - length]
  )
    length++
  return length
}
function sharedStart(a: string, b: string) {
  let length = 0
  while (length < a.length && length < b.length && a[length] === b[length])
    length++
  return length
}

/**
 * Where the quote's words are in `text` now: of every place they occur, the
 * one whose surroundings match its context best, the first on a tie.
 */
export function findQuote(
  text: string,
  quote: TextQuote,
): { start: number; end: number } | null {
  if (!quote.exact) return null
  let best: { start: number; score: number } | null = null
  for (
    let start = text.indexOf(quote.exact);
    start !== -1;
    start = text.indexOf(quote.exact, start + 1)
  ) {
    const end = start + quote.exact.length
    const score =
      sharedEnd(
        text.slice(Math.max(0, start - quote.prefix.length), start),
        quote.prefix,
      ) + sharedStart(text.slice(end, end + quote.suffix.length), quote.suffix)
    if (!best || score > best.score) best = { start, score }
  }
  return best && { start: best.start, end: best.start + quote.exact.length }
}

/**
 * The block `anchor` describes, among the document's blocks now: one of its
 * kind with its text (an embed: of the same file), preferring the same
 * heading, then the nearest place under it.
 */
export function findBlock<T extends BlockInfo>(
  blocks: readonly T[],
  anchor: BlockInfo,
): T | null {
  const candidates = blocks.filter(
    (block) =>
      block.block === anchor.block &&
      (anchor.embed
        ? block.embed === anchor.embed
        : block.text === anchor.text),
  )
  const rank = (block: BlockInfo) =>
    (block.headingId === anchor.headingId ? 0 : 1_000_000) +
    Math.abs(block.index - anchor.index)
  let best: T | null = null
  for (const block of candidates)
    if (!best || rank(block) < rank(best)) best = block
  return best
}
