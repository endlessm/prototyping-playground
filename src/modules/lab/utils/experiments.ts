// The Lab's experiments of a component, from the manifest: everyone's, in
// active prototypes, newest first, each with its prototype and who made it,
// and where each opens. Plain functions, so the tab and the experiment's
// page agree.
import type {
  Manifest,
  ManifestContributor,
  ManifestExperiment,
  ManifestPrototype,
} from '../../../../tooling/manifest/build'
import { labAddress } from './lab'

export interface LabExperiment extends Omit<ManifestExperiment, 'prototype'> {
  /** The prototype it is a view of. */
  prototype: ManifestPrototype
  /** Who made it: its prototype's owner, as the gallery's bylines name them. */
  author: Pick<ManifestContributor, 'key' | 'name'>
}

function authorOf(manifest: Manifest, prototype: ManifestPrototype) {
  return (
    manifest.contributors.find(({ id }) => id === prototype.owner) ??
    manifest.contributors.find(({ key }) => key === prototype.contributor) ?? {
      key: prototype.contributor,
      name: prototype.contributor,
    }
  )
}

export function experimentsOf(
  manifest: Manifest,
  systemId: string,
  component: string,
): LabExperiment[] {
  return (manifest.experiments ?? [])
    .filter(
      (experiment) =>
        experiment.systemId === systemId && experiment.component === component,
    )
    .flatMap((experiment) => {
      const prototype = manifest.prototypes.find(
        ({ id }) => id === experiment.prototype,
      )
      return prototype?.status === 'active'
        ? [{ ...experiment, prototype, author: authorOf(manifest, prototype) }]
        : []
    })
    .sort(
      (a, b) =>
        (b.created ?? '').localeCompare(a.created ?? '') ||
        a.title.localeCompare(b.title),
    )
}

/** Where an experiment opens in the Lab: its own Breakdown. */
export const experimentAddress = (experiment: LabExperiment) =>
  labAddress(
    experiment.systemId,
    experiment.component,
    `experiments/${experiment.id}`,
  )

/** The experiment's page as a view of its prototype, with its comments. */
export const viewAddress = (experiment: LabExperiment) =>
  `/prototypes/${experiment.prototype.id}/artifacts/${experiment.id}`

/** What the name dialog asks the dev server to make. */
export type ExperimentRequest =
  | { action: 'create'; system: string; component: string }
  | { action: 'duplicate'; experiment: string }
