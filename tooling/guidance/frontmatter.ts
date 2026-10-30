// The top-level fields of a Markdown file's frontmatter (the block between
// `---` lines at the very top), read line by line with Node built-ins only,
// because the `studio` command loads what uses it. Values are plain
// strings, quoted strings or numbers; nested YAML is not needed here.

const BLOCK = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/

export type FrontmatterValue = string | number | boolean

/** The fields, or null when the file has no closed frontmatter. */
export function frontmatter(
  source: string,
): Record<string, FrontmatterValue> | null {
  const block = BLOCK.exec(source)
  if (!block) return null
  const fields: Record<string, FrontmatterValue> = {}
  for (const line of block[1]!.split(/\r?\n/)) {
    const field = /^([A-Za-z][\w-]*):[ \t]*(.*)$/.exec(line)
    if (!field) continue
    fields[field[1]!] = scalar(field[2]!.trim())
  }
  return fields
}

function scalar(text: string): FrontmatterValue {
  if (/^".*"$/.test(text)) {
    try {
      return JSON.parse(text) as string
    } catch {
      return text.slice(1, -1)
    }
  }
  if (/^'.*'$/.test(text)) return text.slice(1, -1).replaceAll("''", "'")
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  if (text === 'true' || text === 'false') return text === 'true'
  return text.replace(/\s+#.*$/, '')
}

/** The file's text without its frontmatter. */
export const withoutFrontmatter = (source: string) => source.replace(BLOCK, '')

/** A Markdown file's title: its frontmatter's, or its first `#` heading. */
export function markdownTitle(source: string): string | undefined {
  const declared = frontmatter(source)?.title
  if (typeof declared === 'string' && declared.trim()) return declared.trim()
  return /^#[ \t]+(.+?)[ \t]*#*[ \t]*$/m.exec(withoutFrontmatter(source))?.[1]
}
