// How a prototype's files are arranged in its tree. At each level files come
// first, then folders, each alphabetical, unless the prototype's meta.json
// has an `order`: a list of paths inside the prototype (files and folders).
// Listed paths come first among their folder's entries, in the listed
// sequence; anything not listed follows in the usual order, so a new file
// lands after the ones you arranged. Order never renames or moves anything.
// Imports nothing, so the command line, the dev server and the app share it.

/** The folder a path inside the prototype is in; '' at the top level. */
export const parentOf = (path: string) =>
  path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''

/** meta.json's `order` when it is a list of paths, else null. */
export const parseOrder = (value: unknown): string[] | null =>
  Array.isArray(value) &&
  value.every((path) => typeof path === 'string' && path.length > 0)
    ? (value as string[])
    : null

/** Names in the order people expect: numbers by value, case ignored. */
export const compare = (a: string, b: string) =>
  a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }) ||
  (a < b ? -1 : a > b ? 1 : 0)

/** One folder's entries in the tree's order. */
export function byOrder<T extends { path: string; name: string; dir: boolean }>(
  entries: T[],
  order: readonly string[] = [],
): T[] {
  const rank = new Map(order.map((path, index) => [path, index]))
  return [...entries].sort((a, b) => {
    const ra = rank.get(a.path)
    const rb = rank.get(b.path)
    if (ra !== undefined && rb !== undefined) return ra - rb
    if (ra !== undefined) return -1
    if (rb !== undefined) return 1
    return Number(a.dir) - Number(b.dir) || compare(a.name, b.name)
  })
}

/** The order after one folder's entries are set to `paths`, in sequence. */
export const withFolderOrder = (
  order: readonly string[],
  folder: string,
  paths: readonly string[],
) => [...order.filter((path) => parentOf(path) !== folder), ...paths]

/**
 * A folder's entries (`siblings`, in order) with `moving` put before
 * `before`, or last when `before` is empty.
 */
export function place(
  siblings: readonly string[],
  moving: string,
  before: string,
) {
  const rest = siblings.filter((path) => path !== moving)
  const at = before ? rest.indexOf(before) : -1
  if (at < 0) return [...rest, moving]
  return [...rest.slice(0, at), moving, ...rest.slice(at)]
}

/**
 * The order after `from` is renamed to `to` (a folder takes what is inside
 * along), or dropped when `to` is null: deleted, or moved to another folder,
 * where it lands after the arranged entries.
 */
export function afterChange(
  order: readonly string[],
  from: string,
  to: string | null,
) {
  return order.flatMap((path) => {
    if (path === from) return to ? [to] : []
    if (path.startsWith(`${from}/`))
      return to ? [`${to}${path.slice(from.length)}`] : []
    return [path]
  })
}
