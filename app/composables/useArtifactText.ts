import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../tooling/manifest/build'
import { requestJson } from '../utils/studioRequest'
import { manifestFile } from './useManifest'

/**
 * An artifact's text for a page that reads it, such as a document. Locally
 * it comes from the dev server's file service and follows saves on disk:
 * `updating` is true from the change notice until the new text is in. On the
 * deployed site it is the file the build shipped beside the manifest.
 */
export function useArtifactText(
  prototype: () => ManifestPrototype,
  artifact: () => ManifestArtifact,
) {
  const text = ref<string>()
  const error = ref<Error>()
  const updating = ref(false)
  // Where the file service says the file is, as change notices name it.
  let path: string | undefined
  let reads = 0

  async function fetchText(): Promise<string> {
    if (import.meta.dev) {
      const url = `${useRuntimeConfig().app.baseURL}_studio/files/source`
      const reply = await requestJson<{ path: string; content: string }>(
        `${url}?${new URLSearchParams({
          prototype: prototype().id,
          artifact: artifact().id,
        })}`,
      )
      path = reply.path
      return reply.content
    }
    const shipped = artifact().text
    if (!shipped) throw new Error('This file is not on this site.')
    const response = await fetch(manifestFile(shipped))
    if (!response.ok) throw new Error('This file failed to load.')
    return response.text()
  }

  async function load() {
    const read = ++reads
    try {
      const next = await fetchText()
      if (read !== reads) return
      text.value = next
      error.value = undefined
    } catch (failure) {
      if (read !== reads) return
      error.value = failure as Error
    } finally {
      if (read === reads) updating.value = false
    }
  }

  watch(
    () => [prototype().id, artifact().id],
    () => {
      text.value = undefined
      error.value = undefined
      path = undefined
      void load()
    },
    { immediate: true },
  )
  // The same artifact moved or renamed: its text stays on screen meanwhile.
  watch(() => [artifact().file, artifact().text], load)

  if (import.meta.hot) {
    const hot = import.meta.hot
    const changed = ({ files }: { files: string[] }) => {
      if (!path || !files.includes(path)) return
      updating.value = true
      void load()
    }
    hot.on('studio:source', changed)
    // Changes made while the connection was down are not replayed.
    hot.on('vite:ws:connect', load)
    onScopeDispose(() => {
      hot.off('studio:source', changed)
      hot.off('vite:ws:connect', load)
    })
  }

  return { text, error, updating }
}
