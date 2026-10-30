// A view's permanent identity is an HTML comment at the top of its `.vue`
// file, `<!-- @studio-id <id> -->`, never in code (ADR 0001). Each named
// state's identity is a comment too, `<!-- @studio-state <id> <title> -->`,
// matched to its state by title (states.ts).
import { isResourceId } from '../../../../../tooling/identity/resource-id.ts'
import type { IdentityAdapter } from '../../../../../tooling/modules/contract.ts'
import {
  declaredStates,
  HEADER,
  insertStateDeclaration,
  stateDeclarations,
} from './states.ts'

const MALFORMED =
  'A permanent identity must be 16 lowercase letters and digits (Crockford base32).'

export const identity: IdentityAdapter = {
  where: 'a leading <!-- @studio-id … --> comment',
  read(source) {
    const header = HEADER.exec(source)?.[0] ?? ''
    const ids = [...header.matchAll(/@studio-id\s+([^\s>]*?)\s*(?:-->|\s)/g)]
    if (ids.length > 1)
      throw new Error(
        'An artifact must declare its permanent identity only once.',
      )
    if (!ids.length) return null
    const id = ids[0]![1]
    if (!isResourceId(id)) throw new Error(MALFORMED)
    return id
  },
  write(source, id) {
    if (!isResourceId(id)) throw new Error(MALFORMED)
    if (identity.read(source) !== null)
      throw new Error('This view already declares its permanent identity.')
    const bom = source.startsWith('\uFEFF') ? '\uFEFF' : ''
    const eol = source.includes('\r\n') ? '\r\n' : '\n'
    return `${bom}<!-- @studio-id ${id} -->${eol}${source.slice(bom.length)}`
  },
  // Each declared title is a child keyed by that title. Comments that name
  // no state are reported by the view's check.
  children: {
    read(source) {
      const ids = new Map<string, string>()
      for (const { id, title } of stateDeclarations(source)) {
        if (ids.has(title))
          throw new Error(
            `A view must declare the identity of state "${title}" only once.`,
          )
        if (!isResourceId(id)) throw new Error(MALFORMED)
        ids.set(title, id)
      }
      return declaredStates(source).titles.map((key) => ({
        key,
        studioId: ids.get(key) ?? null,
      }))
    },
    write(source, key, id) {
      if (!isResourceId(id)) throw new Error(MALFORMED)
      if (stateDeclarations(source).some(({ title }) => title === key))
        throw new Error(
          `This view already declares the identity of state "${key}".`,
        )
      return insertStateDeclaration(source, key, id)
    },
  },
}
