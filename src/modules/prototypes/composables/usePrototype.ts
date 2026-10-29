import type { ManifestPrototype } from '../../../../app/composables/useManifest'

/**
 * The prototype at an address and its artifacts, following the address and,
 * in development, changes on disk.
 */
export async function usePrototype(id: () => string) {
  const manifest = await useManifest()
  const prototype = computed<ManifestPrototype | undefined>(() =>
    manifest.value.prototypes.find((entry) => entry.id === id()),
  )
  const artifacts = await usePrototypeArtifacts(id)
  return { prototype, artifacts }
}
