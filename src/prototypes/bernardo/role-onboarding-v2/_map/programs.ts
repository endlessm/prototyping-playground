// The Programs an Organization can run, for the shelf inside it. In the proposed model every Organization can run
// the Programs open to everyone, and custom ones only through a Partnership with Endless Access (educator-roles.md
// § Programs). The open ones are real catalog Programs (programs.md). The sample district has no Partnership, as its
// Programs tab in the flows says, so the shelf holds only open Programs.

import { PROGRAM } from '../_wire/world'
import { organizationOf, type PlaceId, type Story } from './story'

export type ProgramAccess = 'open' | 'partnership'

export interface ShelfProgram {
  name: string
  access: ProgramAccess
}

export const accessLabel: Record<ProgramAccess, string> = {
  open: 'Open to everyone',
  partnership: 'Custom · Partnership',
}

/** The shelf's Programs, the ones the story's Cohorts run last so their arrows reach the shelf's bottom edge. */
const catalog: ShelfProgram[] = [
  { name: 'Core: Threadbare', access: 'open' },
  { name: 'Explore: Threadbare', access: 'open' },
  { name: PROGRAM, access: 'open' },
]

export function shelfPrograms(story: Story): ShelfProgram[] {
  const run = new Set(Object.values(story.places).flatMap((place) => (place.program ? [place.program] : [])))
  const missing = [...run].filter((name) => !catalog.some((program) => program.name === name))
  const shelf = [...catalog, ...missing.map((name): ShelfProgram => ({ name, access: 'open' }))]
  return [...shelf.filter((program) => !run.has(program.name)), ...shelf.filter((program) => run.has(program.name))]
}

/** The Cohorts inside an Organization that run a Program, among the places on the map now. */
export function cohortsRunning(story: Story, program: string, shown: Set<PlaceId>, organization: PlaceId): PlaceId[] {
  return Object.values(story.places)
    .filter((place) => place.program === program && shown.has(place.id))
    .filter((place) => organizationOf(story, place.id)?.id === organization)
    .map((place) => place.id)
}

export function cohortCount(count: number): string {
  if (count === 0) return 'No Cohorts'
  return `${count} ${count === 1 ? 'Cohort' : 'Cohorts'}`
}
