// Create Cohort (flow 4) as one page any page can open over itself. Its states are the 4.1 and 4.2 screens.

// The real catalog, from the published program pages and decks (the Endless Studios system's context/programs.md).
// Explore: Threadbare's skills are its five domains and its workshops the app's skill names, in the published page's
// order; Explore: Godot's workshops are its sessions' driving questions. Core: Threadbare and Explore:
// Godot name no skills, so theirs are inferred from their tasks. Explore: Git and More: Threadbare have no source
// beyond their names. `gets` is what learners come away with; only Core: Threadbare has a teacher guide (Educator
// Training). Explore: Threadbare is the school program, where restricted accounts can't post, so it isn't open.
export const programs = [
  {
    name: 'Explore: Threadbare',
    short: '13 workshops · Ages 13+',
    about:
      'One-hour, hands-on workshops where learners try different parts of game development by contributing to Threadbare, a shared community game.',
    unlocks: '13 one-hour workshops; the certificate after five, one from each domain',
    skills: ['Art', 'Game Design', 'Engineering', 'Management & Production', 'Go to Market'],
    workshops: ['Aesthetics & Visual Design', 'Animation & Effects', 'Music & Sound'],
    more: 10,
    school: true,
    gets: [
      'A task page for each workshop, where they hand in what they made',
      'A certificate of completion after five workshops, one from each domain',
      'A join link or an email invite from you',
    ],
    guide: false,
  },
  {
    name: 'Explore: Godot',
    short: '10 sessions · Ages 13+',
    about: 'Learners use a real game engine, Godot, to build a level for a Threadbare-themed platformer.',
    unlocks: '10 sessions, from a start date to an end date',
    skills: ['Core Gameplay & Mechanics', 'Gameplay & Systems Programming', 'Quality Assurance & Playtesting'],
    workshops: [
      'Why do we play games? Why do we mod them?',
      'Should game makers also be game players?',
      'How do game makers create a fun and engaging level?',
    ],
    more: 7,
    school: false,
    gets: [
      'Their own level for a Threadbare-themed platformer',
      'An open class: they can share their games in the Endless gallery',
      'A join link or an email invite from you',
    ],
    guide: false,
  },
  {
    name: 'Explore: Git',
    short: 'Version control basics',
    about: 'Version control fundamentals: save, share and undo work the way game studios do.',
    unlocks: 'Sessions to be announced',
    skills: ['Project & Workflow Management'],
    workshops: ['To be announced'],
    more: 0,
    school: false,
    gets: [
      'An open class: they can share their games in the Endless gallery',
      'A join link or an email invite from you',
    ],
    guide: false,
  },
  {
    name: 'Core: Threadbare',
    short: '18 sessions · Ages 15+',
    about:
      'Learners craft their own StoryQuest in the whimsical, worn world of Threadbare and publish it in the game by pull request.',
    unlocks: '18 sessions in 5 milestones',
    skills: [
      'Narrative & Storytelling',
      'Aesthetics & Visual Design',
      'Gameplay & Systems Programming',
      'Quality Assurance & Playtesting',
      'Project & Workflow Management',
    ],
    workshops: ['Ideation', 'Intro & Outro', 'Mini-game'],
    more: 2,
    school: false,
    gets: [
      'Their own StoryQuest, playable in Threadbare once it is merged',
      'An open class: they can share their games in the Endless gallery',
      'A join link or an email invite from you',
    ],
    guide: true,
  },
  {
    name: 'More: Threadbare',
    short: 'Follow-on to Core',
    about: 'A follow-on to Core: Threadbare. Details to come.',
    unlocks: 'Sessions, unlocked as you go',
    skills: ['Game Design', 'Engineering'],
    workshops: ['To be announced'],
    more: 0,
    school: false,
    gets: [
      'An open class: they can share their games in the Endless gallery',
      'A join link or an email invite from you',
    ],
    guide: false,
  },
]

export type Program = (typeof programs)[number]

// The context column: why each part matters, and how another educator handled it. The quotes are placeholders.
export const context = [
  {
    title: 'Setting up your class',
    body: 'Learners and parents see the name on invites and in their class list. Seats and the start date bound the join link, so a link shared too widely stops working on its own.',
    quote: 'I name classes after the season, so families with siblings always know which link is which.',
    who: 'Learning pod educator · sample quote',
  },
  {
    title: 'Choosing a program',
    body: 'Each class follows one program. Its workshops unlock as you go, so you don’t plan the whole term up front.',
    quote: 'Threadbare gave my co-op something to show their families by the third week.',
    who: 'Homeschool co-op educator · sample quote',
  },
  {
    title: 'Before you create it',
    body: 'You can rename the class and change its details later. Next, you invite your learners.',
    quote: 'I had the join link in our group chat five minutes after signing up.',
    who: 'Homeschool parent-educator · sample quote',
  },
]

/**
 * How the page opens: from a program link, from a plain Create Cohort button, after Create Class with nothing
 * chosen, or from Run Again on a finished cohort, with its program already chosen.
 */
export type CohortStart = 'link' | 'choose' | 'missing' | 'again'

export const starts: Record<CohortStart, { program: number | null; name: string; tried: boolean }> = {
  link: { program: 1, name: 'Spring Game Makers', tried: false },
  choose: { program: null, name: 'Spring Game Makers', tried: false },
  missing: { program: null, name: 'Spring Game Makers', tried: true },
  again: { program: 1, name: 'Summer Game Makers', tried: false },
}
