// Where a system change's tab finishes, as its restart handoff carries it
// (`tooling/restart/handoff.ts`): the dialog names it when the change starts
// or is answered, and the Systems page that loads marks it ready. Plain data,
// so it survives the reload in session storage.
export type SystemDestination = { created: string } | { deleted: string }

/** A new system: ready once its Overview shows. */
export const createdSystem = (id: string): SystemDestination => ({
  created: id,
})

/** A deleted system: ready once the collection no longer lists it. */
export const deletedSystem = (id: string): SystemDestination => ({
  deleted: id,
})

const named = (destination: unknown, what: 'created' | 'deleted') => {
  if (!destination || typeof destination !== 'object') return ''
  const id = (destination as Record<string, unknown>)[what]
  return typeof id === 'string' ? id : ''
}

/** The system a creation waits to see open, or '' for another destination. */
export const creationOf = (destination: unknown) =>
  named(destination, 'created')

/** The system a deletion waits to see gone, or '' for another destination. */
export const deletionOf = (destination: unknown) =>
  named(destination, 'deleted')
