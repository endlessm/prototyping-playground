// What the Systems area shows about each system, read from its folder on
// Node: the Overview's summaries and counts, its libraries with the
// installed versions, the theme's tokens by page, documented components,
// local assets, and the Context and Skills documents. Also the checks of a
// system's Context and Skills, which the dev server and the build report.
// Framework-neutral; the systems module's build data serves it.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { directories, posix, treeFiles } from '../manifest/build.ts'
import type { SystemAssetKind, SystemIcons, SystemLibrary } from './contract.ts'
import type { InstalledSystem } from './registry.ts'
import { isBinaryFile, isTextContent } from './text-files.ts'
import { stylesheetTokens, type ThemeToken, type TokenGroup } from './tokens.ts'

export type { ColorSection, ThemeToken, TokenGroup } from './tokens.ts'

/** The theme's pages, in navigation order. */
export const TOKEN_GROUPS: TokenGroup[] = [
  'colors',
  'typography',
  'radius',
  'shadows',
  'spacing',
  'motion',
  'effects',
  'other',
]

export interface CatalogLibrary extends Omit<
  SystemLibrary,
  'components' | 'assets'
> {
  /** The installed version, or null when the package isn't installed. */
  version: string | null
  components: string[]
  assets: SystemAssetKind[]
}

export interface CatalogComponent {
  /** Its folder under `components/`, and its address. */
  slug: string
  title: string
  /** Repository-relative, documentation first. */
  files: string[]
}

export interface CatalogDocument {
  /** Inside `context/`, with its extension. */
  path: string
  title: string
  /** Repository-relative. */
  file: string
}

export interface CatalogSkill {
  /** The skill's folder, which its `SKILL.md` names. */
  name: string
  title: string
  description: string
  /** Its `SKILL.md`, repository-relative. */
  file: string
  /** Inside the skill's folder: `SKILL.md` first, then file-tree order. */
  files: string[]
}

export interface CatalogAsset {
  /** Its address under the asset page: inside `assets/`, or inside the copied source. */
  path: string
  kind: SystemAssetKind
  /** Added to the system's `assets/`, or one of the copied app's images. */
  origin: 'local' | 'app'
  /** Inside the system's folder. */
  file: string
}

export interface SystemCatalog {
  id: string
  key: string
  label: string
  status: 'active' | 'archived'
  /** Repository-relative, with forward slashes. */
  folder: string
  colorModes: ('light' | 'dark')[]
  summary: string | null
  guidance: string | null
  code: string | null
  /** The Icons page's sample, or null. */
  icons: SystemIcons | null
  /** The theme's stylesheet, repository-relative, or null. */
  stylesheet: string | null
  libraries: CatalogLibrary[]
  /** Each token once, by page, in declaration order within a page. */
  tokens: ThemeToken[]
  components: CatalogComponent[]
  assets: CatalogAsset[]
  context: CatalogDocument[]
  /** Every folder inside `context/`, in file-tree order, empty ones too. */
  contextFolders: string[]
  skills: CatalogSkill[]
}

export const SKILL_FILE = 'SKILL.md'
const IMAGES = ['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif']
const FONTS = ['.woff', '.woff2', '.ttf', '.otf']

const text = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null

/** A Markdown file's frontmatter, or null when it has none. */
export function frontmatter(source: string): Record<string, unknown> | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)
  if (!match) return null
  try {
    const data = parse(match[1]!)
    return data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

/** A document's title: its frontmatter's, its first heading, or its name. */
export function documentTitle(source: string, file: string) {
  const declared = text(frontmatter(source)?.title)
  if (declared) return declared
  const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '')
  const heading = /^#\s+(.+?)\s*#*\s*$/m.exec(body)?.[1]
  return heading ?? path.posix.basename(file).replace(/\.md$/i, '')
}

/** "build-flow" → "Build flow". */
export function skillTitle(name: string) {
  const words = name.replace(/-+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function installedVersion(dir: string, root: string, name: string) {
  let at = dir
  for (;;) {
    const file = path.join(
      at,
      'node_modules',
      ...name.split('/'),
      'package.json',
    )
    if (existsSync(file))
      try {
        const version = JSON.parse(readFileSync(file, 'utf8')).version
        return typeof version === 'string' ? version : null
      } catch {
        return null
      }
    const up = path.dirname(at)
    if (at === path.resolve(root) || up === at) return null
    at = up
  }
}

/** Every folder under `dir`, in file-tree order, as paths inside it. */
function folders(dir: string, prefix = ''): string[] {
  return directories(dir).flatMap((name) => [
    `${prefix}${name}`,
    ...folders(path.join(dir, name), `${prefix}${name}/`),
  ])
}

const filesIn = (dir: string) => (existsSync(dir) ? treeFiles(dir) : [])

function skillsOf(system: InstalledSystem): CatalogSkill[] {
  const dir = path.join(system.dir, 'skills')
  return directories(dir)
    .filter((name) => existsSync(path.join(dir, name, SKILL_FILE)))
    .map((name) => {
      const source = readFileSync(path.join(dir, name, SKILL_FILE), 'utf8')
      return {
        name,
        title: skillTitle(name),
        description: text(frontmatter(source)?.description) ?? '',
        file: `${system.folder}/skills/${name}/${SKILL_FILE}`,
        files: [
          SKILL_FILE,
          ...treeFiles(path.join(dir, name)).filter(
            (file) => file !== SKILL_FILE,
          ),
        ],
      }
    })
}

function assetKind(file: string, icons: RegExp): SystemAssetKind | null {
  const extension = path.extname(file).toLowerCase()
  if (FONTS.includes(extension)) return 'fonts'
  if (!IMAGES.includes(extension) && extension !== '.ico') return null
  return icons.test(file) ? 'icons' : 'images'
}

/**
 * The system's assets: the files in its `assets/` folder (fonts, icons
 * under `icons/`, other images), then the copied app source's images
 * (`<source>/assets/images/`, icons in its `Icons` folders). Package files
 * aren't assets. The asset pages, the Overview's count and the files the
 * studio serves all read this.
 */
export function systemAssets(system: InstalledSystem): CatalogAsset[] {
  const local = filesIn(path.join(system.dir, 'assets')).flatMap((file) => {
    const kind = assetKind(file, /^icons\//)
    return kind
      ? [{ path: file, kind, origin: 'local' as const, file: `assets/${file}` }]
      : []
  })
  const source = system.spec.app.source
  const images = source ? path.join(system.dir, source, 'assets/images') : null
  const app = images
    ? filesIn(images).flatMap((file) => {
        const kind = assetKind(file, /(^|\/)icons\//i)
        return kind && kind !== 'fonts'
          ? [
              {
                path: `assets/images/${file}`,
                kind,
                origin: 'app' as const,
                file: posix(path.join(source!, 'assets/images', file)),
              },
            ]
          : []
      })
    : []
  return [...local, ...app]
}

export function systemCatalog(
  system: InstalledSystem,
  root: string,
): SystemCatalog {
  const { spec, dir, folder } = system
  const stylesheet = spec.app.stylesheet
    ? path.join(dir, spec.app.stylesheet)
    : null
  const tokens =
    stylesheet && existsSync(stylesheet)
      ? stylesheetTokens(stylesheet, {
          themeClass: spec.themeClass,
          nuxtUiColors: spec.app.nuxtUi?.colors,
        })
      : []
  const componentsDir = path.join(dir, 'components')
  const contextDir = path.join(dir, 'context')
  return {
    id: system.id,
    key: system.key,
    label: spec.label,
    status: spec.status,
    folder,
    colorModes: spec.colorModes,
    summary: text(spec.overview?.summary),
    guidance: text(spec.overview?.guidance),
    code: text(spec.overview?.code),
    icons: spec.icons ?? null,
    stylesheet:
      stylesheet && existsSync(stylesheet)
        ? posix(path.relative(root, stylesheet))
        : null,
    libraries: spec.libraries.map(({ components, assets, ...library }) => ({
      ...library,
      version: installedVersion(dir, root, library.package),
      components: components ?? [],
      assets: assets ?? [],
    })),
    tokens: TOKEN_GROUPS.flatMap((group) =>
      tokens.filter((token) => token.group === group),
    ),
    components: directories(componentsDir).flatMap((slug) => {
      const files = treeFiles(path.join(componentsDir, slug))
      const doc = files.find((file) => file.toLowerCase().endsWith('.md'))
      if (!doc) return []
      const source = readFileSync(path.join(componentsDir, slug, doc), 'utf8')
      return [
        {
          slug,
          title: text(frontmatter(source)?.title) ?? skillTitle(slug),
          files: [doc, ...files.filter((file) => file !== doc)].map(
            (file) => `${folder}/components/${slug}/${file}`,
          ),
        },
      ]
    }),
    assets: systemAssets(system),
    context: filesIn(contextDir)
      .filter((file) => file.toLowerCase().endsWith('.md'))
      .map((file) => ({
        path: file,
        title: documentTitle(
          readFileSync(path.join(contextDir, file), 'utf8'),
          file,
        ),
        file: `${folder}/context/${file}`,
      })),
    contextFolders: existsSync(contextDir) ? folders(contextDir) : [],
    skills: skillsOf(system),
  }
}

/**
 * The text of the system's Context and Skills, by repository path: their
 * Markdown, and the skills' other text files (a script), never binary ones.
 */
export function systemDocuments(system: InstalledSystem, root: string) {
  const documents: Record<string, string> = {}
  for (const section of ['context', 'skills']) {
    const dir = path.join(system.dir, section)
    for (const file of filesIn(dir)) {
      const markdown = file.toLowerCase().endsWith('.md')
      if (!markdown && (section === 'context' || isBinaryFile(file))) continue
      const content = readFileSync(path.join(dir, file))
      if (!markdown && !isTextContent(content)) continue
      documents[posix(path.relative(root, path.join(dir, file)))] =
        content.toString('utf8')
    }
  }
  return documents
}

const NAME = /^[\p{Ll}\p{Nd}]+(-[\p{Ll}\p{Nd}]+)*$/u
export const SKILL_NAME_MAX = 64
export const SKILL_DESCRIPTION_MAX = 1024

/** Why a skill's name (its folder's name) is invalid, or null. */
export function skillNameProblem(name: unknown): string | null {
  if (typeof name !== 'string' || !name) return 'is missing.'
  if (name.length > SKILL_NAME_MAX)
    return `is too long: names are at most ${SKILL_NAME_MAX} characters.`
  if (!NAME.test(name))
    return 'can use only lowercase letters, numbers and single hyphens, and can’t start or end with a hyphen.'
  return null
}

/** Why a skill's description is invalid, or null. */
export function skillDescriptionProblem(description: unknown): string | null {
  if (typeof description !== 'string' || !description.trim())
    return 'is missing: say what the skill does and when to use it.'
  if (description.length > SKILL_DESCRIPTION_MAX)
    return `is too long: descriptions are at most ${SKILL_DESCRIPTION_MAX} characters.`
  return null
}

/**
 * What is wrong with the system's Context and Skills, each a sentence naming
 * the file: Context holds Markdown documents, and each skill is a folder
 * with a `SKILL.md` in the Agent Skills format whose name matches it.
 */
export function systemContentProblems(system: InstalledSystem, root: string) {
  const problems: string[] = []
  const where = (file: string) =>
    posix(path.relative(root, path.join(system.dir, file)))
  for (const file of filesIn(path.join(system.dir, 'context')))
    if (!file.toLowerCase().endsWith('.md'))
      problems.push(
        `${where(`context/${file}`)} isn’t a Markdown file. context/ holds Markdown documents only.`,
      )
  const skills = path.join(system.dir, 'skills')
  const entries = existsSync(skills)
    ? readdirSync(skills)
        .filter((name) => !name.startsWith('.'))
        .sort((a, b) =>
          a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }),
        )
    : []
  for (const name of entries) {
    if (!statSync(path.join(skills, name)).isDirectory()) {
      problems.push(
        `${where(`skills/${name}`)} is loose in skills/. A skill is a folder with a ${SKILL_FILE} in it.`,
      )
      continue
    }
    const file = path.join(skills, name, SKILL_FILE)
    const at = where(`skills/${name}/${SKILL_FILE}`)
    if (!existsSync(file)) {
      problems.push(
        `${where(`skills/${name}`)}/ has no ${SKILL_FILE}, so no agent will find the skill. Add one, or move the folder out of skills/.`,
      )
      continue
    }
    const data = frontmatter(readFileSync(file, 'utf8'))
    if (!data) {
      problems.push(
        `${at} has to start with frontmatter (a block between --- lines) holding the skill’s name and description.`,
      )
      continue
    }
    const folderProblem = skillNameProblem(name)
    if (folderProblem)
      problems.push(
        `The skill folder "${name}" in ${where('skills')} ${folderProblem}`,
      )
    const declared = data.name === undefined ? undefined : String(data.name)
    const nameProblem = skillNameProblem(declared)
    if (nameProblem) problems.push(`The "name" in ${at} ${nameProblem}`)
    else if (declared !== name)
      problems.push(
        `The "name" in ${at} is "${declared}", but the folder is "${name}". They have to match.`,
      )
    const descriptionProblem = skillDescriptionProblem(data.description)
    if (descriptionProblem)
      problems.push(`The "description" in ${at} ${descriptionProblem}`)
  }
  return problems
}
