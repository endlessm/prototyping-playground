import { refreshManifest } from '../../../../app/composables/useManifest'
import { requestJson } from '../../../../app/utils/studioRequest'
import { labVersionsUrl, type LabVersion } from '../utils/versions'

/** What the Lab's handler answers for a new version. */
export interface CreatedVersion {
  prototype: string
  artifact: string
  /** Its name, such as "Version 2". */
  path: string
}

// Copies a version into your own "<Component> versions" prototype, while
// the studio runs locally: Save as my version on someone else's, Duplicate
// on your own. The Lab's handler (`server/versions.ts`, `copy`) checks who
// you are; its refusal shows in a toast. Resolves to the copy, or null.
export function useVersionCopy() {
  const { t } = useI18n()
  const toast = useStudioToast()
  const url = labVersionsUrl(useRuntimeConfig().app.baseURL)
  const copying = ref<string | null>(null)

  async function copy(version: Pick<LabVersion, 'prototype' | 'id'>) {
    if (!import.meta.dev || copying.value) return null
    copying.value = version.id
    try {
      const created = await requestJson<CreatedVersion>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copy',
          prototype: version.prototype,
          artifact: version.id,
        }),
      })
      await refreshManifest()
      toast.success(t('lab.versions.created', { name: created.path }))
      return created
    } catch (error) {
      toast.error(t('lab.versions.copyFailed'), (error as Error).message)
      return null
    } finally {
      copying.value = null
    }
  }

  return { copy, copying }
}
