// Where the Context & Skills browser shows each guidance document, shared by
// the catalog (on Node) and the reader (in the browser), so it imports
// nothing.

export type GuidanceKind = 'readme' | 'context' | 'skill' | 'reference'

/** A document that links to another, for "About this context". */
export interface GuidanceLink {
  title: string
  owner: string
  address: string
}

export interface GuidanceDocument {
  kind: GuidanceKind
  /**
   * Its address under its owner's: `''` for the README,
   * `context/<path>`, `skills/<name>` or `reference/<name>`, without `.md`.
   */
  address: string
  title: string
  /** Repository-relative. */
  file: string
  /** The documents that link to this one. */
  related: GuidanceLink[]
  /** A skill's files, inside its folder, SKILL.md first. */
  files?: string[]
}

export interface GuidanceOwner {
  /** `platform`, or the module's ID. */
  id: string
  kind: 'platform' | 'module'
  label: string
  /** Repository-relative. */
  folder: string
  documents: GuidanceDocument[]
}

export const GUIDANCE_ROOT = '/documentation/context'

/** The browser's address for an owner's document. */
export const guidanceHref = (owner: string, address = '') =>
  `${GUIDANCE_ROOT}/${owner}${address ? `/${address}` : ''}`

/** `a/b/../c` → `a/c`; null if it climbs above the start. */
function normalize(parts: string[]) {
  const out: string[] = []
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') {
      if (!out.length) return null
      out.pop()
    } else out.push(part)
  }
  return out.join('/')
}

/** The guidance document at a repository-relative file, if any. */
export function guidanceAt(owners: GuidanceOwner[], file: string) {
  for (const owner of owners) {
    const document = owner.documents.find((entry) => entry.file === file)
    if (document) return { owner, document }
  }
  return undefined
}

/** The repository file a relative link in `from` points at, and its hash. */
export function linkedFile(from: string, href: string) {
  if (!href || /^([a-z][a-z0-9+.-]*:|\/\/|#|\?|\/)/i.test(href))
    return undefined
  const [target = '', ...rest] = href.split('#')
  const file = normalize([
    ...from.split('/').slice(0, -1),
    ...decodeURI(target.split('?')[0]!).split('/'),
  ])
  if (!file) return undefined
  return { file, hash: rest.length ? `#${rest.join('#')}` : '' }
}

/**
 * Where a relative link in the guidance file `from` opens in the browser,
 * or undefined when it points at no guidance document.
 */
export function guidanceAddress(
  owners: GuidanceOwner[],
  from: string,
  href: string,
) {
  const linked = linkedFile(from, href)
  if (!linked) return undefined
  const found = guidanceAt(owners, linked.file)
  if (!found) return undefined
  return guidanceHref(found.owner.id, found.document.address) + linked.hash
}
