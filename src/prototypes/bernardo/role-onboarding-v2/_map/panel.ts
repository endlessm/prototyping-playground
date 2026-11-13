// What the person panel says about a tile, derived from the story: the roles they hold and where, who gave each one
// and at which step, the chain of awards from Endless Access down to them, and what each role can do and see. "Can do"
// comes from the sample world, the words of each role's invite; "can see" is the map's own text, following the scope
// rules in the Endless Studios context (educator-roles.md): a role in one place grants nothing in another.

import { roles, view, type RoleKey } from '../_wire/world'
import { mapRoles, type MapNode, type MapPlace, type MapRoleKey, type NodeId, type PlaceKind, type Story } from './story'

/** The colour of a role's chip, by the kind of place it lives in; the same as the tiles'. */
export const chipColor: Record<PlaceKind, 'neutral' | 'secondary' | 'primary' | 'info'> = {
  Platform: 'neutral',
  Organization: 'secondary',
  Team: 'primary',
  Cohort: 'info',
}

export function roleColor(role: MapRoleKey): 'neutral' | 'secondary' | 'primary' | 'info' {
  return role === 'learner' ? 'neutral' : chipColor[mapRoles[role].kind]
}

/** One role a person holds, where, and how they got it. */
export interface HeldRole {
  role: MapRoleKey
  place: MapPlace
  /** The step that gave it; 0 for the Endless Admin, who is there from the start. */
  step: number
  /** Who gave it; absent when the person took it by creating the place, or holds it from the start. */
  by?: MapNode
  /** The verb of the award, such as "invites as" or "makes". */
  verb?: string
  /** True when the person took the role by creating the place. */
  created?: boolean
}

/** Every role a tile holds, in the order the story gives them. */
export function heldRoles(story: Story, id: NodeId): HeldRole[] {
  const node = story.nodes[id]
  if (!node) return []
  const held: HeldRole[] = []
  story.steps.forEach((event, index) => {
    if (event.kind === 'award' && event.node === id) {
      held.push({
        role: event.role,
        place: story.places[event.place],
        step: index + 1,
        by: story.nodes[event.actor],
        verb: event.verb,
      })
    }
    if (event.kind === 'create' && event.actor === id && event.actorRole) {
      held.push({ role: event.actorRole, place: story.places[event.place], step: index + 1, created: true })
    }
  })
  if (held.length === 0) held.push({ role: node.role, place: story.places[node.place], step: 0 })
  return held
}

/** The award that brought a tile onto the map, if any. */
export function arrival(story: Story, id: NodeId): HeldRole | undefined {
  return heldRoles(story, id).find((held) => held.by)
}

/** The section heading over the person who brought a tile in, in the award's own words. */
export function arrivalHeading(held: HeldRole | undefined): string {
  if (!held?.verb) return 'Invited by'
  if (held.verb.startsWith('makes')) return `Made ${mapRoles[held.role].label} by`
  if (held.verb.startsWith('adds')) return 'Added by'
  return 'Invited by'
}

/** The tiles from the top of the story down to `id`, following each award back to whoever gave it. */
export function chainTo(story: Story, id: NodeId): MapNode[] {
  const chain: MapNode[] = []
  const seen = new Set<NodeId>()
  let current: NodeId | undefined = id
  while (current && !seen.has(current) && story.nodes[current]) {
    seen.add(current)
    chain.unshift(story.nodes[current])
    current = arrival(story, current)?.by?.id
  }
  return chain
}

const worldRole = (role: MapRoleKey): RoleKey | undefined => (role in roles ? (role as RoleKey) : undefined)

/** What a role can do: the world's list for the seven educator roles, the map's own for the other two. */
export function canDo(role: MapRoleKey): string[] {
  const key = worldRole(role)
  if (key) return roles[key].can
  if (role === 'endlessAdmin') {
    return [
      'Create Organizations on Endless Access',
      'Make and remove Org Owners',
      'Archive an Organization',
    ]
  }
  return ['Join the Cohort with its join link', 'Follow the sessions and hand in tasks', 'Earn a certificate']
}

/** The onboarding flow's first view, for the roles that have a flow in this prototype. */
export function flowStart(role: MapRoleKey): string | undefined {
  const key = worldRole(role)
  return key ? view(key, 1) : undefined
}

/** What a role can see, as a bold lead and the reason after it. */
export interface Visibility {
  lead: string
  rest: string
}

/** The Organization a place sits in, if any. */
function organizationOf(story: Story, place: MapPlace): MapPlace | undefined {
  let current: MapPlace | undefined = place
  while (current && current.kind !== 'Organization') current = current.parent ? story.places[current.parent] : undefined
  return current
}

/** What a role can see from the place it is held in. */
export function canSee(role: MapRoleKey, place: MapPlace, story: Story): Visibility {
  const org = organizationOf(story, place)
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
