// The Roles Map's story data, built on the prototype's sample world (`_wire/world.ts`). The world holds the facts
// (people, roles, places, the Program); this file adds only what the map needs: which places and tiles exist, the
// steps as events, captions and where each tile sits on the canvas grid. Everything a step shows or hides is derived
// from the list of steps, so a new story is a new list.

import {
  COHORT,
  endlessAdmin,
  learners,
  ORG_KIND,
  ORG_SHORT,
  people,
  PROGRAM,
  roles,
  TEAM,
  type Level,
  type Person,
  type RoleKey,
} from '../_wire/world'

/** The proposed roles plus the two the flows don't onboard: the Endless Admin at the top and the learners. */
export type MapRoleKey = RoleKey | 'endlessAdmin' | 'learner'

/** Where a role lives. `Platform` is Endless Access itself. */
export type PlaceKind = 'Platform' | Level

export type PlaceId = string
export type NodeId = string

export interface MapRole {
  key: MapRoleKey
  label: string
  kind: PlaceKind
}

export const mapRoles: Record<MapRoleKey, MapRole> = {
  endlessAdmin: { key: 'endlessAdmin', label: endlessAdmin.label, kind: 'Platform' },
  ...(Object.fromEntries(
    Object.values(roles).map((role) => [role.key, { key: role.key, label: role.label, kind: role.level }]),
  ) as Record<RoleKey, MapRole>),
  learner: { key: 'learner', label: 'Learner', kind: 'Cohort' },
}

/** An area on the map: Endless Access, an Organization, a Team or a Cohort. */
export interface MapPlace {
  id: PlaceId
  name: string
  kind: PlaceKind
  parent: PlaceId | null
  /** A short description after the kind, such as the Organization's type. */
  note?: string
  /** The Program a Cohort runs. */
  program?: string
}

/** A tile: one person, or the learners of a Cohort as one tile with their count. */
export interface MapNode {
  id: NodeId
  role: MapRoleKey
  place: PlaceId
  person?: Person
  count?: number
}

export type StoryEvent =
  | {
      kind: 'award'
      actor: NodeId
      node: NodeId
      role: MapRoleKey
      place: PlaceId
      /** The arrow's verb before the role: "invites as" Team Owner. */
      verb: string
      /** The role the actor awards it as, when it isn't their tile's role: Ben invites Sofia as a Cohort Owner. */
      byRole?: MapRoleKey
      caption: string
    }
  | {
      kind: 'create'
      actor: NodeId
      place: PlaceId
      /** The arrow's label after "creates". */
      object: string
      /** The role the creator takes in what they create, such as a Cohort's first Cohort Owner. */
      actorRole?: MapRoleKey
      caption: string
    }

/** A tile's top-left corner in canvas grid cells (`GRID` pixels each, see `layout.ts`). */
export interface GridPoint {
  col: number
  row: number
}

export interface Story {
  id: string
  title: string
  places: Record<PlaceId, MapPlace>
  nodes: Record<NodeId, MapNode>
  steps: StoryEvent[]
  positions: Record<NodeId, GridPoint>
  /** The caption of the unnumbered frame before step 1, when the story has one: only Endless Access is there. */
  start?: string
  /**
   * Whether the steps are a timeline to play. Explore's aren't: it shows everything at once, so its steps only say
   * who awarded or created what, and the map shows no step numbers.
   */
  timed: boolean
}

/** A person's first name, as the map's captions and labels use it. */
export const firstName = (person: Person): string => person.name.split(' ')[0] ?? person.name
/** The first name of whoever holds a role in the flows. */
const who = (key: RoleKey) => firstName(roles[key].person)

/** The map's key for a role named as the world names it, such as a role's `byRole`. */
function roleNamed(label: string): MapRoleKey | undefined {
  return (Object.values(mapRoles) as MapRole[]).find((role) => role.label === label)?.key
}

const brightwaterPlaces: Record<PlaceId, MapPlace> = {
  endless: { id: 'endless', name: 'Endless Access', kind: 'Platform', parent: null },
  org: { id: 'org', name: ORG_SHORT, kind: 'Organization', parent: null, note: ORG_KIND },
  team: { id: 'team', name: TEAM, kind: 'Team', parent: 'org' },
  cohort: { id: 'cohort', name: COHORT, kind: 'Cohort', parent: 'team', program: PROGRAM },
}

const placeOf: Record<Level, PlaceId> = { Organization: 'org', Team: 'team', Cohort: 'cohort' }

const holder = (key: RoleKey): MapNode => ({
  id: Object.entries(people).find(([, person]) => person === roles[key].person)?.[0] ?? key,
  role: key,
  place: placeOf[roles[key].level],
  person: roles[key].person,
})

const brightwaterNodes: Record<NodeId, MapNode> = Object.fromEntries(
  [
    { id: 'alex', role: 'endlessAdmin', place: 'endless', person: people.alex } satisfies MapNode,
    holder('orgOwner'),
    holder('orgManager'),
    holder('teamOwner'),
    holder('teamManager'),
    holder('cohortOwner'),
    holder('facilitator'),
    { id: 'learners', role: 'learner', place: 'cohort', count: learners.length } satisfies MapNode,
  ].map((node) => [node.id, node]),
)

/** The chain the seven flows tell, from the Endless Admin down to the learners. */
export const brightwater: Story = {
  id: 'brightwater',
  title: ORG_SHORT,
  timed: true,
  start: `Endless Access sets up ${ORG_SHORT} and asks ${firstName(people.alex)} to hand it over`,
  places: brightwaterPlaces,
  nodes: brightwaterNodes,
  steps: [
    {
      kind: 'award',
      actor: 'alex',
      node: 'grace',
      role: 'orgOwner',
      place: 'org',
      verb: 'makes',
      caption: `${firstName(people.alex)} makes ${who('orgOwner')} the Org Owner of ${ORG_SHORT}`,
    },
    {
      kind: 'award',
      actor: 'grace',
      node: 'marcus',
      role: 'orgManager',
      place: 'org',
      verb: 'invites as',
      caption: `${who('orgOwner')} invites ${who('orgManager')} as Org Manager`,
    },
    {
      kind: 'create',
      actor: 'marcus',
      place: 'team',
      object: 'the Team',
      caption: `${who('orgManager')} creates the Team ${TEAM}`,
    },
    {
      kind: 'award',
      actor: 'marcus',
      node: 'aisha',
      role: 'teamOwner',
      place: 'team',
      verb: 'invites as',
      caption: `${who('orgManager')} invites ${who('teamOwner')} as Team Owner`,
    },
    {
      kind: 'award',
      actor: 'aisha',
      node: 'ben',
      role: 'teamManager',
      place: 'team',
      verb: 'invites as',
      caption: `${who('teamOwner')} invites ${who('teamManager')} as Team Manager`,
    },
    {
      kind: 'create',
      actor: 'ben',
      place: 'cohort',
      object: 'a Cohort',
      actorRole: 'cohortOwner',
      caption: `${who('teamManager')} creates ${COHORT}, a Cohort of ${PROGRAM}, and becomes its Cohort Owner`,
    },
    {
      kind: 'award',
      actor: 'ben',
      node: 'sofia',
      role: 'cohortOwner',
      place: 'cohort',
      verb: 'invites as',
      byRole: roleNamed(roles.cohortOwner.byRole),
      caption: `${who('teamManager')} invites ${who('cohortOwner')} as a second Cohort Owner`,
    },
    {
      kind: 'award',
      actor: 'sofia',
      node: 'sam',
      role: 'facilitator',
      place: 'cohort',
      verb: 'invites as',
      caption: `${who('cohortOwner')} invites ${who('facilitator')} as Facilitator`,
    },
    {
      kind: 'award',
      actor: 'sam',
      node: 'learners',
      role: 'learner',
      place: 'cohort',
      verb: 'adds',
      caption: `${who('facilitator')} adds ${learners.length} learners to ${COHORT}`,
    },
  ],
  positions: {
    alex: { col: 2, row: 4 },
    grace: { col: 14, row: 4 },
    marcus: { col: 28, row: 4 },
    ben: { col: 15, row: 17 },
    aisha: { col: 28, row: 17 },
    sofia: { col: 15, row: 30 },
    sam: { col: 28, row: 30 },
    learners: { col: 41, row: 30 },
  },
}

/** The step (1-based) at which a tile is awarded its role; 0 for one nobody awards, there from the start (Alex). */
export function joinStep(story: Story, id: NodeId): number {
  return story.steps.findIndex((event) => event.kind === 'award' && event.node === id) + 1
}

/** The step at which an area appears: when it is created, or its first role is awarded; 0 for one always there. */
export function placeStep(story: Story, id: PlaceId): number {
  const created = story.steps.findIndex((event) => event.kind === 'create' && event.place === id)
  if (created >= 0) return created + 1
  const awarded = story.steps.findIndex((event) => event.kind === 'award' && event.place === id)
  return story.places[id]?.parent === null && awarded < 0 ? 0 : awarded + 1
}

/** Who created an area, when the story creates it. */
export function placeCreator(story: Story, id: PlaceId): MapNode | undefined {
  const event = story.steps.find((step) => step.kind === 'create' && step.place === id)
  return event ? story.nodes[event.actor] : undefined
}

/** What exists once `step` has happened. */
export function existsAt(story: Story, step: number): { nodes: Set<NodeId>; places: Set<PlaceId> } {
  const nodes = new Set(Object.keys(story.nodes).filter((id) => joinStep(story, id) <= step))
  const places = new Set(
    Object.keys(story.places).filter((id) => {
      const at = placeStep(story, id)
      return at === 0 || at <= step
    }),
  )
  return { nodes, places }
}

/** What an area's tab says after its kind: what the place is, or (the step that made it and) who created it. */
export function placeDetail(story: Story, id: PlaceId): string {
  const place = story.places[id]
  if (!place) return ''
  if (place.note) return place.note
  const step = placeStep(story, id)
  const person = placeCreator(story, id)?.person
  const creator = person ? firstName(person) : undefined
  const by = creator ? `created by ${creator}` : ''
  if (!story.timed) return by
  if (!step) return ''
  return by ? `step ${step} · ${by}` : `step ${step}`
}

/** A tile's title: the person's name, or how many learners joined. */
export function nodeTitle(node: MapNode): string {
  if (node.person) return node.person.name
  return `${node.count ?? 0} ${node.count === 1 ? 'learner' : 'learners'}`
}

/** What the map calls a tile in passing: the person's first name, or the learners' title. */
export function shortName(node: MapNode): string {
  return node.person ? firstName(node.person) : nodeTitle(node)
}

/** A place and every place around it, from the place itself out to the outermost. */
export function ancestors(story: Story, id: PlaceId): MapPlace[] {
  const chain: MapPlace[] = []
  let place = story.places[id]
  while (place && !chain.includes(place)) {
    chain.push(place)
    place = place.parent ? story.places[place.parent] : undefined
  }
  return chain
}

/** The Organization a place sits in, itself included. */
export function organizationOf(story: Story, id: PlaceId): MapPlace | undefined {
  return ancestors(story, id).find((place) => place.kind === 'Organization')
}

/** One role a person holds, where, and how they got it. */
export interface HeldRole {
  role: MapRoleKey
  place: MapPlace
  /** The step that gave it; 0 for the Endless Admin, who is there from the start. */
  step: number
  /** Who gave it; absent when the person took it by creating the place, or holds it from the start. */
  by?: MapNode
  /** The role the giver awarded it as, such as Ben adding Sofia as a Cohort Owner. */
  byRole?: MapRoleKey
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
        byRole: event.byRole ?? story.nodes[event.actor]?.role,
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

/** One tile on a chain, with the role it acts in there: the role it awarded the next one as, or its own. */
export interface ChainLink {
  node: MapNode
  role: MapRoleKey
}

/** The tiles from the top of the story down to `id`, following each award back to whoever gave it. */
export function chainTo(story: Story, id: NodeId): ChainLink[] {
  const chain: ChainLink[] = []
  const seen = new Set<NodeId>()
  let current: NodeId | undefined = id
  let role: MapRoleKey | undefined
  while (current && !seen.has(current) && story.nodes[current]) {
    seen.add(current)
    const node: MapNode = story.nodes[current]
    chain.unshift({ node, role: role ?? node.role })
    const came = arrival(story, current)
    current = came?.by?.id
    role = came?.byRole
  }
  return chain
}
