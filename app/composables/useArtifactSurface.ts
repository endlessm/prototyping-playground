import type { InjectionKey, ShallowRef } from 'vue'
import type { ArtifactSurface } from '../utils/artifactSurface'

// The artifact page holds one slot for its file type's surface; the type's
// page fills it while it is mounted, and the page hands it to the tools
// drawn over it.
const SURFACE: InjectionKey<ShallowRef<ArtifactSurface | null>> =
  Symbol('artifact-surface')

/** The artifact page's slot, for the tools drawn over it. */
export function provideArtifactSurface() {
  const surface = shallowRef<ArtifactSurface | null>(null)
  provide(SURFACE, surface)
  return surface
}

/**
 * A file type's page offers its surface while it is mounted. `surface`
 * becomes available once the page has the element it covers.
 */
export function useArtifactSurfaceProvider(
  surface: () => ArtifactSurface | null,
) {
  const slot = inject(SURFACE, null)
  if (!slot) return
  watchEffect(() => {
    slot.value = surface()
  })
  onBeforeUnmount(() => {
    slot.value = null
  })
}
