// A diagram's permanent identity is a Mermaid comment before the diagram,
// `%% @studio-id <id>`, which Mermaid ignores and nobody reads (ADR 0001).
import { isResourceId } from '../../../../../tooling/identity/resource-id.ts'
import type { IdentityAdapter } from '../../../../../tooling/modules/contract.ts'

const MALFORMED =
  'A permanent identity must be 16 lowercase letters and digits (Crockford base32).'

// Blank lines and `%%` comments at the top, before the diagram starts.
const HEADER = /^\uFEFF?(?:[ \t]*(?:%%[^\r\n]*)?(?:\r?\n|$))*/

export const identity: IdentityAdapter = {
  where: 'a leading %% @studio-id comment',
  read(source) {
    const header = HEADER.exec(source)?.[0] ?? ''
    const ids = [...header.matchAll(/^[ \t]*%%[ \t]*@studio-id\b(.*)$/gm)]
    if (ids.length > 1)
      throw new Error(
        'An artifact must declare its permanent identity only once.',
      )
    if (!ids.length) return null
    const id = ids[0]![1]!.trim()
    if (!isResourceId(id)) throw new Error(MALFORMED)
    return id
  },
  write(source, id) {
    if (!isResourceId(id)) throw new Error(MALFORMED)
    if (identity.read(source) !== null)
      throw new Error('This diagram already declares its permanent identity.')
    const bom = source.startsWith('\uFEFF') ? '\uFEFF' : ''
    const eol = source.includes('\r\n') ? '\r\n' : '\n'
    return `${bom}%% @studio-id ${id}${eol}${source.slice(bom.length)}`
  },
}
