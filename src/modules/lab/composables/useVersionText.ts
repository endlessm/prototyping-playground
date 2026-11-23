import type { Ref } from 'vue'
import type { ManifestArtifact } from '../../../../tooling/manifest/build'
import {
  manifestFile,
  useManifest,
} from '../../../../app/composables/useManifest'
import { requestJson } from '../../../../app/utils/studioRequest'
import type { LabVersion } from '../utils/versions'

/** A version's text, and whether it holds edits not saved yet. */
export interface VersionText {
  text: string
  unsaved: boolean
}

// The one place a page reads a version's whole text. Locally: its unsaved
// draft when the Playground left one (what its stage shows), otherwise its
// file, through the file service; read-only, so opening Changes never
// writes. On the deployed site: the file the build ships beside the
// manifest for the view (`ManifestArtifact.text` in its prototype's artifact
// list), as documents read theirs.
async function readVersionText(
  version: LabVersion,
  lists: Record<string, string>,
  base: string,
): Promise<VersionText> {
  const at = { prototype: version.prototype, artifact: version.id }
  if (import.meta.dev) {
    const [file, { draft }] = await Promise.all([
      requestJson<{ content: string }>(
        `${base}_studio/files/source?${new URLSearchParams(at)}`,
      ),
      requestJson<{ draft: string | null }>(
        `${base}_studio/modules/lab/versions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'read-draft', ...at }),
        },
      ).catch(() => ({ draft: null })),
    ])
    return draft === null || draft === file.content
      ? { text: file.content, unsaved: false }
      : { text: draft, unsaved: true }
  }
  const list = lists[version.prototype]
  const listed = list ? await fetch(manifestFile(list)) : null
  if (!listed?.ok) throw new Error('missing')
  const artifacts = (await listed.json()) as ManifestArtifact[]
  const shipped = artifacts.find(({ id }) => id === version.id)?.text
  if (!shipped) throw new Error('missing')
  const response = await fetch(manifestFile(shipped))
  if (!response.ok) throw new Error('missing')
  return { text: await response.text(), unsaved: false }
}

/** A version's text, read again when the version or the manifest changes. */
export async function useVersionText(
  version: () => LabVersion | null,
): Promise<{
  text: Readonly<Ref<VersionText | null>>
  failed: Readonly<Ref<boolean>>
  loading: Readonly<Ref<boolean>>
}> {
  const base = useRuntimeConfig().app.baseURL
  const manifest = await useManifest()
  const text = shallowRef<VersionText | null>(null)
  const failed = ref(false)
  const loading = ref(false)
  let reads = 0
  // Another version starts blank; the same one read again (the manifest
  // moved on, as after a save) keeps its text on screen meanwhile.
  watch(
    [() => version()?.id, () => manifest.value.revision],
    async ([id], previous) => {
      const read = ++reads
      if (id !== previous?.[0]) {
        text.value = null
        failed.value = false
      }
      const current = version()
      if (!current) return
      loading.value = true
      try {
        const found = await readVersionText(
          current,
          manifest.value.artifacts,
          base,
        )
        if (read === reads) {
          text.value = found
          failed.value = false
        }
      } catch {
        if (read === reads) failed.value = true
      } finally {
        if (read === reads) loading.value = false
      }
    },
    { immediate: true },
  )
  return { text, failed, loading }
}
