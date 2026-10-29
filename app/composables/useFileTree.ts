import { useStorage } from '@vueuse/core'
import type { FileNode } from '../utils/fileTree'
import { requestJson } from '../utils/studioRequest'

/** A prototype's listing from the dev server's file service. */
export interface FileListing {
  /** Repository-relative, with forward slashes. */
  folder: string
  nodes: FileNode[]
  /** Whether you may change its files; `reason` says why not. */
  editable: boolean
  reason?: string
}

/** A change to a prototype's files, as the file service takes it. */
export type FileOperation =
  | { op: 'create'; parent: string; name: string; type: string }
  | { op: 'rename'; path: string; name: string }
  | { op: 'delete'; path: string }
  | { op: 'lofi'; artifact: string; lofi: boolean }
  | { op: 'reveal'; path: string }
  | { op: 'open'; path: string }

/** Folders closed in each file tree, by tree, while the app stays open. */
export const treeFolds = new Map<string, Set<string>>()

/**
 * "Show all files": helpers, `meta.json` and other files join the tree.
 * Remembered in this browser, for every prototype.
 */
export const useShowAllFiles = () =>
  useStorage('design-studio:show-all-files', false)

/**
 * A prototype's real files and folders, in development, kept current as
 * they are added, renamed or removed on disk. On the deployed site, and
 * until the dev server answers, the listing is null.
 */
export function useFileTree(prototypeId: () => string | undefined) {
  // Only the dev server has the route; the static build never names it.
  const url = import.meta.dev
    ? `${useRuntimeConfig().app.baseURL}_studio/files/tree`
    : ''
  const listing = shallowRef<FileListing | null>(null)
  let latest = 0

  /**
   * Loads the listing again. Whether you may change the files is asked only
   * with `access` (or the first time): finding out who you are holds up
   * the dev server, and files coming and going don't change it.
   */
  async function reload(access = false) {
    const id = prototypeId()
    if (!import.meta.dev || !id) return
    const previous = listing.value
    const withAccess = access || !previous
    const request = ++latest
    try {
      const next = await requestJson<FileListing>(
        `${url}?prototype=${encodeURIComponent(id)}${withAccess ? '' : '&access=0'}`,
      )
      if (request !== latest) return
      listing.value = withAccess
        ? next
        : { ...next, editable: previous!.editable, reason: previous!.reason }
    } catch {
      // Gone, or the dev server is restarting: the next change loads again.
      if (request === latest) listing.value = null
    }
  }

  /** Runs a change through the file service; throws its message. */
  function change<T = Record<string, unknown>>(operation: FileOperation) {
    return requestJson<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prototype: prototypeId(), ...operation }),
    })
  }

  if (import.meta.dev) {
    // A prototype's meta.json can say it is archived.
    const meta = (files: string[]) =>
      files.some((file) => file.endsWith('/meta.json'))
    const changed = ({ paths }: { paths: string[] }) => void reload(meta(paths))
    const edited = ({ files }: { files: string[] }) => {
      if (meta(files)) void reload(true)
    }
    const again = () => void reload(true)
    onMounted(() => {
      import.meta.hot?.on('studio:files', changed)
      import.meta.hot?.on('studio:source', edited)
      // Events sent while the socket was down are not replayed.
      import.meta.hot?.on('vite:ws:connect', again)
    })
    onScopeDispose(() => {
      import.meta.hot?.off('studio:files', changed)
      import.meta.hot?.off('studio:source', edited)
      import.meta.hot?.off('vite:ws:connect', again)
    })
    watch(
      prototypeId,
      () => {
        listing.value = null
        void reload(true)
      },
      { immediate: true },
    )
    // A change of identity or configuration can change what you may do.
    onMounted(() => import.meta.hot?.on('studio:identity', again))
    onScopeDispose(() => import.meta.hot?.off('studio:identity', again))
  }

  return { listing, reload, change }
}
