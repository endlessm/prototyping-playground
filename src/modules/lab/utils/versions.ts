import type {
  Manifest,
  ManifestContributor,
  ManifestLabVersion,
  ManifestPrototype,
} from '../../../../tooling/manifest/build'

export type { VersionMarker } from '../../../../tooling/systems/app-versions'
export {
  readVersionMarker,
  withoutStudioMarkers,
} from '../../../../tooling/systems/app-versions'

// The versions of app components, as the manifest lists them: views in
// someone's "<Component> versions" prototype, each holding a
// `@lab-version <system> <component> <revision>` marker. Plain functions,
// so every Lab page that lists, opens or compares versions reads them the
// same way. A version's text is its view's file, read through the file
// service locally (`composables/useVersionDraft.ts`).

/** A version with its prototype and whose it is. */
export interface LabVersion extends ManifestLabVersion {
  /** The prototype holding it. */
  home: ManifestPrototype
  /** Its owner's byline, or null when unknown. */
  owner: ManifestContributor | null
}

function withHome(manifest: Manifest, version: ManifestLabVersion) {
  const home = manifest.prototypes.find(({ id }) => id === version.prototype)
  if (!home) return null
  const owner =
    manifest.contributors.find(({ id }) => id === home.owner) ??
    manifest.contributors.find(({ key }) => key === home.contributor) ??
    null
  return { ...version, home, owner } satisfies LabVersion
}

/** Every version of one component of a system, in manifest order. */
export function versionsOf(
  manifest: Manifest,
  system: string,
  component: string,
): LabVersion[] {
  return (manifest.labVersions ?? [])
    .filter((entry) => entry.system === system && entry.component === component)
    .flatMap((entry) => withHome(manifest, entry) ?? [])
}

/** A version by its view's permanent ID, or null. */
export function versionById(manifest: Manifest, id: string): LabVersion | null {
  const entry = manifest.labVersions?.find((version) => version.id === id)
  return entry ? withHome(manifest, entry) : null
}

/**
 * Whether a version was made against another revision of the app than its
 * original's now (the copy was refreshed since); false when either is unknown.
 */
export const olderRevision = (
  version: Pick<ManifestLabVersion, 'revision'>,
  current: string | null,
) => Boolean(version.revision && current && version.revision !== current)

/** A version's Changes: `/lab/<system id>/<slug>/versions/<view id>/changes`. */
export const changesAddress = (system: string, component: string, id: string) =>
  `/lab/${system}/${component}/versions/${encodeURIComponent(id)}/changes`
