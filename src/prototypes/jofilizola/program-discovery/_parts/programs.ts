// The catalogue's programs. Endless Access's own come from its program guides
// (access.endlessstudios.com/learning/program-guides, 24 Nov 2026): sessions, facilitated hours, ages, credentials,
// and that every one is in English and Spanish. Names and descriptions are the live platform's
// (studio.endlessstudios.com/programs) where it lists the program, and the guides' otherwise. Details no source states
// are marked `estimate`, or `sample` on screen. Threadbare is written plainly here and set in italics where it's
// shown (Tb.vue).

export type Audience = 'guest' | 'independent' | 'org' | 'educator'
export type Format = 'Live cohort' | 'Self-paced' | 'Workshops'
export type Level = 'Beginner' | 'Intermediate' | 'Advanced' | 'For educators'
export type Language = 'English' | 'Español'
export type DurationBucket = 'Up to 10 hours' | '11–15 hours' | '16+ hours'
/** Who may run it, for educators: open to every Organization and Team, custom (needs a Partnership), or training. */
export type Access = 'open' | 'partnership' | 'training'

interface Localized {
  name: string
  tagline: string
}

export interface Program {
  id: string
  en: Localized
  /** The Spanish version. Absent when the program is in English only. */
  es?: Localized
  kind: 'learner' | 'training'
  /** Where it sits in the learner journey the guides describe: Explore, then Core, then More. */
  tier?: 'Explore' | 'Core' | 'More'
  /** In development: listed so people know it's coming, not open to join or run yet. */
  upcoming?: boolean
  formats: Format[]
  level: Level
  age: string
  partner: string
  access: Access
  duration: string
  durationBucket?: DurationBucket
  /** What finishing earns, from the guides' credentials. */
  credential?: string
  /** The program's colour band while its image is missing: one of the app's skill-domain palettes. */
  palette: 'orange' | 'cyan' | 'purple' | 'green' | 'rose' | 'cornflower'
  icon: string
  estimate?: boolean
  sample?: boolean
}

export const programs: Program[] = [
  {
    id: 'explore-threadbare',
    en: { name: 'Explore: Threadbare', tagline: 'Kickstart your journey from player to creator!' },
    es: { name: 'Explore: Threadbare', tagline: '¡Da el primer paso en tu camino de jugador a creador!' },
    kind: 'learner',
    tier: 'Explore',
    formats: ['Workshops'],
    level: 'Beginner',
    age: '13+',
    partner: 'Endless Access',
    access: 'open',
    duration: '13 one-hour workshops',
    durationBucket: '11–15 hours',
    credential: 'XP for every task',
    palette: 'purple',
    icon: 'i-lucide-sparkles',
  },
  {
    id: 'explore-godot',
    en: { name: 'Explore: Godot', tagline: 'Explore the Godot Engine to script, design, and ship a fully playable platformer level.' },
    es: {
      name: 'Explore: Godot',
      tagline: 'Explora el motor Godot para programar, diseñar y crear un nivel completamente funcional en un plataformero.',
    },
    kind: 'learner',
    tier: 'Explore',
    formats: ['Live cohort'],
    level: 'Beginner',
    age: '13+',
    partner: 'Endless Access',
    access: 'open',
    duration: '10 one-hour sessions',
    durationBucket: 'Up to 10 hours',
    credential: 'Certificate + ASU Intro to Game Making with Godot',
    palette: 'cyan',
    icon: 'i-lucide-gamepad-2',
  },
  {
    id: 'explore-fairytales',
    en: { name: 'Explore: fAIrytales', tagline: 'A new Explore program where learners build AI-assisted mini-games within the Threadbare world.' },
    es: { name: 'Explore: fAIrytales', tagline: 'Un nuevo programa Explore en el que creas minijuegos con ayuda de la IA dentro del mundo de Threadbare.' },
    kind: 'learner',
    tier: 'Explore',
    upcoming: true,
    formats: ['Workshops'],
    level: 'Beginner',
    age: '13+',
    partner: 'Endless Access',
    access: 'open',
    duration: 'Sessions to be announced',
    credential: 'Certificate + ASU Intro to Game Making with AI',
    palette: 'rose',
    icon: 'i-lucide-wand-sparkles',
  },
  {
    id: 'core-threadbare',
    en: {
      name: 'Core: Threadbare',
      tagline: 'A structured, cohort-based game-making program where learners design and build a playable StoryQuest and contribute it to the open-source game Threadbare.',
    },
    es: {
      name: 'Core: Threadbare',
      tagline: 'Un programa de creación de videojuegos en grupo donde diseñas y construyes una StoryQuest jugable y la aportas al juego de código abierto Threadbare.',
    },
    kind: 'learner',
    tier: 'Core',
    formats: ['Live cohort', 'Self-paced'],
    level: 'Intermediate',
    age: '15+',
    partner: 'Endless Access',
    access: 'open',
    duration: '18 one-hour sessions',
    durationBucket: '16+ hours',
    credential: 'Certificate + ASU Community Game Making',
    palette: 'orange',
    icon: 'i-lucide-scroll-text',
  },
  {
    id: 'more-threadbare',
    en: {
      name: 'More: Threadbare',
      tagline: 'For learners with Godot skills or a finished StoryQuest: take on real issues from the Threadbare backlog, go on deep-dive quests or create new LoreQuests.',
    },
    es: {
      name: 'More: Threadbare',
      tagline: 'Si ya sabes Godot o terminaste una StoryQuest: resuelve tareas reales del backlog de Threadbare, emprende misiones de profundización o crea nuevas LoreQuests.',
    },
    kind: 'learner',
    tier: 'More',
    formats: ['Self-paced', 'Workshops'],
    level: 'Advanced',
    age: '15+',
    partner: 'Endless Access',
    access: 'open',
    duration: '6 milestones · 12+ hours',
    durationBucket: '11–15 hours',
    credential: 'Certificate + ASU Applied Game Making: Backlog to Contribution',
    palette: 'green',
    icon: 'i-lucide-git-merge',
  },
  {
    id: 'fellowship',
    en: {
      name: 'The Fellowship Programme',
      tagline: 'A GenAI and game-development bootcamp where gifted and talented Year 8 and 9 students take a game from first idea to a playable, published level — using AI as their creative co-pilot.',
    },
    kind: 'learner',
    formats: ['Live cohort'],
    level: 'Intermediate',
    age: '12–14',
    partner: 'Endless Studios',
    access: 'partnership',
    duration: '12 sessions',
    durationBucket: '11–15 hours',
    palette: 'cornflower',
    icon: 'i-lucide-award',
    sample: true,
  },
  {
    id: 'explorers-mastery-track',
    en: {
      name: 'Explorer’s Program: Mastery Track',
      tagline: 'Students refine and launch their games on the Endless platform, gather feedback from real players, and prepare their projects for the final showcase, using AI tools responsibly along the way.',
    },
    kind: 'learner',
    formats: ['Live cohort'],
    level: 'Intermediate',
    age: '13+',
    partner: 'Endless Studios',
    access: 'partnership',
    duration: 'One programme phase',
    palette: 'orange',
    icon: 'i-lucide-rocket',
    sample: true,
  },
  {
    id: 'endless-access-facilitators',
    en: {
      name: 'Endless Access Facilitators',
      tagline: 'Resources, pathways, and support for educators bringing Endless Access Learning Programs to their learners.',
    },
    es: {
      name: 'Facilitadores de Endless Access',
      tagline: 'Recursos, rutas y apoyo para educadores que llevan los Programas de Aprendizaje de Endless Access a sus estudiantes.',
    },
    kind: 'training',
    formats: ['Self-paced'],
    level: 'For educators',
    age: 'Adults',
    partner: 'Endless Access',
    access: 'training',
    duration: 'Playbooks for every program',
    durationBucket: 'Up to 10 hours',
    credential: 'ASU Intro to Game Making with Godot – Facilitator',
    palette: 'orange',
    icon: 'i-lucide-presentation',
    estimate: true,
  },
]

export const languagesOf = (p: Program): Language[] => (p.es ? ['English', 'Español'] : ['English'])

/**
 * The programs' own images, saved in `images/` as `<id>.<ext>`, with `<id>-es.<ext>` for a Spanish version that has
 * its own. A program whose file isn't there yet shows its colour band instead.
 */
const imageFiles = import.meta.glob('./images/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' }) as Record<string, string>
export function programImage(id: string, lang: 'en' | 'es' = 'en'): string | undefined {
  const find = (name: string) => Object.entries(imageFiles).find(([path]) => path.replace(/\.[^.]+$/, '') === `./images/${name}`)?.[1]
  return (lang === 'es' && find(`${id}-es`)) || find(id)
}

/** Endless Access programs are free; Endless Studios programs are paid and start with a conversation. */
export const isPaid = (p: Program) => p.partner === 'Endless Studios'

/**
 * The tool each program is built in, for the Godot and Endstar quick filters. Threadbare is a Godot game, so its programs
 * are Godot. The program guides cover only Endless Access; the marketing site (estudios-web-kappa.vercel.app/educators/
 * programs) says the Explorer's Program is "built in Endstar", so its Mastery Track is Endstar. The Fellowship's tool
 * isn't stated anywhere yet.
 */
export type Tool = 'Godot' | 'Endstar'
const tools: Record<string, Tool[]> = {
  'explore-threadbare': ['Godot'],
  'explore-godot': ['Godot'],
  'explore-fairytales': ['Godot'],
  'core-threadbare': ['Godot'],
  'more-threadbare': ['Godot'],
  'explorers-mastery-track': ['Endstar'],
  'endless-access-facilitators': ['Godot'],
}
export const toolsOf = (p: Program): Tool[] => tools[p.id] ?? []

export const filterOptions = {
  language: ['English', 'Español'] as Language[],
  format: ['Live cohort', 'Self-paced', 'Workshops'] as Format[],
  level: ['Beginner', 'Intermediate', 'Advanced', 'For educators'] as Level[],
  partner: [...new Set(programs.map((p) => p.partner))],
  duration: ['Up to 10 hours', '11–15 hours', '16+ hours'] as DurationBucket[],
}

export const formatIcon: Record<Format, string> = {
  'Live cohort': 'i-lucide-users',
  'Self-paced': 'i-lucide-compass',
  Workshops: 'i-lucide-calendar-days',
}

/** The people each version of the screens is for, from the system's demo cast. */
export const people: Record<Exclude<Audience, 'guest'>, { name: string; username: string; initials: string; detail: string }> = {
  independent: { name: 'Noah Tremblay', username: 'CuriousHeron742', initials: 'NT', detail: 'Independent learner, 18' },
  org: { name: 'Ben Carter', username: 'BoldTapir441', initials: 'BC', detail: 'Maple Ridge Secondary School, 15' },
  educator: { name: 'Evelyn Cho', username: 'evelyn', initials: 'EC', detail: 'Org Educator, Maple Ridge Secondary School' },
}

export const ORG = 'Maple Ridge Secondary School'

/** Each audience's folder of screens, for links between them (Workshop, Catalogue, About). */
export const FOLDER: Record<Audience, string> = {
  guest: '1 Guest',
  independent: '2 Independent learner',
  org: '3 Learner in an organization',
  educator: '4 Educator',
}

// ---------------------------------------------------------------------------------------------------------------
// What the program guides (endlessm.github.io/program-guides, read 26 Nov 2026) say about each Endless Access
// program, for the catalogue's filters and cards. The two Endless Studios programs aren't in the guides: their
// entries are marked `sample`.

export type Stage = 'Explore' | 'Core' | 'More'
export type Skill = 'Art' | 'Engineering' | 'Game Design' | 'Go to Market' | 'Management & Production'
export type CredentialKind = 'XP only' | 'Certificate of Completion' | 'ASU microcredential'
export type Setup = 'Runs in a browser' | 'Install Godot' | 'Works offline' | 'Uses AI'
export type Status = 'Live' | 'In development'
export type Standard = 'CSTA 6–8' | 'CSTA 9–12' | 'CSTA Game Dev specialty' | 'ISTE Students' | 'ISTE CT for Educators'
const ALL_STANDARDS: Standard[] = ['CSTA 6–8', 'CSTA 9–12', 'CSTA Game Dev specialty', 'ISTE Students', 'ISTE CT for Educators']

export interface GuideFacts {
  /** What the learner makes by the end, the card's lead line. */
  makes: string
  /** Sessions or milestones, as the guides count them. */
  sessions: string
  /** Facilitated hours. */
  hours: string
  /** Skill domains the sessions are tagged with, most sessions first. */
  skills: Skill[]
  credentials: CredentialKind[]
  /** The ASU microcredential's name, when there is one. */
  asu?: string
  setup: Setup[]
  status: Status
  /** The standards its sessions map to, as the guides' "By standard" filter names them. */
  standards: Standard[]
  /** Who's ready for it: the guides' own prerequisite, if any. */
  needs?: string
  sample?: boolean
}

export const guide: Record<string, GuideFacts> = {
  'explore-threadbare': {
    makes: 'Make a first contribution to Threadbare in art, code, design, marketing or production',
    sessions: '13 workshops',
    hours: '13 h',
    skills: ['Game Design', 'Art', 'Engineering', 'Go to Market', 'Management & Production'],
    credentials: ['XP only'],
    setup: ['Runs in a browser', 'Works offline', 'Uses AI'],
    standards: ALL_STANDARDS,
    status: 'Live',
  },
  'explore-godot': {
    makes: 'Build a polished, playable platformer level in Godot, and pitch it',
    sessions: '10 sessions',
    hours: '10 h',
    skills: ['Game Design', 'Engineering', 'Management & Production', 'Go to Market'],
    credentials: ['Certificate of Completion', 'ASU microcredential'],
    asu: 'Intro to Game Making with Godot',
    setup: ['Install Godot', 'Works offline'],
    standards: ALL_STANDARDS,
    status: 'Live',
  },
  'explore-fairytales': {
    makes: 'Build AI-assisted mini-games inside the Threadbare world',
    sessions: 'Sessions to be announced',
    hours: '—',
    skills: [],
    credentials: ['Certificate of Completion', 'ASU microcredential'],
    asu: 'Intro to Game Making with AI',
    setup: ['Uses AI'],
    standards: [],
    status: 'In development',
  },
  'core-threadbare': {
    makes: 'Design and ship a playable StoryQuest with a team, like real developers',
    sessions: '18 sessions',
    hours: '18 h',
    skills: ['Engineering', 'Game Design', 'Management & Production', 'Go to Market'],
    credentials: ['Certificate of Completion', 'ASU microcredential'],
    asu: 'Community Game Making',
    setup: ['Install Godot', 'Works offline'],
    standards: ALL_STANDARDS,
    status: 'Live',
  },
  'more-threadbare': {
    makes: 'Get real work merged into the open-source game, and build a GitHub portfolio',
    sessions: '6 milestones',
    hours: '12+ h',
    skills: ['Management & Production', 'Engineering', 'Go to Market'],
    credentials: ['Certificate of Completion', 'ASU microcredential'],
    asu: 'Applied Game Making: Backlog to Contribution',
    setup: ['Install Godot', 'Works offline', 'Uses AI'],
    standards: ALL_STANDARDS,
    status: 'Live',
    needs: 'Godot skills or a finished StoryQuest',
  },
  fellowship: {
    makes: 'Take a game from first idea to a playable, published level, with AI as co-pilot',
    sessions: '12 sessions',
    hours: '12 h',
    skills: ['Game Design', 'Engineering'],
    credentials: ['Certificate of Completion'],
    setup: ['Uses AI'],
    standards: [],
    status: 'Live',
    needs: 'Gifted and talented, Year 8–9',
    sample: true,
  },
  'explorers-mastery-track': {
    makes: 'Launch your game, gather feedback from real players, and get it showcase-ready',
    sessions: 'One programme phase',
    hours: '—',
    skills: ['Go to Market', 'Game Design'],
    credentials: ['Certificate of Completion'],
    setup: ['Uses AI'],
    standards: [],
    status: 'Live',
    sample: true,
  },
  'endless-access-facilitators': {
    makes: 'Run any Endless Access program with its playbook, and earn a facilitator microcredential',
    sessions: 'A playbook per program',
    hours: 'Self-paced',
    skills: [],
    credentials: ['ASU microcredential'],
    asu: 'Intro to Game Making with Godot – Facilitator',
    setup: ['Runs in a browser'],
    standards: [],
    status: 'Live',
    needs: '1500 XP in Explore: Godot',
  },
}
export const guideOf = (p: Program): GuideFacts => guide[p.id]!

/** Ages, as the filter lists them. */
export const ageLabel = (p: Program): string => (p.age === 'Adults' ? 'Adults' : `Ages ${p.age}`)


/**
 * Card artwork: scenes from Threadbare (the "Threadbare Programs Assets" Figma file's program banners, exported without
 * their titles), saved in `art/`. `position` is the part of the wide scene a card shows. The Endless Studios programs
 * keep their own images.
 */
const artFiles = import.meta.glob('./art/*.{png,jpg}', { eager: true, import: 'default' }) as Record<string, string>
const artOf = (name: string) => artFiles[`./art/${name}.png`] ?? artFiles[`./art/${name}.jpg`]
const art: Record<string, { file: string; position: string }> = {
  'explore-threadbare': { file: 'explore-threadbare', position: '30% 45%' },
  'explore-godot': { file: 'explore-godot', position: '30% 70%' },
  'explore-fairytales': { file: 'core-threadbare', position: '8% 70%' },
  'core-threadbare': { file: 'core-threadbare', position: '52% 75%' },
  'more-threadbare': { file: 'more-threadbare', position: '20% 50%' },
  'endless-access-facilitators': { file: 'endless-access-facilitators', position: '62% 30%' },
}
export function programArt(p: Program): { src: string; position: string; pixel: boolean } | undefined {
  const a = art[p.id]
  if (a && artOf(a.file)) return { src: artOf(a.file)!, position: a.position, pixel: true }
  const img = programImage(p.id)
  return img ? { src: img, position: '50% 50%', pixel: false } : undefined
}

/** The catalogue's programs in the Figma redesign's order (Programs — Guest, 65:5785). The Fellowship isn't in it. */
export const catalogueOrder = [
  'explore-threadbare',
  'explore-godot',
  'explorers-mastery-track',
  'explore-fairytales',
  'core-threadbare',
  'more-threadbare',
  'endless-access-facilitators',
]
export const cataloguePrograms: Program[] = catalogueOrder.map((id) => programs.find((p) => p.id === id)!)
