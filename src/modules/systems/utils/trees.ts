// What a system's Context and Skills trees show: the nodes (the dev
// server's live files locally, the catalog's on the deployed site), the
// rows that open a page, and what can be made in each folder. Plain
// functions over the catalog, so the navigation and its tests agree.
import type { FileNode, FileTreeEntry } from '../../../../app/utils/fileTree'
import { byOrder } from '../../../../tooling/manifest/order'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import {
  SKILL_FILE,
  type ContentSection,
} from '../../../../tooling/systems/content-rules'
import { isBinaryFile } from '../../../../tooling/systems/text-files'
import { contextAddress, skillAddress } from './pages'

/** Files and folders as a tree, each folder's files first, by name. */
function build(paths: { path: string; dir: boolean }[]): FileNode[] {
  const top: FileNode[] = []
  const folders = new Map<string, FileNode>()
  const place = (path: string, dir: boolean): FileNode => {
    const known = folders.get(path)
    if (known) return known
    const parts = path.split('/')
    const parent = parts.length > 1 ? parts.slice(0, -1).join('/') : ''
    const node: FileNode = {
      name: parts.at(-1)!,
      path,
      dir,
      ...(dir ? { children: [] } : {}),
    }
    if (dir) folders.set(path, node)
    ;(parent ? place(parent, true).children! : top).push(node)
    return node
  }
  for (const { path, dir } of paths) place(path, dir)
  const sort = (nodes: FileNode[]): FileNode[] =>
    byOrder(nodes).map((node) =>
      node.dir ? { ...node, children: sort(node.children ?? []) } : node,
    )
  return sort(top)
}

/**
 * A section as the catalog knows it: Context's documents and folders, and
 * each skill as its folder with its files. What the deployed site shows,
 * and the tree until the dev server answers.
 */
export function catalogNodes(
  system: SystemCatalog,
  section: ContentSection,
): FileNode[] {
  if (section === 'context')
    return build([
      ...system.contextFolders.map((path) => ({ path, dir: true })),
      ...system.context.map(({ path }) => ({ path, dir: false })),
    ])
  return withoutSkillFiles(
    build(
      system.skills.flatMap((skill) => [
        { path: skill.name, dir: true },
        ...skill.files.map((file) => ({
          path: `${skill.name}/${file}`,
          dir: false,
        })),
      ]),
    ),
  )
}

/** A skill's row stands for its SKILL.md, which isn't listed again. */
export function withoutSkillFiles(nodes: FileNode[]): FileNode[] {
  return nodes.map((node) =>
    node.dir
      ? {
          ...node,
          children: (node.children ?? []).filter(
            (child) => child.path !== `${node.path}/${SKILL_FILE}`,
          ),
        }
      : node,
  )
}

/**
 * The rows that open a page, by path inside the section: Context's
 * documents; each skill (its SKILL.md's page) and a skill's other documents
 * and text files. Binary files have no page.
 */
export function treeEntries(
  system: SystemCatalog,
  section: ContentSection,
): Map<string, FileTreeEntry> {
  const entries = new Map<string, FileTreeEntry>()
  const add = (path: string, title: string, to: string, icon: string) =>
    entries.set(path, { id: to, title, to, icon })
  if (section === 'context') {
    for (const document of system.context)
      add(
        document.path,
        document.title,
        contextAddress(system, document.path),
        'i-lucide-file-text',
      )
    return entries
  }
  for (const skill of system.skills) {
    add(
      skill.name,
      skill.title,
      skillAddress(system, `${skill.name}/${SKILL_FILE}`),
      'i-lucide-wand-sparkles',
    )
    for (const file of skill.files) {
      if (file === SKILL_FILE || isBinaryFile(file)) continue
      const path = `${skill.name}/${file}`
      add(
        path,
        file.split('/').at(-1)!,
        skillAddress(system, path),
        /\.md$/i.test(file) ? 'i-lucide-file-text' : 'i-lucide-file-code',
      )
    }
  }
  return entries
}

/**
 * The page a path in the section has, or had: a folder's address is the
 * start of its pages' addresses.
 */
export const sectionAddress = (
  system: SystemCatalog,
  section: ContentSection,
  path: string,
) =>
  section === 'context'
    ? contextAddress(system, path)
    : skillAddress(system, path)

/**
 * Where the open page goes after a rename or move of `from` to `to`, or
 * null when it isn't affected. Addresses follow the files' paths.
 */
export function followed(
  current: string,
  system: SystemCatalog,
  section: ContentSection,
  change: { from: string; to: string; dir: boolean },
): string | null {
  const before = sectionAddress(system, section, change.from)
  const after = sectionAddress(system, section, change.to)
  if (!change.dir) return current === before ? after : null
  // A skill's folder stands for its SKILL.md's page too.
  return current.startsWith(`${before}/`)
    ? after + current.slice(before.length)
    : null
}
