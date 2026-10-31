// The file tree's rules for what it shows. Paths are inside the prototype,
// with forward slashes.
import type { FileNode } from '../../tooling/files/tree'

export type { FileNode }

/**
 * What the tree shows by default: artifacts, the folders that hold them, and
 * empty folders (made to organize, so they stay). Helpers (`_` names),
 * `meta.json`, images and other files wait for "Show all files".
 */
export function visibleNodes(
  nodes: FileNode[],
  artifacts: Set<string>,
): FileNode[] {
  return nodes.flatMap((node) => {
    if (!node.dir) return artifacts.has(node.path) ? [node] : []
    if (node.name.startsWith('_')) return []
    const children = visibleNodes(node.children ?? [], artifacts)
    return children.length || !node.children?.length
      ? [{ ...node, children }]
      : []
  })
}

/**
 * The tree of a list of file paths, in their order, with their folders: the
 * deployed site's tree, from the published artifacts.
 */
export function nodesFromPaths(paths: string[]): FileNode[] {
  const top: FileNode[] = []
  for (const path of paths) {
    const parts = path.split('/')
    let level = top
    parts.slice(0, -1).forEach((name, index) => {
      const at = parts.slice(0, index + 1).join('/')
      let folder = level.find((node) => node.dir && node.path === at)
      if (!folder) {
        folder = { name, path: at, dir: true, children: [] }
        level.push(folder)
      }
      level = folder.children!
    })
    level.push({ name: parts.at(-1)!, path, dir: false })
  }
  return top
}

/**
 * The nodes matching a filter by name, readable title or path, with the
 * folders that hold them; a matching folder keeps everything in it.
 */
export function filterNodes(
  nodes: FileNode[],
  query: string,
  label: (node: FileNode) => string,
): FileNode[] {
  const wanted = query.trim().toLowerCase()
  if (!wanted) return nodes
  const matches = (node: FileNode) =>
    [node.name, node.path, label(node)].some((text) =>
      text.toLowerCase().includes(wanted),
    )
  return nodes.flatMap((node) => {
    if (matches(node)) return [node]
    if (!node.dir) return []
    const children = filterNodes(node.children ?? [], wanted, label)
    return children.length ? [{ ...node, children }] : []
  })
}

/** Every folder's path, at any depth. */
export const folderPaths = (nodes: FileNode[]): string[] =>
  nodes.flatMap((node) =>
    node.dir ? [node.path, ...folderPaths(node.children ?? [])] : [],
  )

/** The node at a path, at any depth. */
export function findNode(
  nodes: FileNode[],
  path: string,
): FileNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node
    if (node.dir && path.startsWith(`${node.path}/`))
      return findNode(node.children ?? [], path)
  }
  return undefined
}

/** The folders a path is in, outermost first. */
export const parentsOf = (path: string) =>
  path
    .split('/')
    .slice(0, -1)
    .map((_, index, parts) => parts.slice(0, index + 1).join('/'))

/** Whether `path` is `folder` or inside it. */
export const within = (path: string, folder: string) =>
  path === folder || path.startsWith(`${folder}/`)

/**
 * The files inside a folder that the tree isn't showing, relative to the
 * folder: what its delete would also take.
 */
export function hiddenInside(folder: FileNode, artifacts: Set<string>) {
  const files = (node: FileNode): string[] =>
    node.dir ? (node.children ?? []).flatMap(files) : [node.path]
  return files(folder)
    .filter((path) => !artifacts.has(path))
    .map((path) => path.slice(folder.path.length + 1))
}

/**
 * Whether a refusal names (in “quotes”) a file or folder that exists but
 * the tree is hiding, so the message can say how to see it.
 */
export function clashHint(message: string, all: FileNode[], shown: FileNode[]) {
  const name = /“(.+?)”/.exec(message)?.[1]
  if (!name) return false
  const named = (nodes: FileNode[]): boolean =>
    nodes.some((node) => node.name === name || named(node.children ?? []))
  return named(all) && !named(shown)
}

/** An artifact's row in the tree: it opens in the studio. */
export interface FileTreeEntry {
  id: string
  title: string
  to: string
  /** An Iconify name. */
  icon: string
  /** Rows listed under it, such as a view's named states. */
  children?: { id: string; title: string; to: string }[]
}

/** What "+" (New) can make in a place: a file type, or `folder`. */
export interface NewFileOption {
  type: string
  label: string
  icon: string
  /** Made through a dialog of its own instead of an inline name field. */
  onSelect?: () => void
}
