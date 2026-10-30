// A system's pages: their addresses, the files their source opens, and the
// documents behind the Context and Skills addresses. Plain functions over
// the catalog, so every page and the navigation agree.
import type {
  SystemCatalog,
  TokenGroup,
} from '../../../../tooling/systems/catalog'
import { isBinaryFile } from '../../../../tooling/systems/text-files'

/** The theme's pages, in navigation order, each for one token group. */
export const THEME_PAGES: { id: string; group: TokenGroup }[] = [
  { id: 'colors', group: 'colors' },
  { id: 'typography', group: 'typography' },
  { id: 'radius', group: 'radius' },
  { id: 'shadows', group: 'shadows' },
  { id: 'spacing', group: 'spacing' },
  { id: 'motion', group: 'motion' },
  { id: 'effects', group: 'effects' },
  { id: 'tokens', group: 'other' },
]

export const ASSET_PAGES = ['fonts', 'icons', 'images'] as const

export const systemAddress = (id: string, page = '') =>
  `/systems/${id}${page ? `/${page}` : ''}`

/**
 * The theme pages the system's tokens fill. A system with a stylesheet
 * always has Typography, which says what it doesn't declare.
 */
export const themePages = (system: SystemCatalog) =>
  THEME_PAGES.filter(
    ({ group }) =>
      (group === 'typography' && system.stylesheet) ||
      system.tokens.some((token) => token.group === group),
  )

/** `/systems/<id>/icons/<path>`, each part of the path encoded. */
export const assetAddress = (
  system: SystemCatalog,
  asset: SystemCatalog['assets'][number],
) =>
  systemAddress(
    system.id,
    `${asset.kind}/${asset.path.split('/').map(encodeURIComponent).join('/')}`,
  )

const withoutMarkdown = (file: string) => file.replace(/\.md$/i, '')

/** `flows/sign-in.md` in Context → `/systems/<id>/context/flows/sign-in`. */
export const contextAddress = (system: SystemCatalog, file: string) =>
  systemAddress(system.id, `context/${withoutMarkdown(file)}`)

/** A file inside `skills/` → `/systems/<id>/skills/<skill>/SKILL`. */
export const skillAddress = (system: SystemCatalog, file: string) =>
  systemAddress(system.id, `skills/${withoutMarkdown(file)}`)

/**
 * The repository path of the document at a Context or Skills address. A
 * skill's other text files (a script) keep their extension in theirs.
 */
export function documentFile(
  system: SystemCatalog,
  section: 'context' | 'skills',
  address: string,
) {
  const file = `${address}.md`
  if (section === 'context')
    return system.context.find((document) => document.path === file)?.file
  const [name, ...rest] = address.split('/')
  const skill = system.skills.find((entry) => entry.name === name)
  const inside = rest.join('/')
  if (skill?.files.includes(`${inside}.md`))
    return `${system.folder}/skills/${file}`
  return skill?.files.includes(inside) &&
    !isDocument(inside) &&
    !isBinaryFile(inside)
    ? `${system.folder}/skills/${address}`
    : undefined
}

/** Whether a Context or Skills file is a document, rather than plain text. */
export function isDocument(file: string) {
  return /\.md$/i.test(file)
}

/**
 * The file the page's source opens, inside the system's folder: the
 * declaration for the Overview and Icons, the stylesheet for theme pages,
 * the document for Context and Skills. Null where there is none.
 */
export function sourceFile(system: SystemCatalog, page: string) {
  if (page === '' || page === 'icons') return 'system.ts'
  if (THEME_PAGES.some(({ id }) => id === page))
    return system.stylesheet
      ? system.stylesheet.slice(system.folder.length + 1)
      : null
  for (const section of ['context', 'skills'] as const)
    if (page.startsWith(`${section}/`)) {
      const file = documentFile(system, section, page.slice(section.length + 1))
      return file ? file.slice(system.folder.length + 1) : null
    }
  return null
}

/**
 * Where a link inside a document goes: another of the system's Context or
 * Skills documents opens in the studio; anything else is left as written.
 */
export function documentLink(
  system: SystemCatalog,
  from: string,
  href: string,
): string | undefined {
  if (/^[a-z][a-z0-9+.-]*:|^\/|^#/i.test(href)) return undefined
  const [target, hash] = href.split('#')
  if (!target) return undefined
  const parts = from.split('/').slice(0, -1)
  for (const part of target.split('/'))
    if (part === '..') parts.pop()
    else if (part !== '.') parts.push(part)
  const file = parts.join('/')
  const inside = file.slice(system.folder.length + 1)
  for (const section of ['context', 'skills'] as const)
    if (inside.startsWith(`${section}/`)) {
      const address = withoutMarkdown(inside.slice(section.length + 1))
      if (section === 'context' && !isDocument(target)) return undefined
      if (documentFile(system, section, address) !== file) return undefined
      return `${systemAddress(system.id, `${section}/${address}`)}${hash ? `#${hash}` : ''}`
    }
  return undefined
}

/** The newest first; by title within a day. */
export const byNewest = <T extends { created: string | null; title: string }>(
  items: T[],
) =>
  [...items].sort(
    (a, b) =>
      (b.created ?? '').localeCompare(a.created ?? '') ||
      a.title.localeCompare(b.title),
  )
