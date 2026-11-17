// The preview document's IDs for what a system shows besides views: each
// example of its component pages, each component's playground and its own
// Overview content. Node only.
import { createHash } from 'node:crypto'

const CROCKFORD = '0123456789abcdefghjkmnpqrstvwxyz'

// 80 bits of a hash, in the alphabet of permanent IDs, so the preview
// document can show it like a view.
function idOf(text: string) {
  const bytes = createHash('sha256').update(text).digest()
  let id = ''
  for (let index = 0; index < 16; index++) {
    const bit = index * 5
    const value =
      (bytes.readUInt16BE(Math.floor(bit / 8)) >> (11 - (bit % 8))) & 31
    id += CROCKFORD[value]
  }
  return id
}

/** The preview document's ID for one example of a component's page. */
export const exampleId = (system: string, slug: string, name: string) =>
  idOf(`example:${system}:${slug}:${name}`)

/**
 * The preview document's ID for a component's playground: its component
 * file mounted alone, with the props the studio sends.
 */
export const playgroundId = (system: string, slug: string) =>
  idOf(`playground:${system}:${slug}`)

/**
 * The preview document's ID for a component's Breakdown: its component file
 * instrumented so each piece's elements carry its node ID, mounted like its
 * playground.
 */
export const breakdownId = (system: string, slug: string) =>
  idOf(`breakdown:${system}:${slug}`)

/**
 * The preview document's ID for a Lab experiment's Breakdown: the view's
 * file instrumented like a component's, mounted as the view.
 */
export const experimentBreakdownId = (view: string) =>
  idOf(`experiment-breakdown:${view}`)

/** The preview document's ID for a system's own Overview content. */
export const overviewId = (system: string) => idOf(`overview:${system}`)
