// Finding a document comment's target again after the file changes: the
// quoted text with its context first, then the block it was in. The reader
// flattens its text into one string; these work on that string and on the
// blocks' descriptions, so the rules hold whatever renders them.
import { describe, expect, test } from 'vitest'
import {
  findBlock,
  findQuote,
  quoteAt,
  type BlockInfo,
} from '../../src/modules/document/types/document/anchors'

describe('a text quote [CM-11] [CM-23]', () => {
  const text =
    'Goals The brief opens with a paragraph. Teachers expect the class link before they invite anyone. The end.'

  test('records the exact text with a short prefix and suffix', () => {
    const start = text.indexOf('the class link')
    const quote = quoteAt(text, start, start + 'the class link'.length, 12)
    expect(quote).toEqual({
      exact: 'the class link',
      prefix: 'hers expect ',
      suffix: ' before they',
    })
  })

  test('is found again where the same words are now', () => {
    const start = text.indexOf('the class link')
    const quote = quoteAt(text, start, start + 14)
    const edited = `A new opening sentence. ${text}`
    const found = findQuote(edited, quote)
    expect(found && edited.slice(found.start, found.end)).toBe('the class link')
    expect(found!.start).toBe(edited.indexOf('the class link'))
  })

  test('is found when the words right before it changed', () => {
    const start = text.indexOf('the class link')
    const quote = quoteAt(text, start, start + 14)
    const edited = text.replace('Teachers expect', 'Most people want')
    expect(findQuote(edited, quote)?.start).toBe(
      edited.indexOf('the class link'),
    )
  })

  test('the context tells repeated words apart', () => {
    const repeated = 'Line one. Say hello. Line two. Say hello. Line three.'
    const second = repeated.lastIndexOf('Say hello')
    const quote = quoteAt(repeated, second, second + 9, 10)
    expect(findQuote(repeated, quote)?.start).toBe(second)
    // Text added before both keeps the second one.
    const edited = `Say hello. ${repeated}`
    expect(findQuote(edited, quote)?.start).toBe(
      edited.lastIndexOf('Say hello'),
    )
  })

  test('is not found when its words are gone', () => {
    const start = text.indexOf('the class link')
    const quote = quoteAt(text, start, start + 14)
    expect(findQuote(text.replace('class link', 'invite'), quote)).toBeNull()
  })
})

describe('a block [CM-13] [CM-23]', () => {
  const block = (
    kind: string,
    text: string,
    heading: string,
    index: number,
    embed?: string,
  ): BlockInfo => ({
    block: kind,
    text,
    heading,
    headingId: heading.toLowerCase(),
    index,
    ...(embed ? { embed } : {}),
  })

  test('is found by its kind and text after blocks are added before it', () => {
    const anchor = block('list item', 'Share the notes', 'Goals', 1)
    const now = [
      block('heading', 'Goals', 'Goals', 0),
      block('list item', 'Book the room', 'Goals', 0),
      block('list item', 'Interview five people', 'Goals', 1),
      block('list item', 'Share the notes', 'Goals', 2),
    ]
    expect(findBlock(now, anchor)).toBe(now[3])
  })

  test('the heading and then the place under it tell the same text apart', () => {
    const now = [
      block('paragraph', 'The end.', 'Details', 0),
      block('paragraph', 'The end.', 'Last section', 0),
      block('paragraph', 'The end.', 'Last section', 1),
    ]
    expect(
      findBlock(now, block('paragraph', 'The end.', 'Last section', 1)),
    ).toBe(now[2])
    expect(findBlock(now, block('paragraph', 'The end.', 'Details', 0))).toBe(
      now[0],
    )
    // Its heading was renamed: the same text elsewhere still counts.
    expect(findBlock(now, block('paragraph', 'The end.', 'Ending', 0))).toBe(
      now[0],
    )
  })

  test('another kind with the same text is something else', () => {
    const now = [block('paragraph', 'Goals', 'Goals', 0)]
    expect(findBlock(now, block('heading', 'Goals', 'Goals', 0))).toBeNull()
  })

  test('a block whose text changed is not found', () => {
    const now = [block('table row', 'Sign in Ben', 'Goals', 0)]
    expect(
      findBlock(now, block('table row', 'Sign in Ada', 'Goals', 0)),
    ).toBeNull()
  })

  test('an embed is found by the file it embeds, whatever its caption', () => {
    const anchor = block('embed', 'Home screen', 'Screens', 0, './Home.vue')
    const now = [
      block('embed', 'The notes', 'Screens', 0, './more/Notes.md'),
      block('embed', 'The home screen', 'Screens', 1, './Home.vue'),
    ]
    expect(findBlock(now, anchor)).toBe(now[1])
  })
})
