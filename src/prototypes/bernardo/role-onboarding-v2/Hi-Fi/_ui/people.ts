import type { DirectoryHolding, DirectoryPerson } from './PeopleDirectory.vue'

type Someone = { name: string; initials: string; email: string; you?: boolean; invited?: boolean }

/** Who holds what in a place, as PeopleDirectory's cards: each person once, with every position, in the given order. */
export function directoryOf(positions: [holding: DirectoryHolding, holders: Someone[]][]): DirectoryPerson[] {
  const byEmail = new Map<string, DirectoryPerson>()
  for (const [holding, holders] of positions) {
    for (const p of holders) {
      const found = byEmail.get(p.email)
      if (found) found.held.push(holding)
      else byEmail.set(p.email, { ...p, held: [holding] })
    }
  }
  return [...byEmail.values()]
}

/** Roles the viewer may strip from someone, by viewer; never their own. */
export function removableBy(roles: string[]) {
  return (person: DirectoryPerson, holding: DirectoryHolding) => !person.you && roles.includes(holding.role)
}
