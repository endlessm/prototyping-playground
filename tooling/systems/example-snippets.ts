// Each example's own code, cut from its component's examples file on Node:
// the content of every top-level `<Example name="…">` block in the file's
// template, dedented, so a variant shows and copies only its example. A file
// this can't read (no template, unbalanced or unnamed blocks, a name used
// twice) gives the whole file under every example instead.

// An opening or closing tag, with quoted attribute values that may hold `>`.
const ATTRIBUTES = String.raw`(?:[^>"']|"[^"]*"|'[^']*')*?`
const EXAMPLE_TAG = new RegExp(
  String.raw`<(\/?)Example\b(${ATTRIBUTES})(\/?)>`,
  'g',
)
const TEMPLATE_TAG = new RegExp(
  String.raw`<(\/?)template\b(${ATTRIBUTES})(\/?)>`,
  'gi',
)
const NAME = /(?:^|\s)name\s*=\s*(["'])(.*?)\1/

/** Blanks out comments and script and style blocks, keeping every offset. */
function mask(source: string) {
  if (/<!--(?![\s\S]*?-->)/.test(source)) return null
  const blank = (text: string) => text.replace(/[^\n]/g, ' ')
  return source
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, blank)
}

/** Where the file's root `<template>` holds its content, or null. */
function templateBody(masked: string) {
  let depth = 0
  let start = -1
  for (const tag of masked.matchAll(TEMPLATE_TAG)) {
    const [whole, closing, , selfClosing] = tag
    if (selfClosing) continue
    if (!closing) {
      if (depth++ === 0) start = tag.index + whole.length
    } else if (--depth === 0) return { start, end: tag.index }
    else if (depth < 0) return null
  }
  return null
}

/** Removes the indentation every line shares, and blank lines around them. */
export function dedent(text: string) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  // Content that starts on the opening tag's line has lost its indentation.
  const first = lines[0]!.trim() ? lines.shift()!.trimStart() : null
  while (lines.length && !lines[0]!.trim()) lines.shift()
  while (lines.length && !lines.at(-1)!.trim()) lines.pop()
  const indent = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => /^[ \t]*/.exec(line)![0].length),
  )
  const rest = lines.map((line) => line.slice(indent).trimEnd())
  return (first === null ? rest : [first.trimEnd(), ...rest]).join('\n').trim()
}

/**
 * Each top-level `<Example name>` block's content, dedented, by name in the
 * file's order; null when the file can't be split.
 */
export function splitExamples(source: string): Map<string, string> | null {
  const masked = mask(source)
  const body = masked && templateBody(masked)
  if (!masked || !body) return null
  const template = masked.slice(body.start, body.end)
  const snippets = new Map<string, string>()
  let depth = 0
  let name = ''
  let contentStart = 0
  for (const tag of template.matchAll(EXAMPLE_TAG)) {
    const [whole, closing, attributes, selfClosing] = tag
    if (closing) {
      if (depth === 0) return null
      if (--depth === 0)
        snippets.set(
          name,
          dedent(
            source.slice(body.start + contentStart, body.start + tag.index),
          ),
        )
      continue
    }
    if (depth > 0) {
      if (!selfClosing) depth++
      continue
    }
    const found = NAME.exec(attributes!)?.[2]
    if (found === undefined || snippets.has(found)) return null
    if (selfClosing) {
      snippets.set(found, '')
      continue
    }
    name = found
    depth = 1
    contentStart = tag.index + whole.length
  }
  return depth === 0 ? snippets : null
}

/**
 * The code each example shows, by its name: its own block when the file
 * splits into exactly these examples, otherwise the whole file. Either way
 * with Unix line endings, so a copy pastes the same on every computer.
 */
export function exampleSnippets(source: string, names: string[]) {
  const split = splitExamples(source)
  const fits =
    split !== null &&
    split.size === names.length &&
    names.every((name) => split.has(name))
  const whole = source.replace(/\r\n?/g, '\n').trimEnd()
  return Object.fromEntries(
    names.map((name) => [name, fits ? split.get(name)! : whole]),
  ) as Record<string, string>
}
