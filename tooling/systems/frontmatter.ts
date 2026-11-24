// A Markdown file's YAML frontmatter, read the one way the studio's
// tooling reads it: system pages, skills and the app copy's record. A leaf
// module, so both the catalog and the app copy import it.
import { parse } from 'yaml'

/** A Markdown file's frontmatter, or null when it has none. */
export function frontmatter(source: string): Record<string, unknown> | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)
  if (!match) return null
  try {
    const data = parse(match[1]!)
    return data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}
