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
import {
  componentProblems,
  discoverComponents,
  docsWarning,
  duplicateProblems,
  exampleNames,
  exampleTitle,
  kebab,
  type DocsProblem,
} from './components.ts'
import {
  SKILL_FILE,
  skillDescriptionProblem,
  skillNameProblem,
} from './content-rules.ts'
import type { SystemAssetKind, SystemIcons, SystemLibrary } from './contract.ts'
import { exampleId, overviewId } from './preview-ids.ts'
import type { ComponentPropsDoc } from './props.ts'
import type { InstalledSystem } from './registry.ts'
import { isBinaryFile, isTextContent } from './text-files.ts'
import { stylesheetTokens, type ThemeToken, type TokenGroup } from './tokens.ts'

export type { ColorSection, ThemeToken, TokenGroup } from './tokens.ts'
export {
  SKILL_DESCRIPTION_MAX,
  SKILL_FILE,
  SKILL_NAME_MAX,
  skillDescriptionProblem,
  skillNameProblem,
} from './content-rules.ts'

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

export interface CatalogExample {
  /** As its `<Example name>` spells it. */
  name: string
  /** In sentence case. */
  title: string
  /** What the system's preview document shows it as. */
  id: string
}

export interface CatalogComponent {
  /** Its page's address under the system's Components. */
  slug: string
  /** As its files spell it. */
  name: string
  title: string
  description: string | null
  /** The page's `source`: where the component comes from, in a sentence. */
  sourceNote: string | null
  /** The page's `docs`: its documentation elsewhere. */
  docsUrl: string | null
  /** Repository-relative: the page, the examples, the component, then the rest. */
  files: string[]
  /** Its page, examples and component files, repository-relative, or null. */
  doc: string | null
  examplesFile: string | null
  source: string | null
  /** In the examples file's order. */
  examples: CatalogExample[]
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
  /**
   * The preview document's ID for the system's own Overview content
   * (`overview.vue` in its folder), or null when it has none.
   */
  overview: string | null
  assets: CatalogAsset[]
  context: CatalogDocument[]
  /** Every folder inside `context/`, in file-tree order, empty ones too. */
  contextFolders: string[]
  skills: CatalogSkill[]
  /** Files a rename left naming the old folder, for review. */
  renameReview: string[]
  /** An agent saved a setup record: the Overview offers no setup. */
  setupRecorded: boolean
}

/** A system's own content for its Overview, in its own look. */
export const OVERVIEW_FILE = 'overview.vue'
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
  const componentsAt = `${folder}/components`
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
    renameReview: spec.renameReview ?? [],
    setupRecorded: Boolean(spec.setup),
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
    components: discoverComponents(filesIn(componentsDir)).map((component) => {
      const { doc, examples, source } = component.files
      const read = (file: string | null) =>
        file ? readFileSync(path.join(componentsDir, file), 'utf8') : null
      const data = frontmatter(read(doc) ?? '') ?? {}
      const at = (file: string | null) =>
        file ? `${componentsAt}/${file}` : null
      const own = [doc, examples, source].filter(
        (file): file is string => file !== null,
      )
      const folderOf = (file: string) =>
        file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : null
      const home = folderOf(own[0]!)
      const rest = home
        ? filesIn(componentsDir).filter(
            (file) => file.startsWith(home) && !own.includes(file),
          )
        : []
      return {
        slug: component.slug,
        name: component.name,
        title: text(data.title) ?? skillTitle(kebab(component.name)),
        description: text(data.description),
        sourceNote: text(data.source),
        docsUrl: text(data.docs),
        files: [...own, ...rest].map((file) => at(file)!),
        doc: at(doc),
        examplesFile: at(examples),
        source: at(source),
        examples: exampleNames(read(examples) ?? '').map((name) => ({
          name,
          title: exampleTitle(name),
          id: exampleId(system.id, component.slug, name),
        })),
      }
    }),
    overview: existsSync(path.join(dir, OVERVIEW_FILE))
      ? overviewId(system.id)
      : null,
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

/**
 * What a system's preview document shows besides views: each example of
 * its component pages and its own Overview content, by preview ID, with the
 * absolute path of the file it comes from.
 */
export function systemPreviews(system: InstalledSystem) {
  const componentsDir = path.join(system.dir, 'components')
  const entries: { id: string; file: string; example?: string }[] = []
  for (const component of discoverComponents(filesIn(componentsDir))) {
    const { examples } = component.files
    if (!examples) continue
    const file = path.join(componentsDir, examples)
    for (const name of exampleNames(readFileSync(file, 'utf8')))
      entries.push({
        id: exampleId(system.id, component.slug, name),
        file,
        example: name,
      })
  }
  const overview = path.join(system.dir, OVERVIEW_FILE)
  if (existsSync(overview))
    entries.push({ id: overviewId(system.id), file: overview })
  return entries
}

/**
 * A system's component documentation gaps, as its `docs` setting reports
 * them: one warning listing the first five (`warn`), the same warning that
 * stops a build (`strict`), or nothing (`off`).
 */
export function systemDocsReport(system: InstalledSystem, root: string) {
  const { docs, label } = system.spec
  if (docs === 'off') return { warning: null, fails: false }
  const componentsDir = path.join(system.dir, 'components')
  const at = (file: string) =>
    posix(path.relative(root, path.join(componentsDir, file)))
  const read = (file: string | null) =>
    file ? readFileSync(path.join(componentsDir, file), 'utf8') : null
  const found = discoverComponents(filesIn(componentsDir))
  const problems: DocsProblem[] = []
  for (const component of found) {
    const { source, doc, examples } = component.files
    const file = at((source ?? doc ?? examples)!)
    for (const message of componentProblems(component, {
      doc: read(doc),
      examples: read(examples),
    }))
      problems.push({ file, message })
  }
  for (const { component, problem } of duplicateProblems(found)) {
    const { source, doc, examples } = component.files
    problems.push({ file: at((source ?? doc ?? examples)!), message: problem })
  }
  const warning = docsWarning(label, problems)
  return { warning, fails: docs === 'strict' && warning !== null }
}

export interface ComponentPageData {
  /** The page's Markdown, or null when it has none. */
  page: string | null
  /** The examples file's text, for "Show code". */
  examples: string | null
  /** Read from the component's code; null without a component file. */
  props: ComponentPropsDoc | null
  /** Files that couldn't be read, each with why. */
  errors: string[]
}

/**
 * What each component page shows besides the catalog, by `<system ID>/<slug>`:
 * its page and examples text and its props. Props are read with Vue's
 * component metadata tooling, loaded only here.
 */
export async function componentPages(systems: InstalledSystem[]) {
  const pages: Record<string, ComponentPageData> = {}
  const sources = new Map<string, ComponentPageData>()
  for (const system of systems) {
    const componentsDir = path.join(system.dir, 'components')
    for (const component of discoverComponents(filesIn(componentsDir))) {
      const errors: string[] = []
      const read = (file: string | null) => {
        if (!file) return null
        try {
          return readFileSync(path.join(componentsDir, file), 'utf8')
        } catch (error) {
          errors.push(`${file}: ${(error as Error).message}`)
          return null
        }
      }
      const { doc, examples, source } = component.files
      const data: ComponentPageData = {
        page: read(doc),
        examples: read(examples),
        props: null,
        errors,
      }
      pages[`${system.id}/${component.slug}`] = data
      if (source) sources.set(path.join(componentsDir, source), data)
    }
  }
  if (sources.size) {
    const { componentProps } = await import('./props.ts')
    const found = await componentProps([...sources.keys()])
    for (const [file, data] of sources) {
      const result = found[file]
      if (!result) continue
      if ('error' in result) data.errors.push(result.error)
      else data.props = result
    }
  }
  return pages
}
