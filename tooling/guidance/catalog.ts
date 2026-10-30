// The guidance the Context & Skills browser shows: the Platform's (its
// README, `context/` and `skills/`) and each enabled module's (the same, plus
// its other top-level Markdown files, such as contracts). Systems' guidance
// lives in the Systems area. Node built-ins only.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  guidanceAt,
  linkedFile,
  type GuidanceDocument,
  type GuidanceOwner,
} from './addresses.ts'
import { markdownTitle } from './frontmatter.ts'

export * from './addresses.ts'

export interface GuidanceSources {
  /** The Platform's folder, repository-relative. */
  platform: string
  modules: { id: string; label: string; folder: string }[]
}

const visible = (name: string) =>
  !name.startsWith('.') && name !== 'node_modules'

/** Files under `dir`, relative to it, sorted, without hidden ones. */
function filesIn(dir: string, prefix = ''): string[] {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => visible(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))
  return entries.flatMap((entry) =>
    entry.isDirectory()
      ? filesIn(path.join(dir, entry.name), `${prefix}${entry.name}/`)
      : entry.isFile()
        ? [`${prefix}${entry.name}`]
        : [],
  )
}

/** `write-manual` → `Write manual`. */
const humanize = (name: string) => {
  const words = name.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function ownerDocuments(root: string, folder: string, module: boolean) {
  const dir = path.join(root, folder)
  const read = (file: string) => readFileSync(path.join(root, file), 'utf8')
  const documents: GuidanceDocument[] = []
  if (existsSync(path.join(dir, 'README.md')))
    documents.push({
      kind: 'readme',
      address: '',
      title: 'README',
      file: `${folder}/README.md`,
      related: [],
    })
  for (const relative of filesIn(path.join(dir, 'context')).filter((file) =>
    file.endsWith('.md'),
  )) {
    const file = `${folder}/context/${relative}`
    documents.push({
      kind: 'context',
      address: `context/${relative.slice(0, -3)}`,
      title:
        markdownTitle(read(file)) ?? humanize(path.basename(relative, '.md')),
      file,
      related: [],
    })
  }
  const skills = path.join(dir, 'skills')
  if (existsSync(skills))
    for (const entry of readdirSync(skills, { withFileTypes: true })
      .filter((item) => item.isDirectory() && visible(item.name))
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const file = `${folder}/skills/${entry.name}/SKILL.md`
      if (!existsSync(path.join(root, file))) continue
      const others = filesIn(path.join(skills, entry.name)).filter(
        (name) => name !== 'SKILL.md',
      )
      documents.push({
        kind: 'skill',
        address: `skills/${entry.name}`,
        title: humanize(entry.name),
        file,
        related: [],
        files: ['SKILL.md', ...others],
      })
    }
  if (module && existsSync(dir))
    for (const entry of readdirSync(dir, { withFileTypes: true })
      .filter(
        (item) =>
          item.isFile() &&
          item.name.endsWith('.md') &&
          item.name !== 'README.md',
      )
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const file = `${folder}/${entry.name}`
      documents.push({
        kind: 'reference',
        address: `reference/${entry.name.slice(0, -3)}`,
        title: markdownTitle(read(file)) ?? humanize(entry.name.slice(0, -3)),
        file,
        related: [],
      })
    }
  return documents
}

const LINK = /\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g

/** The Platform and the modules, each with its guidance. */
export function guidanceCatalog(root: string, sources: GuidanceSources) {
  const owners: GuidanceOwner[] = [
    {
      id: 'platform',
      kind: 'platform',
      label: 'Platform',
      folder: sources.platform,
      documents: ownerDocuments(root, sources.platform, false),
    },
    ...[...sources.modules]
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((module): GuidanceOwner => ({
        id: module.id,
        kind: 'module',
        label: module.label,
        folder: module.folder,
        documents: ownerDocuments(root, module.folder, true),
      })),
  ]
  // Each document's links, for the linked documents' "About this context".
  for (const owner of owners)
    for (const document of owner.documents) {
      const text = readFileSync(path.join(root, document.file), 'utf8')
      for (const [, href] of text.matchAll(LINK)) {
        const linked = linkedFile(document.file, href!)
        const target = linked && guidanceAt(owners, linked.file)
        if (!target || target.document === document) continue
        if (
          target.document.related.some(
            (link) =>
              link.owner === owner.id && link.address === document.address,
          )
        )
          continue
        target.document.related.push({
          title: document.title,
          owner: owner.id,
          address: document.address,
        })
      }
    }
  return { owners }
}

/** Every listed document's text, by file, for the reader. */
export function guidanceDocuments(
  root: string,
  catalog: { owners: GuidanceOwner[] },
) {
  const texts: Record<string, string> = {}
  for (const owner of catalog.owners)
    for (const document of owner.documents)
      texts[document.file] = readFileSync(
        path.join(root, document.file),
        'utf8',
      )
  return texts
}
