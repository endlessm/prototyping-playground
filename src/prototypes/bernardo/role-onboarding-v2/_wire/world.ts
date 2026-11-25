// One sample world for all seven flows: a school district Organization with one Team and its Cohorts. Each person is
// awarded their role by the one before them, so the flows read as one chain from Endless Access down to the
// Facilitator. Roles follow the simpler model Bernardo and Joana settled on 12 November 2026 (Product Check-in): no
// Org Educator and no Cohort Manager. It is Proposed and not built; v1 of this prototype keeps the nine-role model.
// Names, emails and the district are samples.

export type RoleKey = 'orgOwner' | 'orgManager' | 'orgReviewer' | 'teamOwner' | 'teamManager' | 'cohortOwner' | 'facilitator'

export type Level = 'Organization' | 'Team' | 'Cohort'

/** The roles that create Teams inside the Organization. */
export const createsOrgTeams: RoleKey[] = ['orgOwner', 'orgManager']

export interface Person {
  name: string
  initials: string
  email: string
  /** A face from Unsplash, for the Hi-Fi's avatars; someone without one shows their initials. */
  photo?: string
}

export const ORG = 'Brightwater Unified School District'
export const ORG_SHORT = 'Brightwater USD'
/** What kind of Organization it is, in the words its people use. */
export const ORG_KIND = 'school district'
export const TEAM = 'Brightwater High Game Design'
export const COHORT = 'Spring Game Makers'
/** An Independent Team, the default name when someone creates one from the place switcher. */
export const INDIE_TEAM = 'Game Club'
export const PROGRAM = 'Explore: Godot'
/** The district's second Team, another school's (flow 3 reports on it). */
export const NORTHGATE = 'Northgate High CS'
/** The other Cohort in Brightwater High Game Design, which Daniel created (flow 5 shows it). */
export const WINTER_COHORT = 'Winter Godot Club'
/** Northgate High CS's Cohort, which Priya created and has already finished (flow 3 reports on it). */
export const FALL_COHORT = 'Fall Godot Club'
/** Sam's Independent Team, outside any Organization, and its one Cohort (see `mixedRoles`). */
export const LAB_TEAM = 'Weekend Game Lab'
export const LAB_COHORT = 'Saturday Godot Jam'

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=96&h=96&fit=crop&crop=faces&q=80`

const person = (name: string, email: string, photo?: string): Person => ({
  name,
  initials: name
    .split(' ')
    .map((part) => part[0])
    .join(''),
  email,
  ...(photo ? { photo: unsplash(photo) } : {}),
})

export const people = {
  alex: person('Alex Kim', 'alex.kim@endlessaccess.org', '1507003211169-0a1dd7228f2d'),
  grace: person('Grace Holloway', 'grace.holloway@brightwaterschools.org', '1508214751196-bcfd4ca60f91'),
  marcus: person('Marcus Bell', 'marcus.bell@brightwaterschools.org', '1566492031773-4f4e44671857'),
  linda: person('Linda Park', 'linda.park@brightwaterschools.org', '1534528741775-53994a69daeb'),
  daniel: person('Daniel Reyes', 'daniel.reyes@brightwaterschools.org', '1557862921-37829c790f19'),
  aisha: person('Aisha Rahman', 'aisha.rahman@brightwaterschools.org', '1531123897727-8f129e1688ce'),
  ben: person('Ben Carter', 'ben.carter@brightwaterschools.org', '1599566150163-29194dcaad36'),
  sofia: person('Sofia Lopez', 'sofia.lopez@brightwaterschools.org', '1544725176-7c40e5a71c5e'),
  sam: person('Sam Rivera', 'sam.rivera@gmail.com'),
  priya: person('Priya Nair', 'priya.nair@brightwaterschools.org', '1607746882042-944635dfe10e'),
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
      'Add and remove Org Reviewers and Team Owners',
      'Create Teams in the district',
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
  teamOwner: {
    key: 'teamOwner',
    flow: 4,
    label: 'Team Owner',
    level: 'Team',
    entity: TEAM,
    person: people.aisha,
    by: people.marcus,
    byRole: 'Org Manager',
    awardedBy: 'Org Manager, a Team Owner of the same Team, or yourself when you create a Team',
    can: [
      'Add Team Owners, and add and remove Team Managers',
      'Remove Cohort Owners',
      'See reports from every Cohort in the Team',
      'Edit and archive the Team',
      'Everything a Team Manager can do',
    ],
    folder: '4 Team Owner',
  },
  teamManager: {
    key: 'teamManager',
    flow: 5,
    label: 'Team Manager',
    level: 'Team',
    entity: TEAM,
    person: people.ben,
    by: people.aisha,
    byRole: 'Team Owner',
    awardedBy: 'Org Manager or a Team Owner of the same Team',
    can: [
      'Create Cohorts in the Team, and own the ones you create',
      'See every Cohort in the Team and run it as its Cohort Owner',
    ],
    folder: '5 Team Manager',
  },
  cohortOwner: {
    key: 'cohortOwner',
    flow: 6,
    label: 'Cohort Owner',
    level: 'Cohort',
    entity: COHORT,
    person: people.sofia,
    by: people.ben,
    byRole: 'Cohort Owner',
    awardedBy: 'Team Manager, Team Owner, a Cohort Owner of the same Cohort, or yourself when you create a Cohort',
    can: [
      'Add Cohort Owners',
      'Add and remove Facilitators',
      'Edit, start and archive the Cohort',
      "See the Cohort's reports",
      'Everything a Facilitator can do',
    ],
    folder: '6 Cohort Owner',
  },
  facilitator: {
    key: 'facilitator',
    flow: 7,
    label: 'Facilitator',
    level: 'Cohort',
    entity: COHORT,
    person: people.sam,
    by: people.sofia,
    byRole: 'Cohort Owner',
    awardedBy: 'Cohort Owner, or a Team Manager or Team Owner as Cohort Owner',
    can: ['Run the sessions', "Review learners' tasks", 'Add and remove learners', 'Grant certificates'],
    folder: '7 Facilitator',
  },
}

export const roleList = Object.values(roles)

/**
 * The people an add modal lists for a role: people at the district who already have an Endless Access account
 * (school email). Proposal: how an Organization knows its people is still open. The modal leaves out whoever holds
 * the role already; anyone else is invited by email. Facilitators often come from outside, as Sam does.
 */
const pool: Record<string, Person[]> = {
  'Org Owner': [people.marcus, people.linda, people.kevin],
  'Org Manager': [people.marcus, people.linda, people.kevin],
  'Org Reviewer': [people.linda, people.kevin, people.priya],
  'Team Owner': [people.daniel, people.kevin, people.ben],
  'Team Manager': [people.ben, people.daniel, people.kevin],
  'Cohort Owner': [people.sofia, people.daniel, people.kevin],
  Facilitator: [people.daniel, people.kevin, people.aisha],
}

export const candidatesFor = (role: string): Person[] => pool[role] ?? []

/**
 * The Endless Access staff role above every Organization. It has no onboarding flow; the Roles Map shows it at the top
 * of the chain. What it can do follows the permissions model: only an Endless Admin awards or strips the Org Owner role
 * and archives an Organization.
 */
export const endlessAdmin = {
  label: 'Endless Admin',
  person: people.alex,
  can: [
    'Set up Organizations on Endless Access',
    'Award the Org Owner role',
    'Strip the Org Owner role',
    'Archive an Organization',
  ],
}

// Every Lo-Fi view's path, written out in full: the studio rewrites literal paths when views move or folders are
// renamed, but never paths built from parts, so a rename keeps every link working.
const lofiViews: Record<RoleKey, string[]> = {
  orgOwner: [
    'Lo-Fi/1 Org Owner/1.1 Invite',
    'Lo-Fi/1 Org Owner/1.2 Accept',
    'Lo-Fi/1 Org Owner/1.3 Welcome',
    'Lo-Fi/1 Org Owner/1.4 Add Org Managers',
    'Lo-Fi/1 Org Owner/1.5 Managers Invited',
  ],
  orgManager: [
    'Lo-Fi/2 Org Manager/2.1 Invite',
    'Lo-Fi/2 Org Manager/2.2 Accept',
    'Lo-Fi/2 Org Manager/2.3 Welcome',
    'Lo-Fi/2 Org Manager/2.4 Add Org Reviewers',
    'Lo-Fi/2 Org Manager/2.5 Reviewers Invited',
    'Lo-Fi/2 Org Manager/2.6 Create a Team',
    'Lo-Fi/2 Org Manager/2.7 Team Created',
  ],
  orgReviewer: [
    'Lo-Fi/3 Org Reviewer/3.1 Invite',
    'Lo-Fi/3 Org Reviewer/3.2 Accept',
    'Lo-Fi/3 Org Reviewer/3.3 Welcome',
    'Lo-Fi/3 Org Reviewer/3.4 Team Report',
  ],
  teamOwner: [
    'Lo-Fi/4 Team Owner/4.1 Invite',
    'Lo-Fi/4 Team Owner/4.2 Accept',
    'Lo-Fi/4 Team Owner/4.3 Welcome',
    'Lo-Fi/4 Team Owner/4.4 Add Team Managers',
    'Lo-Fi/4 Team Owner/4.5 Managers Invited',
  ],
  teamManager: [
    'Lo-Fi/5 Team Manager/5.1 Invite',
    'Lo-Fi/5 Team Manager/5.2 Accept',
    'Lo-Fi/5 Team Manager/5.3 Welcome',
    'Lo-Fi/5 Team Manager/5.4 Create a Cohort',
    'Lo-Fi/5 Team Manager/5.5 New Cohort',
  ],
  cohortOwner: [
    'Lo-Fi/6 Cohort Owner/6.1 Invite',
    'Lo-Fi/6 Cohort Owner/6.2 Accept',
    'Lo-Fi/6 Cohort Owner/6.3 Welcome',
    'Lo-Fi/6 Cohort Owner/6.4 Invite Facilitators',
    'Lo-Fi/6 Cohort Owner/6.5 Facilitators Invited',
  ],
  facilitator: [
    'Lo-Fi/7 Facilitator/7.1 Invite',
    'Lo-Fi/7 Facilitator/7.2 Accept',
    'Lo-Fi/7 Facilitator/7.3 Welcome',
    'Lo-Fi/7 Facilitator/7.4 Add Learners',
    'Lo-Fi/7 Facilitator/7.5 Learners Joined',
  ],
}

/** A Lo-Fi view's path inside the prototype: `view('orgOwner', 3)` → `Lo-Fi/1 Org Owner/1.3 Welcome`. */
export const view = (key: RoleKey, n: number): string => lofiViews[key][n - 1]!

/** The first things each role is asked to do on its welcome; the first one leads to the flow's task screen. */
// What each role is for, in a line, for the welcome card under its title.
export const roleBriefs: Record<RoleKey, string> = {
  orgOwner:
    'As an Org Owner you lead the district on Endless Access: you choose who runs it with you, and you can do everything an Org Manager does.',
  orgManager:
    'As an Org Manager you run the district day to day: you create its Teams, name their Team Owners and choose who follows the reports.',
  orgReviewer:
    'As an Org Reviewer you follow how every Team and Cohort in the district is doing. You see the reports; nothing you do changes a class.',
  teamOwner:
    'As a Team Owner you lead the Team: you choose its Team Managers, follow every Cohort’s report and can run any Cohort yourself.',
  teamManager: 'As a Team Manager you create the Team’s Cohorts and can run any of them as its Cohort Owner.',
  cohortOwner:
    'As a Cohort Owner you set the Cohort up, its dates and its seats, and choose the Facilitators who run its sessions.',
  facilitator: 'As a Facilitator you run the sessions, review your learners’ tasks and grant their certificates.',
}

// Steps the person may skip: the card marks them Optional and is done without them.
export const optionalSteps: Partial<Record<RoleKey, string[]>> = { orgOwner: ['Create a Team yourself'] }

export const firstSteps: Record<RoleKey, string[]> = {
  orgOwner: ['Add Org Managers to run the district day to day', 'Create a Team yourself'],
  orgManager: ['Add Org Reviewers who follow the reports', 'Create a Team and name its Team Owner'],
  orgReviewer: ['Open a Team’s report'],
  teamOwner: ['Add Team Managers who will create Cohorts', 'Create the first Cohort yourself, if you run it'],
  teamManager: ['Create your first Cohort', 'Look over the Team’s Cohorts'],
  cohortOwner: ['Invite the Facilitators who will run the sessions', 'Check the start date and seats'],
  facilitator: ['Share the join link with your learners', 'Look over Session 1'],
}

/**
 * Roles are awarded per place, so one account can hold several, in different places and at different levels. Sam
 * ran an Independent Team before the district found him: he created Weekend Game Lab and its Cohort, Saturday Godot
 * Jam, where Grace volunteers as a Facilitator and Sofia learned Godot as a learner. That is how Sofia knew to invite
 * Sam to Spring Game Makers. Inside the district, Priya made Ben a Facilitator of Northgate's Fall Godot Club, a
 * Cohort outside the Team he manages.
 */
export const mixedRoles = {
  labTeam: { name: LAB_TEAM, createdBy: people.sam },
  labCohort: { name: LAB_COHORT, program: PROGRAM, createdBy: people.sam, learners: 6 },
  labFacilitator: { person: people.grace, by: people.sam },
  labLearner: { person: people.sofia, by: people.sam },
  fallFacilitator: { person: people.ben, by: people.priya },
}

export interface Place {
  name: string
  role: string
  level: Level
  independent?: boolean
  /** A place where the person learns rather than teaches: it stays out of the sidebar's Teach group. */
  learner?: boolean
}

// Where each person holds roles when their flow ends: the switcher in the top bar lists them, one role per place.
// The roles from `mixedRoles` come after the one the flow is about.
export const places: Record<RoleKey, Place[]> = {
  orgOwner: [
    { name: ORG, role: 'Org Owner', level: 'Organization' },
    { name: LAB_COHORT, role: 'Facilitator', level: 'Cohort', independent: true },
  ],
  orgManager: [{ name: ORG, role: 'Org Manager', level: 'Organization' }],
  orgReviewer: [{ name: ORG, role: 'Org Reviewer', level: 'Organization' }],
  teamOwner: [{ name: TEAM, role: 'Team Owner', level: 'Team' }],
  teamManager: [
    { name: TEAM, role: 'Team Manager', level: 'Team' },
    { name: FALL_COHORT, role: 'Facilitator', level: 'Cohort' },
  ],
  cohortOwner: [
    { name: COHORT, role: 'Cohort Owner', level: 'Cohort' },
    { name: LAB_COHORT, role: 'Learner', level: 'Cohort', independent: true, learner: true },
  ],
  facilitator: [
    { name: COHORT, role: 'Facilitator', level: 'Cohort' },
    { name: LAB_TEAM, role: 'Team Owner', level: 'Team', independent: true },
  ],
}

// Who brought in the people the flows only mention, as the flows imply: Aisha invited Daniel with Ben (flow 4's
// People list); Marcus created Northgate High CS and made Priya its Team Owner, as an Org Manager does for Aisha's
// Team in flow 2; Daniel created Winter Godot Club and Priya created Fall Godot Club, and each, as its Cohort Owner,
// added its learners.
export const district = {
  secondTeamManager: { person: people.daniel, by: people.aisha },
  secondTeam: { name: NORTHGATE, createdBy: people.marcus, owner: people.priya, ownerBy: people.marcus },
  secondTeamCohort: { name: FALL_COHORT, createdBy: people.priya },
}

// Every Cohort in the district once the flows are done: Spring Game Makers is the one flows 5 to 7 follow, with
// Sam's learners in it. The Team page, the Org Reviewer's reports and the Roles Map's Explore all read this list.
export const cohorts = [
  {
    name: WINTER_COHORT,
    team: TEAM,
    program: PROGRAM,
    owners: ['Daniel Reyes'],
    status: 'Session 6 of 10',
    learners: 17,
    progress: 55,
    certificates: 0,
  },
  {
    name: COHORT,
    team: TEAM,
    program: PROGRAM,
    owners: ['Ben Carter', 'Sofia Lopez'],
    status: 'Starts Mar 2, 2027',
    learners: 5,
    progress: 0,
    certificates: 0,
  },
  {
    name: FALL_COHORT,
    team: NORTHGATE,
    program: PROGRAM,
    owners: ['Priya Nair'],
    status: 'Finished Dec 8',
    learners: 18,
    progress: 100,
    certificates: 12,
  },
]

// Teams in the district, with their Cohorts' totals (flow 3 reports on both). Northgate is another school's team.
export const teams = [
  { name: TEAM, owners: ['Aisha Rahman'] },
  { name: NORTHGATE, owners: ['Priya Nair'] },
].map((team) => {
  const own = cohorts.filter((c) => c.team === team.name)
  const learnerCount = own.reduce((sum, c) => sum + c.learners, 0)
  return {
    ...team,
    cohorts: own.length,
    learners: learnerCount,
    progress: learnerCount ? Math.round(own.reduce((sum, c) => sum + c.progress * c.learners, 0) / learnerCount) : 0,
    certificates: own.reduce((sum, c) => sum + c.certificates, 0),
  }
})

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

// Learners who followed the join link (flow 7's last screen). Samples.
export const learners = [
  { name: 'Jaylen Brooks', email: 'jbrooks27@brightwaterschools.org', joined: 'Feb 18' },
  { name: 'Mia Chen', email: 'mchen27@brightwaterschools.org', joined: 'Feb 18' },
  { name: 'Diego Morales', email: 'dmorales28@brightwaterschools.org', joined: 'Feb 19' },
  { name: 'Ava Thompson', email: 'athompson27@brightwaterschools.org', joined: 'Feb 20' },
  { name: 'Noah Patel', email: 'npatel28@brightwaterschools.org', joined: 'Feb 21' },
]
