// Explore: the whole sample district at once. It is the Brightwater story plus everyone the flows mention but don't
// follow: the Org Reviewer, the second Team Manager with the Cohort he created and its learners, and the district's
// second Team with its Team Owner. Its steps aren't a timeline (`timed: false`); they only say who awarded or created
// what, so the panel, the arrows and Who's who read Explore exactly as they read the story.

import { cohorts, district, people, PROGRAM, roles, WINTER_COHORT, type Person } from '../_wire/world'
import { brightwater, firstName, type MapNode, type Story } from './story'

/** A person's tile id: their key in the world's `people`. */
const idOf = (person: Person) =>
  (Object.keys(people) as (keyof typeof people)[]).find((key) => people[key] === person) ?? person.name

const winter = cohorts.find((cohort) => cohort.name === WINTER_COHORT)
const winterLearners = winter?.learners ?? 0
const daniel = district.secondTeamManager
const northgate = district.secondTeam

const extraNodes: MapNode[] = [
  { id: 'linda', role: 'orgReviewer', place: 'org', person: roles.orgReviewer.person },
  { id: 'daniel', role: 'teamManager', place: 'team', person: daniel.person },
  { id: 'winterLearners', role: 'learner', place: 'winter', count: winterLearners },
  { id: 'priya', role: 'teamOwner', place: 'northgate', person: northgate.owner },
]

export const explore: Story = {
  id: 'explore',
  title: brightwater.title,
  timed: false,
  places: {
    ...brightwater.places,
    winter: { id: 'winter', name: WINTER_COHORT, kind: 'Cohort', parent: 'team', program: winter?.program ?? PROGRAM },
    northgate: { id: 'northgate', name: northgate.name, kind: 'Team', parent: 'org' },
  },
  nodes: { ...brightwater.nodes, ...Object.fromEntries(extraNodes.map((node) => [node.id, node])) },
  steps: [
    ...brightwater.steps,
    {
      kind: 'award',
      actor: idOf(roles.orgReviewer.by),
      node: 'linda',
      role: 'orgReviewer',
      place: 'org',
      verb: 'invites as',
      caption: `${firstName(roles.orgReviewer.by)} invites ${firstName(roles.orgReviewer.person)} as Org Reviewer`,
    },
    {
      kind: 'award',
      actor: idOf(daniel.by),
      node: 'daniel',
      role: 'teamManager',
      place: 'team',
      verb: 'invites as',
      caption: `${firstName(daniel.by)} invites ${firstName(daniel.person)} as a second Team Manager`,
    },
    {
      kind: 'create',
      actor: 'daniel',
      place: 'winter',
      object: 'a Cohort',
      actorRole: 'cohortOwner',
      caption: `${firstName(daniel.person)} creates ${WINTER_COHORT} and becomes its Cohort Owner`,
    },
    {
      kind: 'award',
      actor: 'daniel',
      node: 'winterLearners',
      role: 'learner',
      place: 'winter',
      verb: 'adds',
      byRole: 'cohortOwner',
      caption: `${firstName(daniel.person)} adds ${winterLearners} learners to ${WINTER_COHORT}`,
    },
    {
      kind: 'create',
      actor: idOf(northgate.createdBy),
      place: 'northgate',
      object: 'a Team',
      caption: `${firstName(northgate.createdBy)} creates the Team ${northgate.name}`,
    },
    {
      kind: 'award',
      actor: idOf(northgate.ownerBy),
      node: 'priya',
      role: 'teamOwner',
      place: 'northgate',
      verb: 'invites as',
      caption: `${firstName(northgate.ownerBy)} invites ${firstName(northgate.owner)} as Team Owner`,
    },
  ],
  // The story's places, moved down to make room for Northgate High CS beside the Organization's top row; Winter Godot
  // Club sits beside Daniel, so his arrows stay short and clear of Spring Game Makers.
  positions: {
    alex: { col: 2, row: 4 },
    grace: { col: 14, row: 4 },
    marcus: { col: 28, row: 4 },
    linda: { col: 42, row: 4 },
    priya: { col: 56, row: 14 },
    ben: { col: 15, row: 27 },
    aisha: { col: 28, row: 27 },
    daniel: { col: 41, row: 27 },
    winterLearners: { col: 54, row: 27 },
    sofia: { col: 15, row: 40 },
    sam: { col: 28, row: 40 },
    learners: { col: 41, row: 40 },
  },
}
