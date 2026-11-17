// Where `/lab` and `/lab/<system id>` send a visitor. The pages' middleware
// imports this file on demand: Nuxt copies page middleware into the route
// table, which ships in the app's entry, and a static import here would pull
// the manifest and the Systems build data into it. Every page would then
// prefetch them, and a build under a sub-path would fail on those links.
import { useManifest } from '../../../../app/composables/useManifest'
import { useSystemCatalog } from '../../systems/composables/useSystemCatalog'
import { labAddress, labLanding } from './lab'

/** The default system's first component, or none to stay on `/lab`. */
export async function labLandingAddress() {
  const [manifest, { systems }] = await Promise.all([
    useManifest(),
    useSystemCatalog(),
  ])
  return labLanding(systems.value, manifest.value.defaultSystem)
}

/** An active system's first component, or none to stay on the system. */
export async function systemLandingAddress(systemId: string) {
  const { systemOf } = await useSystemCatalog()
  const system = systemOf(systemId)
  const first = system?.status === 'active' && system.components[0]
  return first ? labAddress(systemId, first.slug) : null
}
