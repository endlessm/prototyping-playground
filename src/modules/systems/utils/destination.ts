// Where a system change's tab finishes, as its restart handoff carries it
// (`tooling/restart/handoff.ts`): the dialog names it when the change starts
// or is answered, and the Systems page that loads marks it ready.
const CREATED = 'created:'
const DELETED = 'deleted:'

/** A new system: ready once its Overview shows. */
export const createdSystem = (id: string) => CREATED + id

/** A deleted system: ready once the collection no longer lists it. */
export const deletedSystem = (id: string) => DELETED + id

/** The system a deletion waits to see gone, or '' for another destination. */
export const deletionOf = (destination: unknown) =>
  typeof destination === 'string' && destination.startsWith(DELETED)
    ? destination.slice(DELETED.length)
    : ''
