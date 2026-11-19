// The whole district once every flow is done, as a tree of places (Organization, Teams, Cohorts) whose positions hold
// people. It is built from the sample world, so the chart, the flows and the Roles Map tell the same story; places
// outside the Organization (Sam's Independent Team) are not part of it. The chart is seen by Grace, the Org Owner: an
// Org Owner holds everything an Org Manager can do, and an Org Manager acts as Team Owner in every Team (and so as
// Cohort Owner in every Cohort), so she can add people to every position.
// Proposal: the last Owner of a Team or Cohort can't be removed until another is added, by analogy with the model's
// rule that the last Owner can't give the role up. Org Owners are never removed here: only an Endless Admin does that.

import { computed, inject, provide, reactive, ref, type InjectionKey } from 'vue'
import {
  COHORT,
  cohorts,
  FALL_COHORT,
  NORTHGATE,
  ORG,
  people,
  TEAM,
  WINTER_COHORT,
  type Level,
  type Person,
} from '../../../../_wire/world'

export interface Member extends Person {
  you?: boolean
  invited?: boolean
  /** How the person came to hold the position. */
  how: string
}

export interface Position {
  id: string
  /** The role's name for one person, as the model writes it. */
  role: string
  /** The position's heading. */
  title: string
  /** The words on its add button. */
  add: string
  members: Member[]
}

export interface Place {
  id: string
  level: Level
  name: string
  detail: string
  /** A Cohort's run so far: where its sessions stand and its learners' average progress, in percent. */
  run?: { status: string; progress: number }
  positions: Position[]
  children: Place[]
}

/** Where a Cohort's run stands, in the words the Structure's Status filter and badges share. */
export type Phase = 'Under way' | 'Upcoming' | 'Finished'
export const PHASES: Phase[] = ['Under way', 'Upcoming', 'Finished']
export const phaseOf = (run: NonNullable<Place['run']>): Phase =>
  run.status.startsWith('Starts') ? 'Upcoming' : run.status.startsWith('Session') ? 'Under way' : 'Finished'

export type Removal = 'allowed' | 'lastOwner' | 'none'

/** Someone in one place, with every position they hold there. */
export interface Occupant extends Member {
  roles: string[]
}

/** Someone in the Organization, with every position they hold anywhere in it, top down. */
export interface Entry extends Member {
  held: Holding[]
}

export interface Holding {
  role: string
  place: string
  level: Level
  /** The Team the place belongs to, itself for a Team; none for the Organization. */
  team?: string
}

/** The people of one place, each once, in the order of the place's positions. */
export function occupantsOf(place: Place): Occupant[] {
  const byEmail = new Map<string, Occupant>()
  for (const position of place.positions) {
    for (const m of position.members) {
      const found = byEmail.get(m.email)
      if (found) found.roles.push(position.role)
      else byEmail.set(m.email, { ...m, roles: [position.role] })
    }
  }
  return [...byEmail.values()]
}

const VIEWER = people.grace

const member = (p: Person, how: string): Member => ({ ...p, how, you: p.email === VIEWER.email })
const by = (p: Person) => `Added by ${p.name}`

const position = (place: string, role: string, title: string, add: string, members: Member[]): Position => ({
  id: `${place}/${role}`,
  role,
  title,
  add,
  members,
})

function cohortPlace(name: string, owners: Member[], facilitators: Member[]): Place {
  const entry = cohorts.find((c) => c.name === name)
  return {
    id: name,
    level: 'Cohort',
    name,
    detail: entry ? `${entry.learners} learners` : '',
    run: entry && { status: entry.status, progress: entry.progress },
    positions: [
      position(name, 'Cohort Owner', 'Cohort Owners', 'Add Cohort Owner', owners),
      position(name, 'Facilitator', 'Facilitators', 'Invite Facilitators', facilitators),
    ],
    children: [],
  }
}

function teamPlace(name: string, owners: Member[], managers: Member[], children: Place[]): Place {
  const count = children.length
  return {
    id: name,
    level: 'Team',
    name,
    detail: count ? `${count} ${count === 1 ? 'Cohort' : 'Cohorts'}` : 'No Cohorts yet',
    positions: [
      position(name, 'Team Owner', 'Team Owners', 'Add Team Owner', owners),
      position(name, 'Team Manager', 'Team Managers', 'Add Team Managers', managers),
    ],
    children,
  }
}

export function buildDistrict(): Place {
  const teams = [
    teamPlace(
      TEAM,
      [member(people.aisha, by(people.marcus))],
      [member(people.ben, by(people.aisha)), member(people.daniel, by(people.aisha))],
      [
        cohortPlace(WINTER_COHORT, [member(people.daniel, 'Created this Cohort')], []),
        cohortPlace(
          COHORT,
          [member(people.ben, 'Created this Cohort'), member(people.sofia, by(people.ben))],
          [member(people.sam, by(people.sofia))],
        ),
      ],
    ),
    teamPlace(
      NORTHGATE,
      [member(people.priya, by(people.marcus))],
      [],
      [
        cohortPlace(
          FALL_COHORT,
          [member(people.priya, 'Created this Cohort')],
          [member(people.ben, by(people.priya))],
        ),
      ],
    ),
  ]
  return {
    id: ORG,
    level: 'Organization',
    name: ORG,
    detail: `${teams.length} Teams`,
    positions: [
      position(ORG, 'Org Owner', 'Org Owners', 'Add Org Owner', [member(people.grace, by(people.alex))]),
      position(ORG, 'Org Manager', 'Org Managers', 'Add Org Managers', [member(people.marcus, by(people.grace))]),
      position(ORG, 'Org Reviewer', 'Org Reviewers', 'Add Org Reviewers', [member(people.linda, by(people.marcus))]),
    ],
    children: teams,
  }
}

// A stress test of the drawing, not part of the story: a district the size of a large real one, with more Teams,
// Cohorts and people per position than the sample world has, long names among them and positions left empty.
const FIRST = ['Amara', 'Benjamin', 'Carmen', 'Dmitri', 'Elena', 'Farouk', 'Gabriela', 'Hiroshi', 'Ingrid', 'Jamal']
const LAST = ['Okonkwo', 'Fitzgerald', 'Nakamura', 'Alvarez-Whitfield', 'Lindqvist', 'Mensah', 'Castellanos', 'Patel']
const TEAMS = [
  'Lincoln Middle School',
  'Roosevelt High School STEM Academy',
  'Jefferson Elementary',
  'Westside Career and Technical Education Center',
  'Harbor View K–8',
  'Northgate Middle School',
]
const SEASONS = ['Fall', 'Winter', 'Spring', 'Summer']
const COHORT_TOPICS = ['Robotics', 'Game Design', 'Digital Storytelling', 'Data Science for Beginners', 'Web Basics']

// Most Cohorts are under way at different sessions; some haven't started and some have finished.
function largeRun(n: number): Place['run'] {
  if (n % 5 === 1) return { status: `Starts ${['Jan 12', 'Feb 3', 'Mar 2'][n % 3]}, 2027`, progress: 0 }
  if (n % 5 === 3) return { status: `Finished ${['Nov 20', 'Dec 8', 'Oct 31'][n % 3]}`, progress: 100 }
  const session = 1 + ((n * 3) % 9)
  return { status: `Session ${session} of 10`, progress: Math.min(95, session * 10 - 5 + (n % 4) * 3) }
}

function buildLargeDistrict(): Place {
  let next = 0
  const person = (): Person => {
    const n = next++
    const first = FIRST[n % FIRST.length]
    const last = LAST[Math.floor(n / FIRST.length) % LAST.length]
    const name = `${first} ${last}`
    return { name, initials: `${first[0]}${last[0]}`, email: `${first}.${last}.${n}@brightwater.org`.toLowerCase() }
  }
  // Every fourth person is still only invited, so the stacks mix both looks.
  const crowd = (count: number, how: string): Member[] =>
    Array.from({ length: count }, (_, i) => ({ ...member(person(), how), invited: i % 4 === 3 }))

  const teams = TEAMS.map((name, t) => {
    const cohortCount = [4, 3, 2, 5, 1, 3][t]
    const children = Array.from({ length: cohortCount }, (_, c) => {
      const cohort = `${SEASONS[(t + c) % 4]} ${COHORT_TOPICS[(t * 2 + c) % COHORT_TOPICS.length]} ${2026 + (c % 2)}`
      const place = cohortPlace(cohort, crowd(1 + ((t + c) % 3), 'Created this Cohort'), crowd([0, 2, 6, 11][(t + c) % 4], 'Added by a Cohort Owner'))
      place.id = `${name}/${cohort}`
      place.detail = `${18 + ((t * 7 + c * 5) % 20)} learners`
      place.run = largeRun(t * 3 + c)
      return place
    })
    return teamPlace(name, crowd(1 + (t % 2), 'Added by an Org Manager'), crowd([5, 0, 3, 9, 2, 1][t], 'Added by a Team Owner'), children)
  })

  return {
    id: ORG,
    level: 'Organization',
    name: ORG,
    detail: `${teams.length} Teams`,
    positions: [
      position(ORG, 'Org Owner', 'Org Owners', 'Add Org Owner', [member(people.grace, by(people.alex)), ...crowd(1, by(people.alex))]),
      position(ORG, 'Org Manager', 'Org Managers', 'Add Org Managers', crowd(7, by(people.grace))),
      position(ORG, 'Org Reviewer', 'Org Reviewers', 'Add Org Reviewers', crowd(14, by(people.grace))),
    ],
    children: teams,
  }
}

const UNDO_MS = 10000

function createOrgChart(scale: 'sample' | 'large' = 'sample') {
  const root = reactive(scale === 'large' ? buildLargeDistrict() : buildDistrict())

  const places = computed<Place[]>(() => {
    const walk = (place: Place): Place[] => [place, ...place.children.flatMap(walk)]
    return walk(root)
  })

  const headcount = computed(
    () => new Set(places.value.flatMap((place) => place.positions.flatMap((p) => p.members.map((m) => m.email)))).size,
  )

  /** Every position a person holds in the Organization, top down. */
  const rolesOf = (email: string) =>
    places.value.flatMap((place) =>
      place.positions.filter((p) => p.members.some((m) => m.email === email)).map((p) => ({ role: p.role, place: place.name })),
    )

  /** Everyone in the Organization, each once, in the order they first appear from the top of the tree. */
  const directory = computed<Entry[]>(() => {
    const byEmail = new Map<string, Entry>()
    const visit = (place: Place, team?: string) => {
      const own = place.level === 'Team' ? place.name : team
      for (const position of place.positions) {
        for (const m of position.members) {
          const held: Holding = { role: position.role, place: place.name, level: place.level, team: own }
          const found = byEmail.get(m.email)
          if (found) {
            found.held.push(held)
            found.invited = found.invited && m.invited
          } else byEmail.set(m.email, { ...m, held: [held] })
        }
      }
      place.children.forEach((child) => visit(child, own))
    }
    visit(root)
    return [...byEmail.values()]
  })

  const adding = ref<{ place: Place; position: Position } | null>(null)
  const removed = ref<{ place: Place; position: Position; member: Member; index: number } | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  function startAdding(place: Place, position: Position) {
    adding.value = { place, position }
  }

  function add(picked: Person[]) {
    const target = adding.value?.position
    if (target) {
      const held = new Set(target.members.map((m) => m.email))
      target.members.push(
        ...picked.filter((p) => !held.has(p.email)).map((p) => ({ ...p, invited: true, how: 'Invited by you just now' })),
      )
    }
    adding.value = null
  }

  function removal(position: Position, m: Member): Removal {
    if (m.you || position.role === 'Org Owner') return 'none'
    if (position.role.endsWith('Owner') && position.members.length === 1) return 'lastOwner'
    return 'allowed'
  }

  function remove(place: Place, position: Position, m: Member) {
    const index = position.members.findIndex((x) => x.email === m.email)
    if (index < 0 || removal(position, m) !== 'allowed') return
    position.members.splice(index, 1)
    removed.value = { place, position, member: m, index }
    clearTimeout(timer)
    timer = setTimeout(() => (removed.value = null), UNDO_MS)
  }

  function undo() {
    const last = removed.value
    if (!last) return
    last.position.members.splice(last.index, 0, last.member)
    dismiss()
  }

  function dismiss() {
    clearTimeout(timer)
    removed.value = null
  }

  return { root, places, headcount, directory, rolesOf, adding, removed, startAdding, add, removal, remove, undo, dismiss }
}

export type OrgChart = ReturnType<typeof createOrgChart>

const KEY: InjectionKey<OrgChart> = Symbol('org-chart')

export function provideOrgChart(scale?: 'sample' | 'large'): OrgChart {
  const chart = createOrgChart(scale)
  provide(KEY, chart)
  return chart
}

export function useOrgChart(): OrgChart {
  const chart = inject(KEY)
  if (!chart) throw new Error('The org chart is only available inside OrgChartPage.')
  return chart
}
