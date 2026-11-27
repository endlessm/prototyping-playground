<script setup lang="ts">
import { computed } from 'vue'
import { PrototypeLink } from '#studio/prototype'
import Tb from './Tb.vue'
import asuLogo from './asu-logo.png'
import { guideOf, programArt, type Program } from './programs'

// The catalogue card, from the Figma redesign (Programs — Guest, 65:5785): the program's name, then what you'll make,
// the time, its tags and the credential, with the ASU mark when it earns an ASU microcredential. A white card on the
// stone page, with a light shadow and small corners, a Threadbare scene on top.
const props = defineProps<{ program: Program; to: string }>()
const p = computed(() => props.program)
const g = computed(() => guideOf(props.program))
const art = computed(() => programArt(props.program))

/** Card E's tags, as set per program in the Figma redesign (Nuxt UI badges in the design system's palettes). */
type Tag = 'godot' | 'endstar' | 'various' | 'ai' | 'educators'
const tagStyle: Record<Tag, { label: string; class: string }> = {
  godot: { label: 'Godot', class: 'bg-violet-100 text-violet-800' },
  endstar: { label: 'Endstar', class: 'bg-lime-50 text-lime-600' },
  various: { label: 'Various tools', class: 'bg-blue-50 text-blue-600' },
  ai: { label: 'AI tools', class: 'bg-yellow-50 text-yellow-600' },
  educators: { label: 'For educators', class: 'bg-default text-default ring ring-inset ring-accented' },
}
const tagsById: Record<string, Tag[]> = {
  'explore-threadbare': ['various'],
  'explore-godot': ['godot', 'various'],
  'explorers-mastery-track': ['ai', 'endstar'],
  'explore-fairytales': ['ai'],
  'core-threadbare': ['godot', 'various'],
  'more-threadbare': ['godot', 'various'],
  'endless-access-facilitators': ['godot', 'various', 'educators'],
  fellowship: ['ai'],
}
const tags = computed(() => tagsById[p.value.id] ?? [])
/** Card E's time line, in the Figma redesign's words where it gives them. */
const metaById: Record<string, string> = {
  'explore-threadbare': '13 independent sessions',
  'explore-godot': '10 hours',
  'explorers-mastery-track': 'One programme phase · Live cohort',
  'core-threadbare': '18 sessions · Live cohort or Self-paced',
  'more-threadbare': '6 milestones · 12+ h · Mentor guided',
  'endless-access-facilitators': 'A playbook per program · Self-paced',
}

const earns = computed(() => {
  const c = g.value.credentials
  if (c.includes('ASU microcredential') && c.includes('Certificate of Completion')) return 'Certificate + ASU microcredential'
  if (c.includes('ASU microcredential')) return 'ASU microcredential'
  if (c.includes('Certificate of Completion')) return 'Certificate of Completion'
  return 'XP for every task'
})
const time = computed(() => (g.value.hours === '—' || g.value.hours === 'Self-paced' ? g.value.sessions : `${g.value.sessions} · ${g.value.hours}`))
const cardMeta = computed(() => metaById[p.value.id] ?? `${time.value} · ${p.value.formats.join(' or ')}`)
</script>

<template>
  <PrototypeLink :to="to" class="group block h-full rounded-md no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
    <article class="flex h-full flex-col overflow-hidden rounded-md bg-white shadow-md shadow-stone-900/5 ring-1 ring-stone-200/70 transition-shadow group-hover:shadow-lg motion-reduce:transition-none">
      <div class="relative h-[200px] flex-none overflow-hidden bg-stone-100">
        <img
          v-if="art"
          :src="art.src"
          alt=""
          class="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          :class="art.pixel ? '[image-rendering:pixelated]' : ''"
          :style="{ objectPosition: art.position }"
        />
        <UIcon v-else :name="program.icon" class="absolute inset-0 m-auto size-10 text-dimmed" />
      </div>
      <div class="flex flex-1 flex-col p-6">
        <p class="pb-2 text-lg font-medium text-toned"><Tb :text="program.en.name" /></p>
        <h3 class="mt-1 font-sans text-xl font-semibold text-highlighted"><Tb :text="g.makes" /></h3>
        <p class="pt-2 pb-6 text-sm text-stone-500">{{ cardMeta }}</p>
        <ul v-if="tags.length" class="flex flex-wrap gap-1.5">
          <li v-for="tag in tags" :key="tag" class="rounded-full px-1.5 py-1 text-[10px] leading-3 font-medium tracking-[0.05em] uppercase" :class="tagStyle[tag].class">
            {{ tagStyle[tag].label }}
          </li>
        </ul>
        <div class="mt-auto flex items-center gap-2 pt-6">
          <template v-if="g.asu">
            <img :src="asuLogo" alt="Arizona State University" class="h-7 w-[50px] flex-none object-contain" />
            <span class="flex min-w-0 flex-1 flex-col text-sm leading-[18px]">
              <span class="font-medium text-highlighted">ASU microcredential</span>
              <span class="truncate text-muted">{{ g.asu }}</span>
            </span>
          </template>
          <template v-else>
            <UIcon name="i-lucide-award" class="size-5 flex-none text-primary" />
            <span class="min-w-0 flex-1 text-sm font-medium text-highlighted">{{ earns }}</span>
          </template>
        </div>
      </div>
    </article>
  </PrototypeLink>
</template>
