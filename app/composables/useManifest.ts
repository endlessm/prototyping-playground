import url from 'virtual:studio-manifest'
import type {
  Manifest,
  ManifestArtifact,
  ManifestPrototype,
} from '../../tooling/manifest/build'

export type { Manifest, ManifestArtifact, ManifestPrototype }

type ClientManifest = Manifest & {
  /** Where each prototype's artifact list is, relative to the manifest. */
  artifacts: Record<string, string>
}

// One manifest for the page, fetched on first use.
const manifest = shallowRef<ClientManifest>()
let pending: Promise<ClientManifest> | undefined

async function loadManifest() {
  pending ??= fetch(url).then(async (response) => {
    if (!response.ok) throw new Error('The studio’s manifest failed to load.')
    return (manifest.value = (await response.json()) as ClientManifest)
  })
  return pending
}

/** Prototypes, systems and the default system, as the build saw them. */
export async function useManifest() {
  await loadManifest()
  return manifest as Ref<ClientManifest>
}

const artifactLists = new Map<string, Promise<ManifestArtifact[]>>()

/** A prototype's artifacts in file-tree order, loaded when it opens. */
export async function usePrototypeArtifacts(prototypeId: string) {
  const current = await loadManifest()
  const relative = current.artifacts[prototypeId]
  if (!relative) return []
  let list = artifactLists.get(prototypeId)
  if (!list) {
    list = fetch(new URL(relative, new URL(url, location.href))).then(
      async (response) => {
        if (!response.ok)
          throw new Error('The prototype’s artifacts failed to load.')
        return (await response.json()) as ManifestArtifact[]
      },
    )
    artifactLists.set(prototypeId, list)
  }
  return list
}
