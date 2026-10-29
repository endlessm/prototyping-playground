// A Markdown file's frontmatter: the YAML block between `---` lines at the
// very top. Framework-neutral; the identity adapter and the checks use it on
// Node, and the reader in the browser.
import { parse } from 'yaml'

const OPENING = /^\uFEFF?---\r?\n/
const CLOSING = /^---[ \t]*(?:\r?\n|$)/m

export interface FrontmatterRegion {
  /** Where the YAML starts and ends, between the `---` lines. */
  start: number
  end: number
}

/** The frontmatter's YAML, or null without one; `open` if never closed. */
export function frontmatterRegion(
  source: string,
): FrontmatterRegion | 'open' | null {
  const opening = OPENING.exec(source)
  if (!opening) return null
  const start = opening[0].length
  const closing = CLOSING.exec(source.slice(start))
  if (!closing) return 'open'
  return { start, end: start + closing.index }
}

/** The frontmatter's fields; throws on YAML that doesn't parse. */
export function frontmatterOf(source: string): Record<string, unknown> {
  const region = frontmatterRegion(source)
  if (!region || region === 'open') return {}
  const value: unknown = parse(source.slice(region.start, region.end))
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}
