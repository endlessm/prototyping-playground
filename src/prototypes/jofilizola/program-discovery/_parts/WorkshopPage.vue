<script setup lang="ts">
import { computed, ref } from 'vue'
import { PrototypeLink, usePrototypeNavigate } from '#studio/prototype'
import AppFrame from './AppFrame.vue'
import CatalogCard from './CatalogCard.vue'
import EducatorAccountModal from './EducatorAccountModal.vue'
import Tb from './Tb.vue'
import { FOLDER, ORG, people, programArt, programs, type Audience } from './programs'

// Proposed: the Workshop page (the app's Home, renamed). Laid out after the Studios AI home page
// (studios-ai.netlify.app): a hero, "What brings you here?" for guests, programs to start, a feed of what's new, and a
// right rail with events, bounties and the access code. Styled as option D: stone page, a black hero, white cards with
// light shadows and small corners, Allo titles, orange for the main action. Each audience sees what fits them: a
// learner in an organization sees the program they're in, an educator sees their cohort. Events, posts and bounties are
// samples.
const props = defineProps<{ audience: Audience }>()
const folder = computed(() => FOLDER[props.audience])
const person = computed(() => (props.audience === 'guest' ? null : people[props.audience]))
const firstName = computed(() => person.value?.name.split(' ')[0])
const teachOpen = ref(false)
const navigate = usePrototypeNavigate()
const heroGo = () => navigate(props.audience === 'org' || props.audience === 'educator' ? `${folder.value}/About Core Threadbare` : `${folder.value}/Catalogue`)
const onReason = (r: (typeof reasons)[number]) => {
  if ('teach' in r) teachOpen.value = true
  else if ('href' in r) window.open(r.href, '_blank', 'noopener')
  else navigate(`${folder.value}/${r.to}`)
}

const byId = (id: string) => programs.find((p) => p.id === id)!
const heroArt = programArt(byId('core-threadbare'))
const current = byId('explore-threadbare')
const currentArt = programArt(current)
const cohortArt = programArt(byId('core-threadbare'))

const hero = computed(() => {
  switch (props.audience) {
    case 'guest':
      return { eyebrow: 'Workshop', title: 'Come play.', line: 'Play as many games as you like, then build one yourself. We’ll show you every step. No account needed to start.', cta: 'Get started' }
    case 'educator':
      return { eyebrow: ORG, title: `Welcome back, ${firstName.value}.`, line: 'Your cohort meets on Wednesday. Session 5 is ready to run, with slides and the playbook.', cta: 'Open your cohort' }
    case 'org':
      return { eyebrow: ORG, title: `Welcome back, ${firstName.value}.`, line: 'You’re 5 workshops into Explore: Threadbare. Pick up where you left off.', cta: 'Continue learning' }
    default:
      return { eyebrow: 'Workshop', title: `Welcome back, ${firstName.value}.`, line: 'Play something new, start a program, or make your own game. Every task you finish earns XP.', cta: 'Find a program' }
  }
})

const reasons = [
  { want: 'Learn to make games', line: 'Join a program or workshop and learn alongside other creators.', icon: 'i-lucide-gamepad-2', to: 'Catalogue' },
  { want: 'Teach game making', line: 'Bring game making to your learners with training, materials and fellow educators.', icon: 'i-lucide-presentation', teach: true },
  { want: 'Help make the games', line: 'Contribute to real games alongside the makers behind them.', icon: 'i-lucide-git-pull-request', href: 'https://contributions.endlessstudios.com/' },
] as const

const starters = computed(() =>
  props.audience === 'educator' ? [byId('core-threadbare'), byId('endless-access-facilitators')] : [byId('explore-threadbare'), byId('core-threadbare')],
)

type Kind = 'announcements' | 'updates' | 'boards'
const feedTab = ref<'all' | Kind>('all')
const feedTabs = [
  { label: 'All', value: 'all' },
  { label: 'Announcements', value: 'announcements' },
  { label: 'Game updates', value: 'updates' },
  { label: 'Program boards', value: 'boards' },
]
const posts: { author: string; initials: string; role?: string; when: string; kind: Kind; text: string; likes: number; reply?: { author: string; text: string } }[] = [
  { author: 'Endless Studios', initials: 'ES', when: 'Today', kind: 'announcements', text: 'Creator Jam 2026 registration is open! Team up, build a game in 48 hours, and demo it at the summer showcase. Spots are limited.', likes: 132, reply: { author: 'mika.builds', text: 'Count me in! Anyone looking for an artist teammate?' } },
  { author: 'Threadbare team', initials: 'TB', when: 'Yesterday', kind: 'updates', text: 'v0.9 “Loom” is live: the weaving minigame ships today, plus smoother sheep pathfinding and 12 community-made quilt patterns.', likes: 87, reply: { author: 'Endstar team', text: 'Loom minigame looks great, congrats on the ship!' } },
  { author: 'Mx. Rivera', initials: 'MR', role: 'Mentor', when: 'Yesterday', kind: 'boards', text: 'Week 3 brief is up: block out one core mechanic in grey boxes before Friday’s playtest. Bring one question about your game loop to the session.', likes: 24, reply: { author: 'creator', text: 'Does grey-boxing mean no textures at all?' } },
  { author: 'Endstar team', initials: 'EN', when: '3 days ago', kind: 'updates', text: 'Endstar 1.4 adds remixable sample worlds: open any featured world, press Remix, and make it yours.', likes: 63 },
]
const shownPosts = computed(() => posts.filter((p) => feedTab.value === 'all' || p.kind === feedTab.value))

const events = [
  { month: 'Jul', day: '22', title: 'Creator Jam kickoff', meta: 'Community event · 4:00 PM' },
  { month: 'Jul', day: '24', title: 'Playtest build due', meta: 'Core: Threadbare · task deadline' },
  { month: 'Jul', day: '28', title: 'Threadbare v1.0 milestone', meta: 'GitHub · threadbare' },
  { month: 'Aug', day: '01', title: 'Summer Show & Tell', meta: 'Community event · live demos' },
]
const bounties = [
  { title: 'Design a boss intro cutscene', game: 'Ink Drinker', pay: '$40' },
  { title: 'Fix double-jump collision bug', game: 'Pixel Racer', pay: '$25' },
  { title: 'Compose a 30s title theme', game: 'Star Weaver', pay: '$60' },
]

const eyebrow = 'text-[11px] leading-[14px] font-semibold tracking-[0.14em] text-stone-500 uppercase'
const card = 'rounded-md bg-white shadow-md shadow-stone-900/5 ring-1 ring-stone-200/70'
</script>

<template>
  <AppFrame :audience="audience" page="workshop">
    <!-- Hero: black, with a Threadbare scene -->
    <section class="grid overflow-hidden rounded-lg bg-black text-white md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" aria-labelledby="w-hero">
      <div class="flex flex-col items-start gap-5 p-8 md:p-10">
        <span class="text-[11px] leading-[14px] font-semibold tracking-[0.14em] text-stone-400 uppercase">{{ hero.eyebrow }}</span>
        <h1 id="w-hero" class="text-5xl leading-[1] font-medium tracking-[-0.03em] text-white md:text-6xl">{{ hero.title }}</h1>
        <p class="max-w-md text-lg text-stone-300"><Tb :text="hero.line" /></p>
        <div class="flex flex-wrap gap-3">
          <UButton size="xl" :label="hero.cta" trailing-icon="i-lucide-arrow-right" class="rounded-full" @click="heroGo" />
          <UButton v-if="audience === 'guest'" size="xl" color="neutral" label="I'm an educator" class="rounded-full bg-white text-black hover:bg-stone-200" @click="teachOpen = true" />
        </div>
      </div>
      <img v-if="heroArt" :src="heroArt.src" alt="" class="h-56 w-full object-cover [image-rendering:pixelated] md:h-full" :style="{ objectPosition: heroArt.position }" />
    </section>

    <!-- Guests: what brings you here -->
    <section v-if="audience === 'guest'" class="flex flex-col gap-5 pt-4" aria-labelledby="w-who">
      <h2 id="w-who" class="text-3xl text-highlighted">What brings you here?</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <button
          v-for="r in reasons"
          :key="r.want"
          type="button"
          class="group flex flex-col gap-2 p-6 text-start transition-shadow hover:shadow-lg motion-reduce:transition-none"
          :class="card"
          @click="onReason(r)"
        >
          <span class="flex size-10 items-center justify-center rounded-md bg-stone-100"><UIcon :name="r.icon" class="size-5 text-black" /></span>
          <span class="mt-3" :class="eyebrow">I want to</span>
          <span class="font-heading text-xl leading-7 font-semibold text-highlighted">{{ r.want }}</span>
          <span class="mb-4 text-sm text-stone-600">{{ r.line }}</span>
          <span class="mt-auto flex size-8 items-center justify-center self-end rounded-full bg-black text-white transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true">
            <UIcon name="i-lucide-arrow-right" class="size-4" />
          </span>
        </button>
      </div>
    </section>

    <!-- Learner in an organization: keep going -->
    <section v-if="audience === 'org'" class="flex flex-col gap-5 pt-4" aria-labelledby="w-keep">
      <div class="flex flex-col gap-3">
        <span :class="eyebrow">Your path</span>
        <h2 id="w-keep" class="text-3xl text-highlighted">Keep going</h2>
      </div>
      <PrototypeLink :to="`${folder}/About Core Threadbare`" class="group flex flex-col overflow-hidden rounded-md border border-stone-200 bg-stone-100 no-underline sm:flex-row">
        <img v-if="currentArt" :src="currentArt.src" alt="" :style="{ objectPosition: currentArt.position }" class="h-28 w-full object-cover [image-rendering:pixelated] sm:h-auto sm:w-72" />
        <div class="flex flex-1 flex-col gap-1 p-5">
          <span class="text-xs leading-[14px] font-semibold tracking-[0.14em] text-primary uppercase">Current program</span>
          <span class="text-xs text-stone-600">Ms. Cho’s class · {{ ORG }}</span>
          <span class="font-heading text-xl leading-7 font-semibold text-default"><Tb :text="current.en.name" /></span>
          <span class="flex items-center justify-between gap-3 pt-3">
            <span class="flex flex-col gap-1.5">
              <UProgress :model-value="5" :max="13" size="sm" class="w-48" />
              <span class="text-xs text-stone-500">5 of 13 independent sessions · 750 XP earned</span>
            </span>
            <span class="flex size-9 flex-none items-center justify-center rounded-full bg-black text-white" aria-hidden="true"><UIcon name="i-lucide-arrow-right" class="size-5" /></span>
          </span>
        </div>
      </PrototypeLink>
    </section>

    <!-- Educator: their cohort -->
    <section v-if="audience === 'educator'" class="flex flex-col gap-5 pt-4" aria-labelledby="w-cohort">
      <div class="flex flex-col gap-3">
        <span :class="eyebrow">Teach</span>
        <h2 id="w-cohort" class="text-3xl text-highlighted">Your cohort</h2>
      </div>
      <div class="flex flex-col overflow-hidden sm:flex-row" :class="card">
        <img v-if="cohortArt" :src="cohortArt.src" alt="" :style="{ objectPosition: cohortArt.position }" class="h-28 w-full object-cover [image-rendering:pixelated] sm:h-auto sm:w-72" />
        <div class="flex flex-1 flex-col gap-1 p-5">
          <span class="text-xs leading-[14px] font-semibold tracking-[0.14em] text-primary uppercase">Next session · Wed 3:30 pm</span>
          <span class="font-heading text-xl leading-7 font-semibold text-default">Spring cohort · Core: <em>Threadbare</em></span>
          <span class="text-sm text-stone-600">24 learners in 6 teams · Session 5 of 18: Build the Void Together</span>
          <span class="flex flex-wrap gap-2 pt-3">
            <UButton color="neutral" label="Open the session" trailing-icon="i-lucide-arrow-right" class="rounded-full" />
            <UButton color="neutral" variant="outline" label="Facilitator playbook" icon="i-lucide-book-open" class="rounded-full" />
          </span>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-10 pt-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="flex flex-col gap-12">
        <section class="flex flex-col gap-5" aria-labelledby="w-start">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div class="flex flex-col gap-2">
              <h2 id="w-start" class="text-3xl text-highlighted">{{ audience === 'educator' ? 'Programs you can run' : 'Start learning' }}</h2>
              <p class="text-sm text-stone-600">{{ audience === 'educator' ? 'Each comes with a playbook, slides and training.' : 'Pick a program to begin your journey. Every task you finish earns XP.' }}</p>
            </div>
            <PrototypeLink :to="`${folder}/Catalogue`" class="text-sm font-medium text-highlighted no-underline underline-offset-4 hover:underline">Browse all programs →</PrototypeLink>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CatalogCard v-for="p in starters" :key="p.id" :program="p" :to="`${folder}/About Core Threadbare`" />
          </div>
        </section>

        <section class="flex flex-col gap-5" aria-labelledby="w-new">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <h2 id="w-new" class="text-3xl text-highlighted">New &amp; noteworthy</h2>
            <UTabs v-model="feedTab" :items="feedTabs" :content="false" color="neutral" variant="pill" size="sm" :ui="{ list: 'rounded-full bg-stone-100', indicator: 'rounded-full bg-black', trigger: 'rounded-full data-[state=active]:text-white' }" />
          </div>
          <article v-for="post in shownPosts" :key="post.text" class="flex flex-col gap-3 p-5" :class="card">
            <div class="flex items-center gap-2.5">
              <UAvatar :text="post.initials" size="sm" class="bg-stone-200 text-stone-800" />
              <span class="text-sm font-semibold text-highlighted">{{ post.author }}</span>
              <span v-if="post.role" class="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold tracking-[0.05em] text-orange-700 uppercase">{{ post.role }}</span>
              <span class="ms-auto text-xs text-muted">{{ post.when }}</span>
            </div>
            <p class="text-sm text-default"><Tb :text="post.text" /></p>
            <div class="flex items-center gap-4 text-xs text-muted">
              <span class="flex items-center gap-1"><UIcon name="i-lucide-heart" class="size-3.5" />{{ post.likes }}</span>
              <span class="flex items-center gap-1"><UIcon name="i-lucide-message-circle" class="size-3.5" />{{ post.reply ? 1 : 0 }}</span>
            </div>
            <p v-if="post.reply" class="rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-700"><span class="font-semibold text-highlighted">{{ post.reply.author }}</span> {{ post.reply.text }}</p>
            <div v-if="audience === 'guest'" class="flex items-center justify-between gap-3 border-t border-stone-100 pt-3 text-sm text-muted">
              Create an account to join the conversation.
              <UButton size="xs" label="Sign up" class="rounded-full" />
            </div>
          </article>
        </section>
      </div>

      <aside class="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
        <section class="flex flex-col gap-3 p-5" :class="card" aria-labelledby="w-events">
          <h2 id="w-events" class="text-lg text-highlighted">Upcoming events</h2>
          <ul class="flex flex-col gap-3">
            <li v-for="e in events" :key="e.title" class="flex items-center gap-3">
              <span class="flex w-10 flex-none flex-col items-center rounded-md bg-stone-100 py-1 leading-none">
                <span class="text-[10px] font-semibold tracking-[0.1em] text-primary uppercase">{{ e.month }}</span>
                <span class="font-heading text-lg font-semibold text-black">{{ e.day }}</span>
              </span>
              <span class="flex min-w-0 flex-col leading-tight">
                <span class="truncate text-sm font-medium text-highlighted"><Tb :text="e.title" /></span>
                <span class="truncate text-xs text-muted"><Tb :text="e.meta" /></span>
              </span>
            </li>
          </ul>
          <ULink class="text-sm font-medium text-highlighted">Full calendar →</ULink>
        </section>

        <section class="flex flex-col gap-3 p-5" :class="card" aria-labelledby="w-bounties">
          <div class="flex flex-col gap-0.5">
            <h2 id="w-bounties" class="text-lg text-highlighted">Bounties</h2>
            <p class="text-xs text-muted">Paid tasks posted by game teams, via BountyBoard.</p>
          </div>
          <ul class="flex flex-col divide-y divide-stone-100">
            <li v-for="b in bounties" :key="b.title" class="flex items-center gap-3 py-2.5">
              <span class="flex min-w-0 flex-1 flex-col leading-tight">
                <span class="text-sm font-medium text-highlighted">{{ b.title }}</span>
                <span class="text-xs text-muted">{{ b.game }}</span>
              </span>
              <span class="rounded-full bg-black px-2 py-0.5 text-xs font-semibold text-white">{{ b.pay }}</span>
            </li>
          </ul>
          <ULink class="text-sm font-medium text-highlighted">Browse all bounties →</ULink>
        </section>

        <section v-if="audience !== 'educator'" class="flex flex-col gap-3 rounded-md border border-stone-200 bg-stone-100 p-5" aria-labelledby="w-code">
          <h2 id="w-code" class="text-lg text-highlighted">Have an access code?</h2>
          <div class="flex gap-2">
            <UInput placeholder="e.g. QUEST-7K2P" class="flex-1" aria-label="Access code" />
            <UButton color="neutral" label="Join" class="rounded-full" />
          </div>
        </section>
      </aside>
    </div>

    <template #overlay>
      <EducatorAccountModal v-model:open="teachOpen" :signed-in="audience !== 'guest'" />
    </template>
  </AppFrame>
</template>
