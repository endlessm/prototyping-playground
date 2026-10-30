// A Markdown file's frontmatter: the YAML block between `---` lines at the
// very top. Only Node built-ins, like the rest of what the `studio` command
// loads: top-level fields are read line by line, and the reader parses the
// YAML itself.

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

/** Each declaration of a top-level field, as written, unquoted. */
export function frontmatterValues(source: string, name: string) {
  const region = frontmatterRegion(source)
  if (!region || region === 'open') return []
  return [
    ...source
      .slice(region.start, region.end)
      .matchAll(new RegExp(`^${name}:[ \\t]*([^\\r\\n]*)`, 'gm')),
  ].map((match) =>
    match[1]!
      .replace(/\s+#.*$/, '')
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2'),
  )
}
