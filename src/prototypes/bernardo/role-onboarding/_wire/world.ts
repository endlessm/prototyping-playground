// One sample world for all nine flows: a school district Organization with one Team and one Cohort. Each person is
// awarded their role by the one before them, so the flows read as one chain from Endless Access down to the
// Facilitator. Roles and who awards them follow the system's context/educator-roles.md (Proposed, not built).
// Names, emails and the district are samples.

export type RoleKey =
  | 'orgOwner'
  | 'orgManager'
  | 'orgReviewer'
  | 'orgEducator'
  | 'teamOwner'
  | 'teamManager'
  | 'cohortOwner'
  | 'cohortManager'
  | 'facilitator'

export type Level = 'Organization' | 'Team' | 'Cohort'

/** The roles that create Teams inside the Organization: Org Educator, and the Org roles that include it. */
export const createsOrgTeams: RoleKey[] = ['orgOwner', 'orgManager', 'orgEducator']

export interface Person {
  name: string
  initials: string
  email: string
}

export const ORG = 'Brightwater Unified School District'
export const ORG_SHORT = 'Brightwater USD'
export const TEAM = 'Brightwater High Game Design'
export const COHORT = 'Spring Game Makers'
/** Daniel's own Team outside the district (flow 4): anyone can create one, in an Organization or not. */
export const INDIE_TEAM = 'Reyes Game Club'
/** The second Team in the district, created by Marcus in flow 2. */
export const ORG_TEAM_2 = 'Northgate High CS'
export const PROGRAM = 'Explore: Godot'

const person = (name: string, email: string): Person => ({
  name,
  initials: name
    .split(' ')
    .map((part) => part[0])
    .join(''),
  email,
})

export const people = {
  alex: person('Alex Kim', 'alex.kim@endlessaccess.org'),
  grace: person('Grace Holloway', 'grace.holloway@brightwaterschools.org'),
  marcus: person('Marcus Bell', 'marcus.bell@brightwaterschools.org'),
  linda: person('Linda Park', 'linda.park@brightwaterschools.org'),
  daniel: person('Daniel Reyes', 'daniel.reyes@brightwaterschools.org'),
  aisha: person('Aisha Rahman', 'aisha.rahman@brightwaterschools.org'),
  ben: person('Ben Carter', 'ben.carter@brightwaterschools.org'),
  sofia: person('Sofia Lopez', 'sofia.lopez@brightwaterschools.org'),
  tom: person('Tom Nguyen', 'tom.nguyen@brightwaterschools.org'),
  sam: person('Sam Rivera', 'sam.rivera@gmail.com'),
  priya: person('Priya Nair', 'priya.nair@brightwaterschools.org'),
  kevin: person('Kevin Moore', 'kevin.moore@brightwaterschools.org'),
}

export interface Role {
  key: RoleKey
  flow: number
  label: string
  level: Level
  /** The entity the role is held in. */
  entity: string
  /** Who receives the role in this flow. */
  person: Person
  /** Who awards it here, and the role that lets them. */
  by: Person
  byRole: string
  /** Every role that may award it, from the model. */
  awardedBy: string
  /** What the role can do, in plain words, for the invite and the accept page. */
  can: string[]
  /** The flow's folder; views are `<folder>/<n>.<step> <Name>`. */
  folder: string
}

export const roles: Record<RoleKey, Role> = {
  orgOwner: {
    key: 'orgOwner',
    flow: 1,
    label: 'Org Owner',
    level: 'Organization',
    entity: ORG,
    person: people.grace,
    by: people.alex,
    byRole: 'Endless Admin',
    awardedBy: 'Endless Admin',
    can: [
      'Add and remove Org Managers',
      'Add other Org Owners',
      'Everything an Org Manager can do',
    ],
    folder: '1 Org Owner',
  },
  orgManager: {
    key: 'orgManager',
    flow: 2,
    label: 'Org Manager',
    level: 'Organization',
    entity: ORG,
    person: people.marcus,
    by: people.grace,
    byRole: 'Org Owner',
    awardedBy: 'Org Owner',
    can: [
      'Add and remove Org Educators, Org Reviewers and Team Owners',
      'Create Teams',
      'Run every Team in the district as its Team Owner',
    ],
    folder: '2 Org Manager',
  },
  orgReviewer: {
    key: 'orgReviewer',
    flow: 3,
    label: 'Org Reviewer',
    level: 'Organization',
    entity: ORG,
    person: people.linda,
    by: people.marcus,
    byRole: 'Org Manager',
    awardedBy: 'Org Manager',
    can: ['See reports for every Team and Cohort in the district', 'View only: nothing you do changes a class'],
    folder: '3 Org Reviewer',
  },
  orgEducator: {
    key: 'orgEducator',
    flow: 4,
    label: 'Org Educator',
    level: 'Organization',
    entity: ORG,
    person: people.daniel,
    by: people.marcus,
    byRole: 'Org Manager',
    awardedBy: 'Org Manager',
    can: ['Create Teams in the district', 'Run the Teams you create as their Team Owner'],
    folder: '4 Org Educator',
  },
  teamOwner: {
    key: 'teamOwner',
    flow: 5,
    label: 'Team Owner',
    level: 'Team',
    entity: TEAM,
    person: people.aisha,
    by: people.daniel,
    byRole: 'Team Owner',
    awardedBy: 'Org Manager, a Team Owner of the same Team, or yourself when you create a Team',
    can: [
      'Add Team Owners, and add and remove Team Managers',
      'See reports from every Cohort in the Team',
      'Edit and archive the Team',
      'Run every Cohort in the Team as its Cohort Owner',
    ],
    folder: '5 Team Owner',
  },
  teamManager: {
    key: 'teamManager',
    flow: 6,
    label: 'Team Manager',
    level: 'Team',
    entity: TEAM,
    person: people.ben,
    by: people.aisha,
    byRole: 'Team Owner',
    awardedBy: 'Org Manager or a Team Owner of the same Team',
    can: ['Create Cohorts in the Team', 'Own every Cohort you create'],
    folder: '6 Team Manager',
  },
  cohortOwner: {
    key: 'cohortOwner',
    flow: 7,
    label: 'Cohort Owner',
    level: 'Cohort',
    entity: COHORT,
    person: people.sofia,
    by: people.ben,
    byRole: 'Cohort Owner',
    awardedBy: 'Team Owner, a Cohort Owner of the same Cohort, or yourself when you create a Cohort',
    can: [
      'Add Cohort Owners, and add and remove Cohort Managers',
      'Edit and archive the Cohort',
      'Everything a Cohort Manager can do',
    ],
    folder: '7 Cohort Owner',
  },
  cohortManager: {
    key: 'cohortManager',
    flow: 8,
    label: 'Cohort Manager',
    level: 'Cohort',
    entity: COHORT,
    person: people.tom,
    by: people.sofia,
    byRole: 'Cohort Owner',
    awardedBy: 'Cohort Owner',
    can: [
      'Add and remove Facilitators',
      "See the Cohort's reports",
      'Everything a Facilitator can do',
    ],
    folder: '8 Cohort Manager',
  },
  facilitator: {
    key: 'facilitator',
    flow: 9,
    label: 'Facilitator',
    level: 'Cohort',
    entity: COHORT,
    person: people.sam,
    by: people.tom,
    byRole: 'Cohort Manager',
    awardedBy: 'Cohort Manager',
    can: ['Run the sessions', "Review learners' tasks", 'Add and remove learners', 'Grant certificates'],
    folder: '9 Facilitator',
  },
}

export const roleList = Object.values(roles)

/** A view's path inside the prototype, from its flow and step: `view('orgOwner', 3)` → `1 Org Owner/1.3 Welcome`. */
export function view(key: RoleKey, step: number): string {
  const role = roles[key]
  return `${role.folder}/${role.flow}.${step} ${stepNames[key][step - 1]}`
}

export const stepNames: Record<RoleKey, string[]> = {
  orgOwner: ['Invite', 'Accept', 'Welcome', 'Add Org Managers', 'Managers Invited'],
  orgManager: ['Invite', 'Accept', 'Welcome', 'Add Educators', 'Educators Invited', 'Create a Team', 'Team Created'],
  orgReviewer: ['Invite', 'Accept', 'Welcome', 'Team Report'],
  orgEducator: ['Invite', 'Accept', 'Welcome', 'Create a Team', 'New Team', 'Create an Independent Team', 'Independent Team'],
  teamOwner: ['Invite', 'Accept', 'Welcome', 'Add Team Managers', 'Managers Invited'],
  teamManager: ['Invite', 'Accept', 'Welcome', 'Create a Cohort', 'New Cohort'],
  cohortOwner: ['Invite', 'Accept', 'Welcome', 'Add Cohort Managers', 'Managers Invited'],
  cohortManager: ['Invite', 'Accept', 'Welcome', 'Invite Facilitators', 'Facilitators Invited'],
  facilitator: ['Invite', 'Accept', 'Welcome', 'Add Learners', 'Learners Joined'],
}

/** The first things each role is asked to do on its welcome; the first one leads to the flow's task screen. */
export const firstSteps: Record<RoleKey, string[]> = {
  orgOwner: ['Add Org Managers to run the district day to day', 'Check the Programs the district can run'],
  orgManager: ['Add the educators who will create Teams', 'Add Org Reviewers who follow the reports', 'Create a Team'],
  orgReviewer: ['Open a Team’s report'],
  orgEducator: ['Create your first Team'],
  teamOwner: ['Add Team Managers who will create Cohorts', 'Look over the Team’s Cohorts'],
  teamManager: ['Create your first Cohort'],
  cohortOwner: ['Add a Cohort Manager to help run the class', 'Check the start date and seats'],
  cohortManager: ['Invite the Facilitators who will run the sessions'],
  facilitator: ['Share the join link with your learners', 'Look over Session 1'],
}

// Where each person holds roles when their flow ends: the switcher in the top bar lists them, one role per place.
export const places: Record<RoleKey, { name: string; role: string; level: Level; independent?: boolean }[]> = {
  orgOwner: [{ name: ORG, role: 'Org Owner', level: 'Organization' }],
  orgManager: [{ name: ORG, role: 'Org Manager', level: 'Organization' }],
  orgReviewer: [{ name: ORG, role: 'Org Reviewer', level: 'Organization' }],
  orgEducator: [{ name: ORG, role: 'Org Educator', level: 'Organization' }],
  teamOwner: [{ name: TEAM, role: 'Team Owner', level: 'Team' }],
  teamManager: [{ name: TEAM, role: 'Team Manager', level: 'Team' }],
  cohortOwner: [{ name: COHORT, role: 'Cohort Owner', level: 'Cohort' }],
  cohortManager: [{ name: COHORT, role: 'Cohort Manager', level: 'Cohort' }],
  facilitator: [{ name: COHORT, role: 'Facilitator', level: 'Cohort' }],
}

// Teams in the district, once it is under way (flows 3 and 5 onward). Northgate is another school's team.
export const teams = [
  { name: TEAM, owners: ['Daniel Reyes', 'Aisha Rahman'], cohorts: 2, learners: 41 },
  { name: 'Northgate High CS', owners: ['Priya Nair'], cohorts: 2, learners: 46 },
]

// Cohorts in Brightwater High Game Design. Spring Game Makers is the one flows 6 to 9 follow.
export const cohorts = [
  {
    name: 'Winter Godot Club',
    program: PROGRAM,
    owners: ['Daniel Reyes'],
    status: 'Session 6 of 10',
    learners: 17,
  },
  {
    name: COHORT,
    program: PROGRAM,
    owners: ['Ben Carter', 'Sofia Lopez'],
    status: 'Starts Mar 2, 2027',
    learners: 0,
  },
]

export const cohort = {
  name: COHORT,
  program: PROGRAM,
  starts: 'Mar 2, 2027',
  seats: 24,
  code: 'R4T8M2QX',
  linkExpires: 'Mar 9, 2027',
}

// Explore: Godot's ten sessions by their driving questions (programs.md), dated weekly from the start.
export const sessions = [
  { n: 1, date: 'Mar 2', question: 'Why do we play games? Why do we mod them?' },
  { n: 2, date: 'Mar 9', question: 'Should game makers also be game players?' },
  { n: 3, date: 'Mar 16', question: 'How do game makers create a fun and engaging level?' },
  { n: 4, date: 'Mar 23', question: 'What helps an idea move from concept to something real?' },
  { n: 5, date: 'Mar 30', question: 'What makes a level good? What makes it great?' },
  { n: 6, date: 'Apr 6', question: 'What makes a level good? What makes it great?' },
  { n: 7, date: 'Apr 13', question: 'What makes a level good? What makes it great?' },
  { n: 8, date: 'Apr 20', question: 'What makes a level good? What makes it great?' },
  { n: 9, date: 'Apr 27', question: 'What makes a level "polished?"' },
  { n: 10, date: 'May 4', question: 'Where do you go from here?' },
]

// Learners who followed the join link (flow 9's last screen). Samples.
export const learners = [
  { name: 'Jaylen Brooks', email: 'jbrooks27@brightwaterschools.org', joined: 'Feb 18' },
  { name: 'Mia Chen', email: 'mchen27@brightwaterschools.org', joined: 'Feb 18' },
  { name: 'Diego Morales', email: 'dmorales28@brightwaterschools.org', joined: 'Feb 19' },
  { name: 'Ava Thompson', email: 'athompson27@brightwaterschools.org', joined: 'Feb 20' },
  { name: 'Noah Patel', email: 'npatel28@brightwaterschools.org', joined: 'Feb 21' },
]
