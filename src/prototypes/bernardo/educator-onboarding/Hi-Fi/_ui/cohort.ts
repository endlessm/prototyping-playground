// Create Cohort (flow 4) as a step-by-step wizard any page can open. Its states are the 4.1–4.3 screens.

// Program details are wireframe placeholders: skills and workshop titles stand in for the real catalog.
export const programs = [
  {
    name: 'Explore: Threadbare',
    short: '13 workshops · Ages 13+',
    about: 'Learners build a small game in the Threadbare world.',
    unlocks: '13 workshops, unlocked as you go',
    skills: ['Game design', 'Storytelling', 'Level building'],
    workshops: ['Explore the Threadbare world', 'Design a quest', 'Build your first level'],
    more: 10,
    school: true,
  },
  {
    name: 'Explore: Godot',
    short: '10 sessions · Ages 13+',
    about: 'First steps in the Godot game engine.',
    unlocks: '10 sessions, unlocked as you go',
    skills: ['Programming basics', 'Game engines'],
    workshops: ['Meet the Godot editor', 'Move a character', 'Add collisions'],
    more: 7,
    school: false,
  },
  {
    name: 'Explore: Git',
    short: 'Version control basics',
    about: 'Save, share and undo work like a game studio.',
    unlocks: 'Version control lessons, unlocked as you go',
    skills: ['Version control', 'Working in a team'],
    workshops: ['Why save versions', 'Your first commit', 'Branches'],
    more: 4,
    school: false,
  },
]

export type Program = (typeof programs)[number]

export const steps = ['Program', 'Class name', 'Where you teach', 'Review']

// The context column: why each step matters, and how another educator handled it. The quotes are placeholders.
export const context = [
  {
    title: 'Choosing a program',
    body: 'Each class follows one program. Its workshops unlock as you go, so you don’t plan the whole term up front.',
    quote: 'Threadbare gave my co-op something to show their families by the third week.',
    who: 'Homeschool co-op educator · sample quote',
  },
  {
    title: 'Naming your class',
    body: 'Learners and parents see this name on invites and in their class list. A season or group name helps families with more than one class tell them apart.',
    quote: 'I name classes after the season, so families with siblings always know which link is which.',
    who: 'Learning pod educator · sample quote',
  },
  {
    title: 'Why we ask',
    body: 'Classes inside a US school follow student-privacy rules (NDPA): they are closed, and Endless reviews them before learners join. Homeschool groups, co-ops and clubs get an open class.',
    quote: 'Knowing nothing leaves the class made it easy to start with my students.',
    who: 'Middle school teacher · sample quote',
  },
  {
    title: 'Before you create it',
    body: 'You can rename the class and change its details later. Next, you invite your learners.',
    quote: 'I had the join link in our group chat five minutes after signing up.',
    who: 'Homeschool parent-educator · sample quote',
  },
]

/** How the wizard opens: from a program link, from a plain Create Cohort button, after Continue with nothing chosen, or as a US school class. */
export type CohortStart = 'link' | 'choose' | 'missing' | 'school'

export const starts: Record<
  CohortStart,
  { step: number; program: number | null; name: string; school: boolean; tried: boolean }
> = {
  link: { step: 0, program: 0, name: 'Spring Game Makers', school: false, tried: false },
  choose: { step: 0, program: null, name: 'Spring Game Makers', school: false, tried: false },
  missing: { step: 0, program: null, name: 'Spring Game Makers', school: false, tried: true },
  school: { step: 2, program: 0, name: 'Period 3 Game Design', school: true, tried: false },
}
