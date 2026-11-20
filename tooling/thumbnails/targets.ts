// Which prototypes get a picture, and why. A picture is taken only of a
// prototype the running contributor may change (their own, or any for an
// Admin), so nobody creates changes in someone else's folder; an archived
// prototype is read-only, and one whose system was deleted can't render.
import {
  permissionRefusal,
  type Refusal,
  type Team,
} from '../contributors/roles.ts'
import type { Contributors } from '../contributors/profiles.ts'
import type { ManifestArtifact, ManifestPrototype } from '../manifest/build.ts'

export type ThumbnailRefusal = Refusal | 'archived' | 'system-missing'

/** Why the contributor `actor` may not take this prototype's picture. */
export function thumbnailRefusal(
  team: Team,
  contributors: Contributors,
  actor: string | null,
  prototype: Pick<
    ManifestPrototype,
    'contributor' | 'status' | 'systemMissing'
  >,
): ThumbnailRefusal | null {
  const refusal = permissionRefusal(
    team,
    contributors,
    actor,
    { kind: 'prototype', owner: prototype.contributor },
    'edit',
  )
  if (refusal) return refusal
  if (prototype.status === 'archived') return 'archived'
  if (prototype.systemMissing) return 'system-missing'
  return null
}

/**
 * The view a prototype's picture shows: its first in the tree's order, by
 * its default render. Null when it has none (only documents, diagrams or
 * canvases, or nothing yet).
 */
export const firstView = (artifacts: readonly ManifestArtifact[]) =>
  artifacts.find(({ type, unavailable }) => type === 'view' && !unavailable) ??
  null
