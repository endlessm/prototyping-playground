// The sample team behind flows 3 and 5. A Team has one Team Leader, who sees every cohort and runs Team Settings,
// and Team Members, who create cohorts and see only the ones they created or were added to. Inside a cohort,
// Managers are the team members with access (its creator adds the others), Facilitators run it without joining
// the team, and Learners learn.

export type Viewer = 'leader' | 'member'

export const TEAM = 'Okafor Homeschool Co-op'

export const members = [
  { name: 'Maya Okafor', initials: 'MO', email: 'maya.okafor@gmail.com', role: 'Team Leader' },
  { name: 'Dana Fischer', initials: 'DF', email: 'dana.fischer@outlook.com', role: 'Team Member' },
  { name: 'Luis Ortega', initials: 'LO', email: 'luis.ortega@gmail.com', role: 'Team Member' },
  { name: 'Priya Nair', initials: 'PN', email: 'priya.nair@icloud.com', role: 'Team Member' },
]

/** Where a cohort is in its life: not started yet, under way, or over. */
export type Stage = 'upcoming' | 'running' | 'finished'

export interface Cohort {
  name: string
  program: string
  starts: string
  seats: number
  /** Learners in it: joined so far, or who took part once it has started. */
  joined: number
  managers: string[]
  to?: string
  /** Upcoming when left out. */
  stage?: Stage
  /** Created in the last few days, so it gets a "Just created" badge. */
  justCreated?: boolean
  /** Running: how far the cohort has got, such as Session 3 of 10. */
  progress?: { at: number; of: number; unit: string }
  /** Running: learners still taking part. */
  active?: number
  /** Finished: when it ended, and how its learners came out. */
  ended?: string
  certified?: number
  stopped?: number
  /** The join link's code (random letters and numbers), and the day it stops working: a week after the start. */
  code?: string
  linkExpires?: string
  facilitators?: Facilitator[]
}

export interface Facilitator {
  name: string
  initials: string
  email: string
  /** Hasn't accepted the invite yet. */
  invited?: boolean
}

export const samRivera: Facilitator = { name: 'Sam Rivera', initials: 'SR', email: 'sam.rivera@gmail.com' }

export const springGameMakers: Cohort = {
  name: 'Spring Game Makers',
  program: 'Explore: Godot',
  starts: 'Mar 2, 2027',
  seats: 5,
  joined: 3,
  managers: ['Maya Okafor'],
  to: 'Hi-Fi/5 Cohort/5.5 Learners Joined',
  code: 'H7K2Q9XM',
  linkExpires: 'Mar 9, 2027',
  facilitators: [{ ...samRivera, invited: true }],
}

// Dana's own cohort: Maya sees it as Team Leader; nobody else in the team does until Dana adds them.
export const godotAfterSchool: Cohort = {
  name: 'Godot After School',
  program: 'Explore: Godot',
  starts: 'Apr 6, 2027',
  seats: 12,
  joined: 0,
  managers: ['Dana Fischer'],
  code: 'B3N8R5TW',
  linkExpires: 'Apr 13, 2027',
}

export const learners: { name: string; status: string; tone?: 'solid' | 'outline' }[] = [
  { name: 'Ada Okafor', status: 'Joined', tone: 'solid' },
  { name: 'Tobi Okafor', status: 'Joined', tone: 'solid' },
  { name: 'Lena Fischer', status: 'Joined', tone: 'solid' },
  { name: 'Priya Raman', status: 'Invited' },
  { name: 'Marcus Hill', status: 'Email bounced', tone: 'outline' },
]

// The same team months on, as of Mar 20, 2027: cohorts just created, starting soon, running and finished. Of the
// finished ones' learners, some earned the certificate and some stopped partway through. One cohort per stage
// opens its own page (5.7 to 5.9).
export const godotStartingSoon: Cohort = { ...godotAfterSchool, joined: 7, to: 'Hi-Fi/5 Cohort/5.7 Starting Soon' }

export const springRunning: Cohort = {
  ...springGameMakers,
  joined: 5,
  stage: 'running',
  progress: { at: 3, of: 10, unit: 'Session' },
  active: 4,
  to: 'Hi-Fi/5 Cohort/5.8 Running',
  facilitators: [samRivera],
}

export const fallFinished: Cohort = {
  name: 'Fall Game Makers',
  program: 'Explore: Godot',
  starts: 'Sep 14, 2026',
  seats: 12,
  joined: 12,
  managers: ['Maya Okafor'],
  stage: 'finished',
  ended: 'Dec 14, 2026',
  certified: 9,
  stopped: 3,
  progress: { at: 10, of: 10, unit: 'Session' },
  to: 'Hi-Fi/5 Cohort/5.9 Finished',
  code: 'M6P2Z8KD',
  linkExpires: 'Sep 21, 2026',
  facilitators: [samRivera],
}

export const cohortsOverTime: Cohort[] = [
  godotStartingSoon,
  {
    name: 'Summer Game Jam',
    program: 'Explore: Threadbare',
    starts: 'Jun 7, 2027',
    seats: 12,
    joined: 0,
    managers: ['Maya Okafor'],
    justCreated: true,
  },
  springRunning,
  {
    name: 'Core Crew',
    program: 'Core: Threadbare',
    starts: 'Jan 11, 2027',
    seats: 10,
    joined: 10,
    managers: ['Maya Okafor', 'Dana Fischer'],
    stage: 'running',
    progress: { at: 9, of: 18, unit: 'Session' },
    active: 8,
  },
  {
    name: 'Winter Pixel Lab',
    program: 'Explore: Threadbare',
    starts: 'Nov 30, 2026',
    seats: 8,
    joined: 8,
    managers: ['Maya Okafor'],
    stage: 'finished',
    ended: 'Feb 1, 2027',
    certified: 4,
    stopped: 4,
  },
  fallFinished,
  {
    name: 'Godot Starter Club',
    program: 'Explore: Godot',
    starts: 'Sep 21, 2026',
    seats: 8,
    joined: 8,
    managers: ['Dana Fischer'],
    stage: 'finished',
    ended: 'Nov 20, 2026',
    certified: 6,
    stopped: 2,
  },
]

// Starting soon: who's in before the first session, and when each one used the link.
export const godotLearners: { name: string; email: string; joined: string }[] = [
  { name: 'Noah Kim', email: 'noah.kim@gmail.com', joined: 'Mar 8, 2027' },
  { name: 'Isla Brooks', email: 'isla.brooks@outlook.com', joined: 'Mar 8, 2027' },
  { name: 'Mateo Cruz', email: 'mateo.cruz@gmail.com', joined: 'Mar 11, 2027' },
  { name: 'Zara Ahmed', email: 'zara.ahmed@icloud.com', joined: 'Mar 12, 2027' },
  { name: 'Eli Novak', email: 'eli.novak@gmail.com', joined: 'Mar 15, 2027' },
  { name: 'Ruby Chen', email: 'ruby.chen@gmail.com', joined: 'Mar 18, 2027' },
  { name: 'Sami Haddad', email: 'sami.haddad@yahoo.com', joined: 'Mar 19, 2027' },
]

/** Where a running cohort's learner is: sessions unlock as each learner goes, so they can be ahead or behind. */
export type Pace = 'ahead' | 'on track' | 'behind' | 'inactive'

// Running, as of Mar 20, 2027: the session each learner is on and when they last worked on it.
export const springProgress: { name: string; at: number; lastActive: string; pace: Pace }[] = [
  { name: 'Ada Okafor', at: 4, lastActive: 'Today', pace: 'ahead' },
  { name: 'Tobi Okafor', at: 3, lastActive: 'Yesterday', pace: 'on track' },
  { name: 'Lena Fischer', at: 3, lastActive: 'Mar 18', pace: 'on track' },
  { name: 'Priya Raman', at: 2, lastActive: 'Mar 17', pace: 'behind' },
  { name: 'Marcus Hill', at: 1, lastActive: 'Mar 6', pace: 'inactive' },
]

// Explore: Godot's 10 sessions, each named by the driving question it opens with (the program's decks). Sessions 5 to 8
// share one question while learners build and playtest their level.
export const godotSessions = [
  'Why do we play games? Why do we mod them?',
  'Should game makers also be game players?',
  'How do game makers create a fun and engaging level?',
  'What helps an idea move from concept to something real?',
  'What makes a level good? What makes it great?',
  'What makes a level good? What makes it great?',
  'What makes a level good? What makes it great?',
  'What makes a level good? What makes it great?',
  'What makes a level "polished?"',
  'Where do you go from here?',
]

/** The learner updates an educator sees in today's Task Progress list, by their task status ids. */
export type Update = 'inreview' | 'needhelp' | 'inprogress'

export interface Submission {
  id: string
  learner: string
  workshop: number
  type: Update
  when: string
  note: string
}

// Running, as of Mar 20, 2027: the updates waiting for Maya, each about what its session has the learner do (session
// 2 mods the platformer, session 3 improves its practice level). Sessions unlock as learners go, so Ada is already on
// Session 4 while her Session 3 waits for review.
export const springSubmissions: Submission[] = [
  {
    id: 'ada-3',
    learner: 'Ada Okafor',
    workshop: 3,
    type: 'inreview',
    when: 'Today, 10:12',
    note: 'My practice level starts easy and ends with three moving platforms over a long gap. I recorded myself playing it from start to finish.',
  },
  {
    id: 'tobi-3',
    learner: 'Tobi Okafor',
    workshop: 3,
    type: 'needhelp',
    when: 'Yesterday, 16:40',
    note: "I moved some platforms and now the player falls through the floor right at the start. I keep pressing Play but can't find what I broke.",
  },
  {
    id: 'lena-2',
    learner: 'Lena Fischer',
    workshop: 2,
    type: 'inreview',
    when: 'Mar 18, 14:05',
    note: "I made the player jump higher and fall slower, so it feels like the moon. Now you can jump right over the first enemy, which is less fun, so I'll fix that next.",
  },
  {
    id: 'priya-2',
    learner: 'Priya Raman',
    workshop: 2,
    type: 'inprogress',
    when: 'Mar 17, 09:30',
    note: 'I played Kiko Adventure and wrote its gameplay loop in my journal. Now I’m modding: I changed the music, and the enemy speed is next.',
  },
]

// The sessions each learner already had approved.
export const springApproved: Record<string, number[]> = {
  'Ada Okafor': [1, 2],
  'Tobi Okafor': [1, 2],
  'Lena Fischer': [1],
  'Priya Raman': [1],
  'Marcus Hill': [],
}

// Finished: Fall Game Makers ran Explore: Godot, whose ten sessions go in order. Each learner either earned the
// certificate when their last session was approved, or stopped partway: the session they were on, and when they last
// worked on it.
export const fallOutcomes: { name: string; certified?: string; stoppedAt?: number; lastActive: string }[] = [
  { name: 'Jonah Reyes', certified: 'Nov 30, 2026', lastActive: 'Nov 30, 2026' },
  { name: 'Mila Novak', certified: 'Nov 30, 2026', lastActive: 'Nov 30, 2026' },
  { name: 'Owen Park', certified: 'Dec 2, 2026', lastActive: 'Dec 2, 2026' },
  { name: 'Ava Brooks', certified: 'Dec 4, 2026', lastActive: 'Dec 4, 2026' },
  { name: 'Leo Martins', certified: 'Dec 7, 2026', lastActive: 'Dec 7, 2026' },
  { name: 'Hana Sato', certified: 'Dec 7, 2026', lastActive: 'Dec 7, 2026' },
  { name: 'Caleb Ward', certified: 'Dec 9, 2026', lastActive: 'Dec 9, 2026' },
  { name: 'Nora Quinn', certified: 'Dec 11, 2026', lastActive: 'Dec 11, 2026' },
  { name: 'Felix Grant', certified: 'Dec 14, 2026', lastActive: 'Dec 14, 2026' },
  { name: 'Theo Lang', stoppedAt: 2, lastActive: 'Sep 28, 2026' },
  { name: 'Iris Cole', stoppedAt: 4, lastActive: 'Oct 19, 2026' },
  { name: 'Ezra Ortiz', stoppedAt: 5, lastActive: 'Oct 30, 2026' },
]
