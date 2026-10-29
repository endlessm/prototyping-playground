import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import type { ManifestState } from '../../../../tooling/manifest/build'

/**
 * What an artifact address opens: an artifact, or a view's named state,
 * which is the view's record with the state's ID and title.
 */
export type OpenArtifact = ManifestArtifact & {
  state?: ManifestState & { view: string }
}

/** The artifact or named state with this permanent ID. */
export function findArtifact(
  artifacts: ManifestArtifact[],
  id: string,
): OpenArtifact | undefined {
  for (const artifact of artifacts) {
    if (artifact.id === id) return artifact
    const state = artifact.states?.find((entry) => entry.id === id)
    if (state)
      return {
        ...artifact,
        id: state.id,
        title: `${artifact.title} · ${state.title}`,
        state: { ...state, view: artifact.id },
      }
  }
  return undefined
}

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
