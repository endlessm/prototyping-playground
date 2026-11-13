// The person panel's own text: how it heads the person who brought a tile in, what each role can do and see, and
// which onboarding flow it links to. "Can do" comes from the sample world, the words of each role's invite; "can see"
// is the map's own text, following the scope rules in the Endless Studios context (educator-roles.md): a role in one
// place grants nothing in another. Who holds what and the chain of awards are story derivations, in `story.ts`.

import { endlessAdmin, roles, view, type RoleKey } from '../_wire/world'
import {
  mapRoles,
  organizationOf,
  type HeldRole,
  type MapNode,
  type MapPlace,
  type MapRoleKey,
  type Story,
} from './story'

/** The section heading over the person who brought a tile in, in the award's own words. */
export function arrivalHeading(held: HeldRole | undefined): string {
  if (!held?.verb) return 'Invited by'
  if (held.verb.startsWith('makes')) return `Made ${mapRoles[held.role].label} by`
  if (held.verb.startsWith('adds')) return 'Added by'
  return 'Invited by'
}

const worldRole = (role: MapRoleKey): RoleKey | undefined => (role in roles ? (role as RoleKey) : undefined)

/** What a role can do: the world's list for the seven educator roles, the map's own for the other two. */
export function canDo(role: MapRoleKey): string[] {
  const key = worldRole(role)
  if (key) return roles[key].can
  if (role === 'endlessAdmin') return endlessAdmin.can
  return ['Join the Cohort with its join link', 'Follow the sessions and hand in tasks', 'Earn a certificate']
}

/** The onboarding flow's first view, for the roles that have a flow in this prototype. */
export function flowStart(role: MapRoleKey): string | undefined {
  const key = worldRole(role)
  return key ? view(key, 1) : undefined
}

/** Whether a role's onboarding flow follows this very tile; Explore's Daniel and Priya hold roles flows follow others in. */
export function isFlowPerson(role: MapRoleKey, node: MapNode): boolean {
  const key = worldRole(role)
  return Boolean(key && node.person && roles[key].person === node.person)
}

/** What a role can see, as a bold lead and the reason after it. */
export interface Visibility {
  lead: string
  rest: string
}

/** What a role can see from the place it is held in. */
export function canSee(role: MapRoleKey, place: MapPlace, story: Story): Visibility {
  const org = organizationOf(story, place.id)
  const district = org ? `the ${org.note ?? 'Organization'}` : 'the Organization'
  switch (role) {
    case 'endlessAdmin':
      return {
        lead: 'Every Organization on Endless Access.',
        rest: 'Endless Admins run the platform from outside the Organizations: they set one up and hand it to its first Org Owner.',
      }
    case 'orgOwner':
    case 'orgManager':
      return {
        lead: `All of ${place.name}.`,
        rest: 'Every Team and Cohort in it, which they can run as Team Owner. Other Organizations stay hidden.',
      }
    case 'orgReviewer':
      return {
        lead: `Every Team and Cohort in ${place.name}, view only.`,
        rest: 'Whether that reaches learner-level data or only the reports is still open; the recommendation is the reports only.',
      }
    case 'teamOwner':
    case 'teamManager':
      return {
        lead: `${place.name} and every Cohort in it.`,
        rest: `A role in one place grants nothing in another, so the other Teams${org ? ` in ${org.name}` : ''} stay hidden.`,
      }
    case 'cohortOwner':
    case 'facilitator':
      return {
        lead: `Only ${place.name}.`,
        rest: `A role in one place grants nothing in another, so the rest of the Team and ${district} stay hidden.`,
      }
    case 'learner':
      return {
        lead: `Only ${place.name}.`,
        rest: 'Their own sessions, tasks and certificate. The educators’ tools and reports stay hidden.',
      }
  }
}

/** A short line under the learners' list: they have no onboarding flow in this prototype. */
export const LEARNER_NOTE = 'Learners join with the Cohort’s link and have no onboarding flow here: learner roles are defined separately.'
