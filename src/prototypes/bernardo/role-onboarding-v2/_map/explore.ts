// Explore: the whole sample district at once. It is the Brightwater story plus everyone the flows mention but don't
// follow: the Org Reviewer, the second Team Manager with the Cohort he created and its learners, and the district's
// second Team with its Team Owner and the Cohort she created (flow 3 reports on all of them), and the mixed roles
// from the world's `mixedRoles`: Ben facilitating at Northgate, and Sam's Independent Team outside the district, where
// Grace facilitates and Sofia learns. Its steps aren't a timeline (`timed: false`); they only say who awarded or
// created what, so the panel, the arrows and Who's who read Explore exactly as they read the story.

import {
  cohorts,
  district,
  FALL_COHORT,
  mixedRoles,
  people,
  PROGRAM,
  roles,
  WINTER_COHORT,
  type Person,
} from '../_wire/world'
import { brightwater, firstName, type MapNode, type Story } from './story'

/** A person's tile id: their key in the world's `people`. */
const idOf = (person: Person) =>
  (Object.keys(people) as (keyof typeof people)[]).find((key) => people[key] === person) ?? person.name

const winter = cohorts.find((cohort) => cohort.name === WINTER_COHORT)
const winterLearners = winter?.learners ?? 0
const fall = cohorts.find((cohort) => cohort.name === FALL_COHORT)
const fallLearners = fall?.learners ?? 0
const daniel = district.secondTeamManager
const northgate = district.secondTeam
const fallCreator = district.secondTeamCohort.createdBy
const lab = mixedRoles.labCohort

const extraNodes: MapNode[] = [
  { id: 'linda', role: 'orgReviewer', place: 'org', person: roles.orgReviewer.person },
  { id: 'daniel', role: 'teamManager', place: 'team', person: daniel.person },
  { id: 'winterLearners', role: 'learner', place: 'winter', count: winterLearners },
  { id: 'priya', role: 'teamOwner', place: 'northgate', person: northgate.owner },
  { id: 'fallLearners', role: 'learner', place: 'fall', count: fallLearners },
  { id: 'labLearners', role: 'learner', place: 'lab', count: lab.learners },
]

export const explore: Story = {
  id: 'explore',
  title: brightwater.title,
  timed: false,
  places: {
    ...brightwater.places,
    winter: { id: 'winter', name: WINTER_COHORT, kind: 'Cohort', parent: 'team', program: winter?.program ?? PROGRAM },
    northgate: { id: 'northgate', name: northgate.name, kind: 'Team', parent: 'org' },
    fall: { id: 'fall', name: FALL_COHORT, kind: 'Cohort', parent: 'northgate', program: fall?.program ?? PROGRAM },
    labTeam: { id: 'labTeam', name: mixedRoles.labTeam.name, kind: 'Team', parent: null, note: 'Independent' },
    lab: { id: 'lab', name: lab.name, kind: 'Cohort', parent: 'labTeam', program: lab.program },
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
    {
      kind: 'create',
      actor: idOf(fallCreator),
      place: 'fall',
      object: 'a Cohort',
      actorRole: 'cohortOwner',
      caption: `${firstName(fallCreator)} creates ${FALL_COHORT} and becomes its Cohort Owner`,
    },
    {
      kind: 'award',
      actor: idOf(fallCreator),
      node: 'fallLearners',
      role: 'learner',
      place: 'fall',
      verb: 'adds',
      byRole: 'cohortOwner',
      caption: `${firstName(fallCreator)} adds ${fallLearners} learners to ${FALL_COHORT}`,
    },
    // Mixed roles: people the district already has, holding a second role somewhere else.
    {
      kind: 'award',
      actor: idOf(mixedRoles.fallFacilitator.by),
      node: idOf(mixedRoles.fallFacilitator.person),
      role: 'facilitator',
      place: 'fall',
      verb: 'invites as',
      byRole: 'cohortOwner',
      caption: `${firstName(mixedRoles.fallFacilitator.by)} invites ${firstName(mixedRoles.fallFacilitator.person)} as a Facilitator of ${FALL_COHORT}`,
    },
    {
      kind: 'create',
      actor: idOf(mixedRoles.labTeam.createdBy),
      place: 'labTeam',
      object: 'an Independent Team',
      actorRole: 'teamOwner',
      caption: `${firstName(mixedRoles.labTeam.createdBy)} creates ${mixedRoles.labTeam.name}, an Independent Team, and becomes its Team Owner`,
    },
    {
      kind: 'create',
      actor: idOf(lab.createdBy),
      place: 'lab',
      object: 'a Cohort',
      actorRole: 'cohortOwner',
      caption: `${firstName(lab.createdBy)} creates ${lab.name} and becomes its Cohort Owner`,
    },
    {
      kind: 'award',
      actor: idOf(mixedRoles.labFacilitator.by),
      node: idOf(mixedRoles.labFacilitator.person),
      role: 'facilitator',
      place: 'lab',
      verb: 'invites as',
      byRole: 'cohortOwner',
      caption: `${firstName(mixedRoles.labFacilitator.by)} invites ${firstName(mixedRoles.labFacilitator.person)} as a Facilitator of ${lab.name}`,
    },
    {
      kind: 'award',
      actor: idOf(mixedRoles.labLearner.by),
      node: idOf(mixedRoles.labLearner.person),
      role: 'learner',
      place: 'lab',
      verb: 'adds as',
      byRole: 'cohortOwner',
      caption: `${firstName(mixedRoles.labLearner.by)} adds ${firstName(mixedRoles.labLearner.person)} to ${lab.name} as a learner`,
    },
    {
      kind: 'award',
      actor: idOf(lab.createdBy),
      node: 'labLearners',
      role: 'learner',
      place: 'lab',
      verb: 'adds',
      byRole: 'cohortOwner',
      caption: `${firstName(lab.createdBy)} adds ${lab.learners} learners to ${lab.name}`,
    },
  ],
  // The story's places, moved down to make room for Northgate High CS beside the Organization's top row; Winter Godot
  // Club sits beside Daniel, so his arrows stay short and clear of Spring Game Makers. Fall Godot Club sits beside
  // Priya, the way Winter Godot Club sits beside Daniel. Weekend Game Lab, outside the district, sits under it, below
  // Sam, who created it.
  positions: {
    alex: { col: 2, row: 4 },
    grace: { col: 14, row: 4 },
    marcus: { col: 28, row: 4 },
    linda: { col: 42, row: 4 },
    priya: { col: 64, row: 12 },
    fallLearners: { col: 77, row: 12 },
    ben: { col: 15, row: 27 },
    aisha: { col: 28, row: 27 },
    daniel: { col: 41, row: 27 },
    winterLearners: { col: 54, row: 27 },
    sofia: { col: 15, row: 40 },
    sam: { col: 28, row: 40 },
    learners: { col: 41, row: 40 },
    labLearners: { col: 44, row: 58 },
  },
}
