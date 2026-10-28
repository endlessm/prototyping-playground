// A view's permanent identity is an HTML comment at the top of its `.vue`
// file, `<!-- @studio-id <id> -->`, never in code (ADR 0001).
import { isResourceId } from '../../../../../tooling/identity/resource-id.ts'
import type { IdentityReader } from '../../../../../tooling/modules/contract.ts'

const LEADING = /^\uFEFF?(?:\s|<!--[\s\S]*?-->)*/

export const identity: IdentityReader = {
  read(source) {
    const header = LEADING.exec(source)?.[0] ?? ''
    const ids = [...header.matchAll(/@studio-id\s+([^\s>]*?)\s*(?:-->|\s)/g)]
    if (ids.length > 1)
      throw new Error(
        'An artifact must declare its permanent identity only once.',
      )
    if (!ids.length) return null
    const id = ids[0]![1]
    if (!isResourceId(id))
      throw new Error(
        'A permanent identity must be 16 lowercase letters and digits (Crockford base32).',
      )
    return id
  },
}
