import { manifestFile } from '../../../../app/composables/useManifest'
import { requestJson } from '../../../../app/utils/studioRequest'
import type {
  Manifest,
  ManifestArtifact,
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
// same way. A version's text is its view's file: `versionText` reads it
// through the file service locally and from the file the build ships beside
// the manifest on the deployed site; the Playground edits it locally through
// `composables/useVersionDraft.ts`.

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

/** Why a version's text couldn't be read on the deployed site. */
export type VersionReadProblem = 'missing' | 'failed'

/**
 * A version that couldn't be read: `missing` when the site doesn't ship its
 * text, `failed` when loading it failed. Pages show
 * `lab.versions.errors.<problem>`.
 */
export class VersionReadError extends Error {
  readonly problem: VersionReadProblem
  constructor(problem: VersionReadProblem) {
    super(problem)
    this.name = 'VersionReadError'
    this.problem = problem
  }
}

/**
 * A version's view as its prototype's artifact list has it (its title, its
 * path, and on the deployed site where its text is), or null when the list
 * doesn't hold it. `manifest` is `useManifest()`'s, which says where each
 * prototype's list is.
 */
export async function versionArtifact(
  manifest: { artifacts: Record<string, string> },
  version: Pick<ManifestLabVersion, 'prototype' | 'id'>,
): Promise<ManifestArtifact | null> {
  const listed = manifest.artifacts[version.prototype]
  if (!listed) return null
  const response = await fetch(manifestFile(listed))
  if (!response.ok) throw new VersionReadError('failed')
  const list = (await response.json()) as ManifestArtifact[]
  return list.find(({ id }) => id === version.id) ?? null
}

/** A version's text, and whether it holds edits not saved yet. */
export interface VersionText {
  text: string
  unsaved: boolean
}

/**
 * A version's whole text, as its file holds it (markers included; strip them
 * with `withoutStudioMarkers`): the one reader every Lab page uses. Locally
 * from the dev server's file service, or with `draft` its unsaved draft when
 * the Playground left one (what its stage shows); nothing is written. On the
 * deployed site from the text the build ships beside the manifest for every
 * view holding a version marker. `base` is the site's base address. On the
 * deployed site it throws a `VersionReadError`; locally, the file service's
 * message.
 */
export async function versionText(
  manifest: { artifacts: Record<string, string> },
  version: Pick<ManifestLabVersion, 'prototype' | 'id'>,
  { base, draft = false }: { base: string; draft?: boolean },
): Promise<VersionText> {
  if (import.meta.dev) {
    const at = { prototype: version.prototype, artifact: version.id }
    const [file, saved] = await Promise.all([
      requestJson<{ content: string }>(
        `${base}_studio/files/source?${new URLSearchParams(at)}`,
      ),
      draft
        ? requestJson<{ draft: string | null }>(
            `${base}_studio/modules/lab/versions`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'read-draft', ...at }),
            },
          ).catch(() => ({ draft: null }))
        : { draft: null },
    ])
    return saved.draft === null || saved.draft === file.content
      ? { text: file.content, unsaved: false }
      : { text: saved.draft, unsaved: true }
  }
  const artifact = await versionArtifact(manifest, version)
  if (!artifact?.text) throw new VersionReadError('missing')
  const response = await fetch(manifestFile(artifact.text))
  if (!response.ok) throw new VersionReadError('failed')
  return { text: await response.text(), unsaved: false }
}

/** Whether a version is yours: its prototype's owner is you. */
export const isMine = (
  version: Pick<LabVersion, 'home'>,
  me: { key: string | null; studioId?: string },
) =>
  version.home.owner
    ? version.home.owner === me.studioId
    : Boolean(me.key) && version.home.contributor === me.key

/**
 * Whether you may rename, duplicate into its prototype or delete a version
 * as far as the page knows: yours, or any as an Admin, while the studio runs
 * locally. The file service checks again.
 */
export const mayChangeVersion = (
  version: Pick<LabVersion, 'home'>,
  me: { key: string | null; studioId?: string; role?: string | null },
) =>
  import.meta.dev &&
  Boolean(me.key) &&
  (me.role === 'admin' || isMine(version, me))

/** A version's Changes: `/lab/<system id>/<slug>/versions/<view id>/changes`. */
export const changesAddress = (system: string, component: string, id: string) =>
  `/lab/${system}/${component}/versions/${encodeURIComponent(id)}/changes`
