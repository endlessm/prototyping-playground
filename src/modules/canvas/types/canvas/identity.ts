// A canvas's permanent identity is its file's top-level `"studioId"`, next to
// the format version, never inside a drawn element (ADR 0001).
import { isResourceId } from '../../../../../tooling/identity/resource-id.ts'
import type { IdentityAdapter } from '../../../../../tooling/modules/contract.ts'

const MALFORMED =
  'A permanent identity must be 16 lowercase letters and digits (Crockford base32).'

// The top-level keys in the order the text declares them. JSON.parse keeps
// the last of two equal keys, so a second declaration is found here.
function topLevelKeys(source: string) {
  const keys: string[] = []
  let depth = 0
  for (const token of source.matchAll(/"(?:\\[\s\S]|[^"\\])*"|[{}[\]]/g)) {
    if (token[0] === '{' || token[0] === '[') depth++
    else if (token[0] === '}' || token[0] === ']') depth--
    else if (
      depth === 1 &&
      /^\s*:/.test(source.slice(token.index + token[0].length))
    )
      keys.push(JSON.parse(token[0]) as string)
  }
  return keys
}

export const identity: IdentityAdapter = {
  where: 'a top-level "studioId"',
  read(source) {
    let file: unknown
    try {
      file = JSON.parse(source)
    } catch {
      // A broken file keeps its identity, so it stays in the studio and
      // its page can say what is wrong with it.
      const found = /^\uFEFF?\s*\{[^{[]*?"studioId"\s*:\s*"([^"]*)"/.exec(
        source,
      )
      if (!found) return null
      if (!isResourceId(found[1])) throw new Error(MALFORMED)
      return found[1]
    }
    if (!file || typeof file !== 'object' || Array.isArray(file))
      throw new Error('A canvas must be one JSON object.')
    if (topLevelKeys(source).filter((key) => key === 'studioId').length > 1)
      throw new Error('A canvas must declare its permanent identity only once.')
    const id = (file as Record<string, unknown>).studioId
    if (id === undefined) return null
    if (!isResourceId(id)) throw new Error(MALFORMED)
    return id
  },
  write(source, id) {
    if (!isResourceId(id)) throw new Error(MALFORMED)
    if (identity.read(source) !== null)
      throw new Error('This canvas already declares its permanent identity.')
    const entries = Object.entries(
      JSON.parse(source) as Record<string, unknown>,
    )
    const after = ['studioVersion', 'version', 'type']
      .map((key) => entries.findIndex(([name]) => name === key))
      .find((index) => index >= 0)
    entries.splice((after ?? -1) + 1, 0, ['studioId', id])
    const eol = source.includes('\r\n') ? '\r\n' : '\n'
    return `${JSON.stringify(Object.fromEntries(entries), null, 2).replaceAll('\n', eol)}${eol}`
  },
}
