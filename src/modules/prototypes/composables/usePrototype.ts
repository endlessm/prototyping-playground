import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'

/** The prototype at an address and its artifacts, following the address. */
export async function usePrototype(id: () => string) {
  const manifest = await useManifest()
  const prototype = computed<ManifestPrototype | undefined>(() =>
    manifest.value.prototypes.find((entry) => entry.id === id()),
  )
  const artifacts = shallowRef<ManifestArtifact[]>([])
  const load = async () => {
    artifacts.value = prototype.value
      ? await usePrototypeArtifacts(prototype.value.id)
      : []
  }
  await load()
  watch(id, load)
  return { prototype, artifacts }
}
