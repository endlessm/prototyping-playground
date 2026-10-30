// Merging a canvas saved elsewhere (an agent, or another tab) into the one
// open here. Used when this canvas has edits that aren't saved yet; with
// none, the file simply replaces the scene.
//
// Elements are matched by id and the newer version of each wins
// (Excalidraw's own rules, handed in as `reconcile`). The file holds only
// live elements, so an element missing from it might be one deleted there
// or one only this canvas has: `lastIds` (the ids in the file as this canvas
// last knew it) tells them apart. A missing one that was in the file was
// deleted there; one that wasn't is ours and is kept.

export interface MergeElement {
  id: string
  version: number
  versionNonce: number
  isDeleted?: boolean
}

export interface MergeRules<E extends MergeElement> {
  /** Excalidraw's `reconcileElements`: the newer version of each wins. */
  reconcile: (local: readonly E[], remote: readonly E[]) => E[]
  /** Excalidraw's `newElementWith(element, { isDeleted: true })`. */
  deleted: (element: E) => E
}

export function mergeRemote<E extends MergeElement>(
  local: readonly E[],
  remote: readonly E[],
  lastIds: ReadonlySet<string>,
  rules: MergeRules<E>,
) {
  const remoteIds = new Set(remote.map((element) => element.id))
  const marked = local.map((element) =>
    !element.isDeleted && lastIds.has(element.id) && !remoteIds.has(element.id)
      ? rules.deleted(element)
      : element,
  )
  const elements = rules.reconcile(marked, remote)
  // Elements this canvas holds that the file lacks: save the union.
  const needsWriteBack = elements.some(
    (element) => !element.isDeleted && !remoteIds.has(element.id),
  )
  return { elements, needsWriteBack }
}
