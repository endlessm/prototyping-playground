// A document's permanent identity is `studioId` in its frontmatter, never in
// the text people read (ADR 0001).
import { isResourceId } from '../../../../../tooling/identity/resource-id.ts'
import type { IdentityAdapter } from '../../../../../tooling/modules/contract.ts'
import { frontmatterRegion } from './frontmatter.ts'

const MALFORMED =
  'A permanent identity must be 16 lowercase letters and digits (Crockford base32).'

export const identity: IdentityAdapter = {
  where: 'the frontmatter, as studioId',
  read(source) {
    const region = frontmatterRegion(source)
    if (!region || region === 'open') return null
    const ids = [
      ...source
        .slice(region.start, region.end)
        .matchAll(/^studioId:[ \t]*([^\r\n]*)/gm),
    ].map((match) => match[1]!.trim().replace(/^(['"])(.*)\1$/, '$2'))
    if (ids.length > 1)
      throw new Error(
        'An artifact must declare its permanent identity only once.',
      )
    if (!ids.length) return null
    if (!isResourceId(ids[0])) throw new Error(MALFORMED)
    return ids[0]
  },
  write(source, id) {
    if (!isResourceId(id)) throw new Error(MALFORMED)
    const region = frontmatterRegion(source)
    if (region === 'open')
      throw new Error(
        'Close the frontmatter (the block at the top between --- lines) before giving the document its permanent identity.',
      )
    if (identity.read(source) !== null)
      throw new Error('This document already declares its permanent identity.')
    const eol = source.includes('\r\n') ? '\r\n' : '\n'
    if (region)
      return `${source.slice(0, region.start)}studioId: ${id}${eol}${source.slice(region.start)}`
    const bom = source.startsWith('\uFEFF') ? '\uFEFF' : ''
    return `${bom}---${eol}studioId: ${id}${eol}---${eol}${source.slice(bom.length)}`
  },
}
