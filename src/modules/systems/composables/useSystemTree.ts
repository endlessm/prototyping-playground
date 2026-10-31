import type { FileNode } from '../../../../app/utils/fileTree'
import { requestJson } from '../../../../app/utils/studioRequest'
import type { ContentSection } from '../../../../tooling/systems/content-rules'

/** A system's Context and Skills, from the dev server's file service. */
export interface SystemTreeListing {
  /** The system's folder, repository-relative. */
  folder: string
  context: FileNode[]
  skills: FileNode[]
  /** Whether you may change them; `reason` says why not. */
  editable: boolean
  reason?: string
}

/** A change to a system's Context or Skills, as the file service takes it. */
export type SystemTreeOperation =
  | {
      op: 'create'
      section: ContentSection
      parent: string
      name: string
      kind: 'document' | 'file' | 'folder'
    }
  | { op: 'skill'; name: string; description: string }
  | { op: 'rename'; section: ContentSection; path: string; name: string }
  | { op: 'move'; section: ContentSection; path: string; to: string }
  | { op: 'delete'; section: ContentSection; path: string }

/**
 * A system's real Context and Skills files and folders, in development,
 * kept current as they are added, renamed or removed on disk. On the
 * deployed site, and until the dev server answers, the listing is null.
 */
export function useSystemTree(systemId: () => string) {
  // Only the dev server has the route; the static build never names it.
  const url = import.meta.dev
    ? `${useRuntimeConfig().app.baseURL}_studio/files/system-tree`
    : ''
  const listing = shallowRef<SystemTreeListing | null>(null)
  let latest = 0

  /**
   * Loads the listing again. Whether you may change the files is asked only
   * with `access` (or the first time): finding out who you are holds up
   * the dev server, and files coming and going don't change it.
   */
  async function reload(access = false) {
    if (!import.meta.dev) return
    const previous = listing.value
    const withAccess = access || !previous
    const request = ++latest
    try {
      const next = await requestJson<SystemTreeListing>(
        `${url}?system=${encodeURIComponent(systemId())}${withAccess ? '' : '&access=0'}`,
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
  function change<T = Record<string, unknown>>(operation: SystemTreeOperation) {
    return requestJson<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: systemId(), ...operation }),
    })
  }

  if (import.meta.dev) {
    const mine = (paths: string[]) => {
      const folder = listing.value?.folder
      return !folder || paths.some((file) => file.startsWith(`${folder}/`))
    }
    const changed = ({ paths }: { paths: string[] }) => {
      if (mine(paths)) void reload()
    }
    const again = () => void reload(true)
    onMounted(() => {
      import.meta.hot?.on('studio:files', changed)
      // Events sent while the socket was down are not replayed.
      import.meta.hot?.on('vite:ws:connect', again)
      // A change of identity can change what you may do.
      import.meta.hot?.on('studio:identity', again)
    })
    onScopeDispose(() => {
      import.meta.hot?.off('studio:files', changed)
      import.meta.hot?.off('vite:ws:connect', again)
      import.meta.hot?.off('studio:identity', again)
    })
    watch(
      systemId,
      () => {
        listing.value = null
        void reload(true)
      },
      { immediate: true },
    )
  }

  return { listing, reload, change }
}
