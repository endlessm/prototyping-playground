<script setup lang="ts">
import { computed, ref } from 'vue'
import { PrototypeLink } from '#studio/prototype'
import AppFrame from './AppFrame.vue'
import EducatorAccountModal from './EducatorAccountModal.vue'
import JoinCard from './JoinCard.vue'
import RunCard from './RunCard.vue'
import Tb from './Tb.vue'
import asuLogo from './asu-logo.png'
import { programArt, programs, type Audience } from './programs'

// Laid out after the Studios AI program page (studios-ai.netlify.app/learn/explore-godot): title, Overview / Community /
// Projects tabs, the artwork and summary beside a sticky card with the key facts and the way to join, then the
// curriculum as one card per stage, what you'll earn, and projects by other learners. Styled as option D: stone page,
// white cards with light shadows and small corners, Allo titles, orange stage labels, black for the teach prompt.
// Proposed: the About page of Core: Threadbare, the program a non-member sees before joining. It answers what the
// program is, where it fits, who it's for, how long it takes, what's in it, what it builds and who else is there,
// beside the ways to join (learners) or to run it (educators). The About text is the live program page's, with its
// Spanish version behind the language switch. Sessions, hours, credentials, skills, impact figures and technical
// needs come from Endless Access's program guides (24 Nov 2026). The community's numbers, StoryQuests and quote are
// samples.
const props = defineProps<{ audience: Audience; cataloguePath: string }>()

const program = programs.find((p) => p.id === 'core-threadbare')!
const teachOpen = ref(false)
const lang = ref<'en' | 'es'>('en')
const langItems = [
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
]
// The title-less Threadbare scene, as on the catalogue cards; the page's own title sits above it.
const art = programArt(program)
const about = {
  en: 'Core: Threadbare is Endless Access’s flagship game-making program. Over five milestones, learners play and analyze games, form teams, and design, build, playtest, and launch a playable StoryQuest that they contribute to the open-source game Threadbare on GitHub. Learners work through the Play, Create, Share, and Reflect phases in every session and can earn the Community Game Making microcredential.',
  es: 'Core: Threadbare es el programa insignia de creación de videojuegos de Endless Access. A lo largo de cinco etapas, los participantes juegan y analizan videojuegos, forman equipos y diseñan, construyen, prueban y lanzan una StoryQuest jugable que aportan al juego de código abierto Threadbare en GitHub. En cada sesión recorren las fases de Jugar, Crear, Compartir y Reflexionar, y pueden obtener la microcredencial Community Game Making.',
}
const canBecomeEducator = computed(() => props.audience === 'guest' || props.audience === 'independent')

const facts = [
  { icon: 'i-lucide-sparkles', value: '2,000 XP', note: 'to earn the microcredential' },
  { icon: 'i-lucide-signal', value: 'Intermediate', note: 'Ages 15+' },
  { icon: 'i-lucide-calendar-days', value: '18 sessions', note: 'One hour each' },
  { icon: 'i-lucide-users', value: 'In a team', note: 'Facilitated or self-paced' },
  { icon: 'i-lucide-languages', value: 'English · Español', note: 'Offered by Endless Access' },
]

const view = ref('overview')
const viewItems = [
  { label: 'Overview', value: 'overview' },
  { label: 'Community', value: 'community' },
  { label: 'Projects', value: 'projects' },
]
const show = (section: 'overview' | 'community' | 'projects') => view.value === 'overview' || view.value === section

// Sample facilitators and tools, as the reference page lists them beside the join card.
const teachers = [
  { name: 'Evelyn Cho', role: 'Maple Ridge Secondary School', initials: 'EC' },
  { name: 'Daniel Okafor', role: 'Endless Access', initials: 'DO' },
  { name: 'Lucía Paredes', role: 'Endless Access · Español', initials: 'LP' },
]
const tools = ['Godot', 'Backstitch', 'GitHub']
const earnPoints = [
  { title: 'Show what you built', text: 'The certificate names the StoryQuest your team shipped.' },
  { title: 'Yours to keep', text: 'It never expires and stays on your learner profile.' },
  { title: 'Share it anywhere', text: 'Add it to a resume, a portfolio or LinkedIn.' },
]

const journey = [
  { tier: 'Explore', name: 'Explore: Threadbare', text: 'Play Threadbare, then build and submit your first game in short workshops.' },
  { tier: 'Core', name: 'Core: Threadbare', text: 'Design and ship a full StoryQuest across a structured, multi-week program.', current: true },
  { tier: 'More', name: 'More: Threadbare', text: 'Merge real work into the live, open-source game on GitHub.' },
]

const forYou = [
  'You’re 15 or older and want to make a real game, not just play one',
  'You’re new to Godot: the program starts from the fundamentals of game design',
  'You want to work in a team, collaborating like real developers on a shared project board',
  'You like stories: your team creates its own playable StoryQuest in the world of Threadbare',
]

type Domain = 'Game Design' | 'Engineering' | 'Management & Production' | 'Go to Market' | 'Art'
interface Session { n: number; title: string; question: string; domain: Domain }
const s = (n: number, title: string, question: string, domain: Domain): Session => ({ n, title, question, domain })
const BUILD = 'What makes a game good? What makes it great?'
const stages = [
  { title: 'Find the game in you', make: 'Your first ideas, and a sense of what makes a game a game', sessions: [s(1, 'What Makes a Game', 'What makes a video game a game?', 'Game Design'), s(2, 'Blue Sky Brainstorming', 'Can an idea ever be too big?', 'Game Design')] },
  { title: 'Get set up in Godot', make: 'A mechanic made your own, and a first build with your team', sessions: [s(3, 'Get Set Up in Godot', 'What helps you get into a creative space?', 'Engineering'), s(4, 'Make the Mechanic Yours', 'How do you make a mechanic your own?', 'Engineering'), s(5, 'Build the Void Together', 'What does it take to build together?', 'Engineering')] },
  { title: 'Plan as a team', make: 'Your team’s StoryQuest idea and a project board to build it', sessions: [s(6, 'Find Your Team’s Idea', 'How do many ideas become one game?', 'Game Design'), s(7, 'Organize Your Project', 'What’s the best way to organize your project?', 'Management & Production'), s(8, 'Tackle the Unknown', 'How do you make a big challenge feel doable?', 'Management & Production')] },
  { title: 'Build and playtest', make: 'A playable StoryQuest, improved through two rounds of feedback', sessions: [s(9, 'Build Session', BUILD, 'Engineering'), s(10, 'Build Session', BUILD, 'Engineering'), s(11, 'Feedback Session', BUILD, 'Engineering'), s(12, 'Build Session', BUILD, 'Engineering'), s(13, 'Build Session', BUILD, 'Engineering'), s(14, 'Feedback Session', BUILD, 'Game Design'), s(15, 'Build Session', BUILD, 'Game Design'), s(16, 'Build Session', BUILD, 'Management & Production')] },
  { title: 'Launch', make: 'Your pitch, and your StoryQuest shared with the Threadbare community on the Endless platform', sessions: [s(17, 'Sell Your Idea', 'How do you sell an idea?', 'Go to Market'), s(18, 'Showcase Day', 'How does it feel to make it to the finish line?', 'Go to Market')] },
]
const outlineItems = stages.map((st, i) => ({
  label: `${i + 1}. ${st.title}`,
  value: String(i),
  range: st.sessions.length > 1 ? `Sessions ${st.sessions[0]!.n}–${st.sessions.at(-1)!.n}` : `Session ${st.sessions[0]!.n}`,
  // Sample: about 110 XP a session, so the 18 sessions reach the 2,000 XP the microcredential needs.
  xp: st.sessions.length * 110 + (i === stages.length - 1 ? 20 : 0),
  ...st,
}))

// Skill domains as quiet stone chips: the page keeps to black, stone and orange.
const domainClass: Record<Domain, string> = {
  'Game Design': 'bg-stone-100 text-stone-700',
  Engineering: 'bg-stone-100 text-stone-700',
  'Management & Production': 'bg-stone-100 text-stone-700',
  'Go to Market': 'bg-stone-100 text-stone-700',
  Art: 'bg-stone-100 text-stone-700',
}
const skills = ['Creativity & design thinking', 'Problem solving', 'Technical literacy']

const impact = [
  { value: '+108%', label: 'growth in Godot skill', source: 'Jordan · about 1,375 learners' },
  { value: '92%', label: 'motivated by earning the Certificate of Completion', source: 'Peru · UTP · 82 learners' },
  { value: '+15%', label: 'more interest in a games-industry career', source: 'United States · Black Girls Code' },
]

const sceneOf = (id: string) => programArt(programs.find((p) => p.id === id)!)
const quests = [
  { title: 'The Lantern Keeper', by: 'AmberFinch203', line: 'Guide a lantern through the loom’s dark rooms before it burns out.', art: sceneOf('explore-threadbare') },
  { title: 'Moth & Mending', by: 'CleverMarmot118', line: 'Patch a torn quilt before the moths get to the last square.', art: sceneOf('more-threadbare') },
  { title: 'Under the Loom', by: 'WittyCrane281', line: 'A puzzle StoryQuest in the cellar beneath the storyteller’s house.', art: sceneOf('endless-access-facilitators') },
]
const avatars = ['AF', 'CM', 'WC', 'BT', 'MG', 'EP']

const requirements = [
  { icon: 'i-lucide-laptop', text: 'A laptop that can install software. Shared devices are fine, as long as each learner signs in to their own account.' },
  { icon: 'i-lucide-gamepad-2', text: 'Godot, free from godotengine.org (the Standard build). Once installed it works offline, with no account.' },
  { icon: 'i-lucide-git-branch', text: 'Backstitch, for saving versions and sharing builds with your team. No version-control experience needed.' },
  { icon: 'i-lucide-wifi', text: 'A connection only to join, submit your work and take the short surveys. The making itself can happen offline.' },
]
</script>

<template>
  <AppFrame :audience="audience">
    <UBreadcrumb :items="[{ label: 'Programs', to: '#' }, { label: program.en.name }]" class="-mb-2" :ui="{ link: 'no-underline' }">
      <template #item-label="{ item, index }">
        <PrototypeLink v-if="index === 0" :to="cataloguePath" class="no-underline">{{ item.label }}</PrototypeLink>
        <span v-else><Tb :text="item.label" /></span>
      </template>
    </UBreadcrumb>

    <header class="flex flex-col gap-5">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="flex flex-col gap-4">
          <span class="text-[11px] leading-[14px] font-semibold tracking-[0.14em] text-stone-500 uppercase">Program · Core</span>
          <h1 class="text-5xl leading-[1] font-medium tracking-[-0.03em] text-stone-800 lg:text-6xl"><Tb :text="(lang === 'es' && program.es?.name) || program.en.name" /></h1>
        </div>
        <UTabs v-model="lang" :items="langItems" :content="false" size="xs" color="neutral" variant="pill" aria-label="Language" :ui="{ list: 'rounded-full bg-stone-100', indicator: 'rounded-full', trigger: 'rounded-full' }" />
      </div>
      <UTabs v-model="view" :items="viewItems" :content="false" color="neutral" variant="pill" class="self-start" :ui="{ list: 'rounded-full bg-stone-100', indicator: 'rounded-full bg-black', trigger: 'rounded-full px-4 data-[state=active]:text-white' }" />
    </header>

    <div class="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="flex flex-col gap-12">
        <!-- Overview -->
        <template v-if="view === 'overview'">
          <section class="flex flex-col gap-5">
            <img v-if="art" :src="art.src" alt="" class="aspect-[16/7] w-full rounded-md object-cover [image-rendering:pixelated]" :style="{ objectPosition: art.position }" />
            <p class="text-lg text-stone-600" :lang="lang"><Tb :text="about[lang]" /></p>
          </section>

          <section class="flex flex-col gap-4" aria-labelledby="journey">
            <h2 id="journey" class="text-3xl text-highlighted">Where it fits</h2>
            <ol class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <li
                v-for="(step, i) in journey"
                :key="step.tier"
                class="flex flex-col gap-1 rounded-md border p-5"
                :class="step.current ? 'border-black bg-white' : 'border-stone-200 bg-stone-100'"
                :aria-current="step.current ? 'step' : undefined"
              >
                <span class="text-xs leading-[14px] font-semibold tracking-[0.14em] text-primary uppercase">Step 0{{ i + 1 }}{{ step.current ? ' · This program' : '' }}</span>
                <span class="font-heading text-xl leading-7 font-semibold text-default"><Tb :text="step.name" /></span>
                <span class="text-sm text-stone-600"><Tb :text="step.text" /></span>
              </li>
            </ol>
          </section>

          <section class="flex flex-col gap-4">
            <h2 class="text-3xl text-highlighted">Who it’s for</h2>
            <ul class="flex flex-col gap-2.5">
              <li v-for="line in forYou" :key="line" class="flex items-start gap-2.5 text-base text-default">
                <UIcon name="i-lucide-check" class="mt-1 size-4 flex-none text-primary" /><span><Tb :text="line" /></span>
              </li>
            </ul>
            <p v-if="audience === 'educator'" class="text-sm text-muted">It can be tailored to curricular or social-impact themes.</p>
          </section>

          <section class="flex flex-col gap-4" aria-labelledby="curriculum">
            <div class="flex flex-wrap items-end justify-between gap-3">
              <h2 id="curriculum" class="text-3xl text-highlighted">Curriculum</h2>
              <span class="text-sm text-stone-500">18 sessions · 60 min each</span>
            </div>
            <div v-for="st in outlineItems" :key="st.value" class="flex flex-col gap-3 rounded-md border border-stone-200 bg-white p-5">
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <h3 class="font-heading text-lg font-semibold text-primary">{{ st.label }}</h3>
                <span class="text-xs text-stone-500">{{ st.range }}</span>
              </div>
              <p class="flex items-start gap-2 text-sm text-default">
                <UIcon name="i-lucide-hammer" class="mt-0.5 size-4 flex-none text-stone-500" />
                <span><span class="font-semibold">You make:</span> <Tb :text="st.make" /></span>
              </p>
              <ol class="flex flex-col">
                <li v-for="se in st.sessions" :key="se.n" class="flex items-center gap-3 border-t border-stone-100 py-2.5 first:border-t-0">
                  <span class="flex size-7 flex-none items-center justify-center rounded-md bg-stone-100 text-xs font-semibold text-stone-600">{{ se.n }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-medium text-highlighted">{{ se.title }}</span>
                    <span class="block text-xs text-muted">{{ se.question }}</span>
                  </span>
                  <span class="hidden flex-none rounded-full px-2 py-0.5 text-xs font-medium sm:block" :class="domainClass[se.domain]">{{ se.domain }}</span>
                </li>
              </ol>
              <span class="self-start rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">+{{ st.xp }} XP</span>
            </div>
            <p class="flex items-center gap-2 text-xs text-muted">
              <UIcon name="i-lucide-lock" class="size-3.5" />
              {{ audience === 'educator' ? 'Lesson plans, slides and assessment are in the facilitator playbook.' : 'Lessons, slides and tasks open when you join.' }}
            </p>
          </section>

          <section class="flex flex-col gap-4" aria-labelledby="earn">
            <h2 id="earn" class="text-3xl text-highlighted">What you’ll earn</h2>
            <div class="grid grid-cols-1 gap-5 md:grid-cols-[16rem_minmax(0,1fr)] md:items-center">
              <div class="flex flex-col items-center gap-2 rounded-md bg-white p-6 text-center shadow-md shadow-stone-900/5 ring-1 ring-stone-200/70">
                <span class="text-[11px] font-semibold tracking-[0.14em] text-stone-500 uppercase">Certificate</span>
                <span class="flex size-12 items-center justify-center rounded-full bg-orange-50"><UIcon name="i-lucide-award" class="size-6 text-primary" /></span>
                <span class="font-heading text-lg font-semibold text-highlighted">Core: <em>Threadbare</em> Certificate</span>
                <span class="text-xs text-muted">Endless Access</span>
              </div>
              <ul class="flex flex-col gap-3">
                <li v-for="pt in earnPoints" :key="pt.title" class="flex items-start gap-2.5 text-sm">
                  <UIcon name="i-lucide-circle-check" class="mt-0.5 size-4 flex-none text-primary" />
                  <span><span class="font-semibold text-highlighted">{{ pt.title }}.</span> <span class="text-stone-600">{{ pt.text }}</span></span>
                </li>
              </ul>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-[11px] font-semibold tracking-[0.14em] text-stone-500 uppercase">Microcredential</span>
              <div class="flex items-center gap-3 rounded-md border border-stone-200 bg-white p-4">
                <img :src="asuLogo" alt="Arizona State University" class="h-7 w-[50px] flex-none object-contain" />
                <p class="text-sm text-default">
                  At 2,000 XP you earn <span class="font-semibold">Community Game Making</span> from Arizona State University. Sessions map to CSTA 2026 and ISTE standards.
                </p>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-[11px] font-semibold tracking-[0.14em] text-stone-500 uppercase">Skills, earned as XP</span>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="sk in skills" :key="sk" class="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">{{ sk }}</span>
              </div>
            </div>
          </section>

          <section class="flex flex-col gap-4">
            <h2 class="text-3xl text-highlighted">What you need</h2>
            <ul class="flex flex-col gap-2.5">
              <li v-for="r in requirements" :key="r.text" class="flex items-start gap-2.5 text-sm text-default">
                <UIcon :name="r.icon" class="mt-0.5 size-4 flex-none text-stone-500" />{{ r.text }}
              </li>
            </ul>
          </section>
        </template>

        <!-- Community -->
        <section v-if="show('community')" class="flex flex-col gap-4" aria-labelledby="community">
          <h2 id="community" class="text-3xl text-highlighted">What learners say</h2>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
            <UAvatarGroup size="sm" :max="5">
              <UAvatar v-for="a in avatars" :key="a" :text="a" class="bg-stone-200 text-stone-800" />
            </UAvatarGroup>
            <p class="text-sm text-stone-600"><span class="font-semibold text-highlighted">1,240 learners</span> in 38 groups · 86 StoryQuests published</p>
          </div>
          <blockquote class="rounded-md bg-white p-6 shadow-md shadow-stone-900/5 ring-1 ring-stone-200/70">
            <p class="font-heading text-xl leading-snug text-highlighted">“Playtesting was scary but my team found three bugs I’d never have seen. Seeing our StoryQuest in <em>Threadbare</em> was the best part.”</p>
            <footer class="mt-3 text-sm text-muted">MellowGecko568 · finished in Nov 2026</footer>
          </blockquote>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div v-for="m in impact" :key="m.label" class="flex flex-col gap-0.5 rounded-md border border-stone-200 bg-stone-100 p-4">
              <span class="font-heading text-3xl font-semibold text-highlighted">{{ m.value }}</span>
              <span class="text-sm text-default">{{ m.label }}</span>
              <span class="text-xs text-muted">{{ m.source }}</span>
            </div>
          </div>
        </section>

        <!-- Projects -->
        <section v-if="show('projects')" class="flex flex-col gap-4" aria-labelledby="projects">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <h2 id="projects" class="text-3xl text-highlighted">Projects built by other learners</h2>
            <ULink class="text-sm font-medium text-highlighted underline-offset-4 hover:underline">See all 86 StoryQuests</ULink>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <article v-for="q in quests" :key="q.title" class="flex flex-col overflow-hidden rounded-md bg-white shadow-md shadow-stone-900/5 ring-1 ring-stone-200/70">
              <img v-if="q.art" :src="q.art.src" alt="" class="h-32 w-full object-cover [image-rendering:pixelated]" :style="{ objectPosition: q.art.position }" />
              <div class="flex flex-col gap-1 p-4">
                <p class="text-sm font-semibold text-highlighted">{{ q.title }}</p>
                <p class="text-sm text-stone-600">{{ q.line }}</p>
                <p class="mt-1 text-xs text-muted">by {{ q.by }}</p>
              </div>
            </article>
          </div>
        </section>
      </div>

      <!-- Side column: the facts and the way in, then teachers, tools and the teach prompt -->
      <aside class="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
        <div class="flex flex-col gap-3 rounded-md bg-white p-5 shadow-md shadow-stone-900/5 ring-1 ring-stone-200/70">
          <div v-for="fct in facts" :key="fct.value" class="flex items-center gap-3">
            <span class="flex size-8 flex-none items-center justify-center rounded-md bg-stone-100"><UIcon :name="fct.icon" class="size-4 text-black" /></span>
            <span class="flex flex-col leading-tight">
              <span class="text-sm font-semibold text-highlighted">{{ fct.value }}</span>
              <span class="text-xs text-muted">{{ fct.note }}</span>
            </span>
          </div>
        </div>

        <RunCard v-if="audience === 'educator'" />
        <JoinCard v-else :audience="audience" />

        <div class="flex flex-col gap-3">
          <span class="text-[11px] font-semibold tracking-[0.14em] text-stone-500 uppercase">Facilitators</span>
          <ul class="flex flex-col gap-2.5">
            <li v-for="t in teachers" :key="t.name" class="flex items-center gap-2.5">
              <UAvatar :text="t.initials" size="sm" class="bg-stone-200 text-stone-800" />
              <span class="flex flex-col leading-tight">
                <span class="text-sm font-medium text-highlighted">{{ t.name }}</span>
                <span class="text-xs text-muted">{{ t.role }}</span>
              </span>
            </li>
          </ul>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-[11px] font-semibold tracking-[0.14em] text-stone-500 uppercase">Tools you’ll use</span>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="tl in tools" :key="tl" class="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700">{{ tl }}</span>
          </div>
        </div>

        <div v-if="canBecomeEducator" class="flex flex-col gap-2 rounded-md bg-black p-5 text-white">
          <span class="text-[11px] leading-[14px] font-semibold tracking-[0.14em] text-stone-400 uppercase">For educators</span>
          <p class="font-heading text-xl leading-7 font-semibold">Teach this to your learners</p>
          <p class="text-sm text-stone-300">Run Core: <em>Threadbare</em> with your class, club or library group.</p>
          <UButton :label="audience === 'guest' ? 'Create an educator account' : 'Become an educator'" trailing-icon="i-lucide-arrow-right" class="mt-2 self-start rounded-full" @click="teachOpen = true" />
        </div>
      </aside>
    </div>

    <template #overlay>
      <EducatorAccountModal v-model:open="teachOpen" :signed-in="audience !== 'guest'" :program="program.en.name" />
    </template>
  </AppFrame>
</template>
