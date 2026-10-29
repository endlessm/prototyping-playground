// Named states of one view (ADR 0001). The view's regular `<script>` block,
// next to `<script setup>`, exports a plain list:
//
//   export const states = [{ title: 'Member', props: { name: 'Ana' } }, …]
//
// Each state renders the view with its props, and is a child artifact whose
// permanent identity is a leading HTML comment matched by title:
// `<!-- @studio-state <id> <title> -->`. Node reads this file (the manifest,
// identity tools and the build), so titles are read statically, without
// running the view.

// The leading comment region, as in identity.ts: identity is never read from
// code.
export const HEADER = /^\uFEFF?(?:\s|<!--[\s\S]*?-->)*/
const STATE_TAG = /@studio-state\b([^\r\n]*?)(?:-->|$)/gm
const EXPORT = /\bexport\s+const\s+states\b[^=]*=\s*/
const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi

export interface DeclaredStates {
  titles: string[]
  problems: string[]
}

/** The regular `<script>` block's code, not `<script setup>`'s. */
function regularScript(source: string) {
  for (const [, attributes, code] of source.matchAll(SCRIPT))
    if (!/(?:^|\s)setup(?:[\s=]|$)/.test(attributes!)) return code!
  return ''
}

/**
 * The titles of `export const states = [...]`. Each title must be text in
 * quotes on the state object itself (a `title` inside props doesn't count).
 * A view without the export has none.
 */
export function declaredStates(source: string): DeclaredStates {
  const code = regularScript(source)
  const found = EXPORT.exec(code)
  if (!found) return { titles: [], problems: [] }
  let i = found.index + found[0].length
  while (code[i] === '(') i++
  if (code[i] !== '[')
    return {
      titles: [],
      problems: [
        'export const states must be a list written in place: [{ title, props }, …].',
      ],
    }
  const titles: string[] = []
  const problems: string[] = []
  let depth = 0
  let element = -1
  let titled = true
  for (; i < code.length; i++) {
    const ch = code[i]!
    if (ch === '/' && code[i + 1] === '/') {
      i = code.indexOf('\n', i)
      if (i < 0) break
      continue
    }
    if (ch === '/' && code[i + 1] === '*') {
      i = code.indexOf('*/', i + 2) + 1
      if (i <= 0) break
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      i = stringEnd(code, i)
      continue
    }
    if (ch === '[' || ch === '{' || ch === '(') {
      depth++
      if (depth === 2 && ch === '{') {
        if (!titled) problems.push(`state ${element + 1} needs a title.`)
        element++
        titled = false
      }
      continue
    }
    if (ch === ']' || ch === '}' || ch === ')') {
      depth--
      if (depth === 0) break
      continue
    }
    // A key of the state object itself.
    if (
      depth === 2 &&
      /[A-Za-z_$]/.test(ch) &&
      !/[\w$]/.test(code[i - 1] ?? '')
    ) {
      const key = /^title\s*:\s*/.exec(code.slice(i))
      if (!key) continue
      const start = i + key[0].length
      const quote = code[start]
      const end =
        quote === '"' || quote === "'" || quote === '`'
          ? stringEnd(code, start)
          : -1
      const raw = end > start ? code.slice(start + 1, end) : null
      if (
        raw === null ||
        (quote === '`' && raw.includes('${')) ||
        /\\/.test(raw)
      )
        problems.push(
          `state ${element + 1} needs a title written as plain text in quotes, like title: 'Member'.`,
        )
      else titles.push(raw)
      titled = true
      i = Math.max(i, end)
    }
  }
  if (!titled) problems.push(`state ${element + 1} needs a title.`)
  for (const title of titles)
    if (!title.trim() || title !== title.trim() || /[\r\n]|-->/.test(title))
      problems.push(
        `state title ${JSON.stringify(title)} must be text on one line, without surrounding spaces or -->.`,
      )
  const repeated = titles.filter(
    (title, index) => titles.indexOf(title) !== index,
  )
  for (const title of new Set(repeated))
    problems.push(
      `two states are titled ${JSON.stringify(title)}; titles must differ.`,
    )
  return { titles, problems }
}

function stringEnd(code: string, start: number) {
  const quote = code[start]
  for (let i = start + 1; i < code.length; i++) {
    if (code[i] === '\\') i++
    else if (code[i] === quote) return i
  }
  return code.length
}

/** The `@studio-state <id> <title>` comments at the top, in order. */
export function stateDeclarations(source: string) {
  const header = HEADER.exec(source)?.[0] ?? ''
  return [...header.matchAll(STATE_TAG)].map((match) => {
    const parsed = /^\s+(\S+)\s+(.*?)\s*$/.exec(match[1]!)
    return { id: parsed?.[1] ?? '', title: parsed?.[2] ?? '' }
  })
}

/**
 * What the build reports for a view's states: unreadable and repeated
 * titles, and comments that name no state, which is what renaming a title in
 * code but not in its comment leaves behind.
 */
export function check(source: string): string[] {
  const { titles, problems } = declaredStates(source)
  for (const declared of stateDeclarations(source))
    if (!titles.includes(declared.title))
      problems.push(
        `@studio-state ${declared.id} names no state titled ${JSON.stringify(declared.title)}. When renaming a state, change its title in the comment too, which keeps its permanent link; remove the comment only when removing the state.`,
      )
  return problems
}

/**
 * Adds a state's identity comment after the last comment that holds a view
 * or state identity, or else at the top.
 */
export function insertStateDeclaration(
  source: string,
  title: string,
  id: string,
) {
  const bom = source.startsWith('\uFEFF') ? '\uFEFF' : ''
  const eol = source.includes('\r\n') ? '\r\n' : '\n'
  const line = `<!-- @studio-state ${id} ${title} -->`
  const header = HEADER.exec(source)?.[0] ?? ''
  let at = -1
  for (const comment of header.matchAll(/<!--[\s\S]*?-->/g))
    if (/@studio-(?:id|state)\b/.test(comment[0]))
      at = comment.index + comment[0].length
  if (at < 0) return `${bom}${line}${eol}${source.slice(bom.length)}`
  return source.slice(0, at) + eol + line + source.slice(at)
}
