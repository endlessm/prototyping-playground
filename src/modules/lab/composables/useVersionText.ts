import type { Ref } from 'vue'
import { useManifest } from '../../../../app/composables/useManifest'
import {
  versionText,
  type LabVersion,
  type VersionText,
} from '../utils/versions'

export type { VersionText } from '../utils/versions'

// Reads a version's text through `versionText` in `utils/versions.ts`, the
// one reader, as `useVersionCode` does, so the Playground and Changes see
// the same text locally and on the deployed site.

/**
 * A version's text for its Changes, read again when the version or the
 * manifest changes. Locally it includes the Playground's unsaved draft (what
 * the stage shows) and says so; reading never writes.
 */
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
        const found = await versionText(manifest.value, current, {
          base,
          draft: true,
        })
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
