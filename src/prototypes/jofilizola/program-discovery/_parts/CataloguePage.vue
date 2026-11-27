<script setup lang="ts">
import { computed, ref } from 'vue'
import { PrototypeLink } from '#studio/prototype'
import AppFrame from './AppFrame.vue'
import CatalogCard from './CatalogCard.vue'
import EducatorAccountModal from './EducatorAccountModal.vue'
import QuickFilters from './QuickFilters.vue'
import Tb from './Tb.vue'
import { cataloguePrograms, ORG, programArt, programs, type Audience } from './programs'
import { useQuickFilters } from './useQuickFilters'

// Proposed: the Programs catalogue, in the Figma redesign's style (Programs — Guest, 65:5785, and Keep Going, 67:21275):
// stone canvas, Allo titles, the quick filters and card E. Educators get a view switch (all, what they can run,
// training); an independent learner sees a Teach prompt; a learner in an organization sees the program they're in
// first, as "Keep going". Guests see option D instead (GuestEditorial.vue). Only
// Core: Threadbare has an About page in this prototype, so every card opens it.
const props = defineProps<{ audience: Audience; aboutPath: string }>()

const allPrograms = ref<HTMLElement | null>(null)

const educatorTabs = [
  { label: 'All programs', value: 'all' },
  { label: 'Programs I can run', value: 'run' },
  { label: 'Training', value: 'training' },
]
const tab = ref('all')
const teachOpen = ref(false)

const source = computed(() =>
  cataloguePrograms.filter((p) => {
    // Training is for educators: learners don't see it, guests might be educators.
    if (p.kind === 'training' && (props.audience === 'independent' || props.audience === 'org')) return false
    if (props.audience === 'educator' && tab.value === 'run' && (p.access !== 'open' || p.upcoming)) return false
    if (props.audience === 'educator' && tab.value === 'training' && p.kind !== 'training') return false
    return true
  }),
)
const f = useQuickFilters(source)
const runnable = programs.filter((p) => p.access === 'open' && !p.upcoming).length

const current = programs.find((p) => p.id === 'explore-threadbare')!
const currentArt = programArt(current)

const eyebrow = 'text-[11px] leading-[14px] font-semibold tracking-[0.14em] text-stone-500 uppercase'
const eyebrowDark = 'text-[11px] leading-[14px] font-semibold tracking-[0.14em] text-stone-400 uppercase'
</script>

<template>
  <AppFrame :audience="audience" canvas="bg-stone-50">
    <header class="flex flex-col gap-6 pt-6 md:flex-row md:items-end md:justify-between">
      <div class="flex flex-col gap-4">
        <span :class="eyebrow">Learn</span>
        <h1 class="text-5xl leading-[1] font-medium tracking-[-0.03em] text-stone-800">Programs</h1>
        <p class="max-w-[654px] text-lg text-stone-600">
          <template v-if="audience === 'educator'">Find a program to run with your learners, or training to prepare for it.</template>
          <template v-else>Learn to make games with a group, at your own pace, or one workshop at a time.</template>
        </p>
      </div>
      <UButton v-if="audience !== 'educator'" size="xl" color="neutral" variant="outline" icon="i-lucide-ticket" label="I have a code" class="self-start rounded-full md:self-auto" />
    </header>

    <!-- A learner in an organization: the program they're in, as the Keep Going frame draws it. -->
    <section v-if="audience === 'org'" class="flex flex-col gap-8 pt-4" aria-labelledby="keep-going">
      <div class="flex flex-col gap-3">
        <span :class="eyebrow">Your path</span>
        <h2 id="keep-going" class="text-4xl text-highlighted">Keep going</h2>
      </div>
      <PrototypeLink :to="aboutPath" class="group flex flex-col overflow-hidden rounded-md border border-stone-200 bg-stone-100 no-underline">
        <div class="h-28 overflow-hidden">
          <img v-if="currentArt" :src="currentArt.src" alt="" :style="{ objectPosition: currentArt.position }" class="size-full object-cover [image-rendering:pixelated] transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none" />
        </div>
        <div class="flex flex-col gap-1 p-5">
          <span class="text-xs leading-[14px] font-semibold tracking-[0.14em] text-primary uppercase">Current program</span>
          <span class="text-xs text-stone-600">Ms. Cho’s class · {{ ORG }}</span>
          <span class="font-heading text-xl leading-7 font-semibold text-default"><Tb :text="current.en.name" /></span>
          <span class="flex items-center justify-between gap-3 pt-4">
            <span class="flex flex-col gap-1.5">
              <UProgress :model-value="5" :max="13" size="sm" class="w-48" />
              <span class="text-xs text-stone-500">5 of 13 independent sessions · 750 XP earned</span>
            </span>
            <span class="flex size-9 flex-none items-center justify-center rounded-full bg-black text-white transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true">
              <UIcon name="i-lucide-arrow-right" class="size-5" />
            </span>
          </span>
        </div>
      </PrototypeLink>
    </section>

    <!-- Independent learner: the Teach prompt, in the educator band's style. -->
    <section v-if="audience === 'independent'" class="flex flex-col gap-4 rounded-lg bg-black p-6 text-white md:flex-row md:items-center md:justify-between md:px-10" aria-labelledby="teach">
      <div class="flex max-w-[560px] flex-col gap-2">
        <span :class="eyebrowDark">For educators</span>
        <h2 id="teach" class="text-2xl text-white">Want to teach these programs?</h2>
        <p class="text-stone-300">Educators run programs with their own learners, with training and lesson plans included.</p>
      </div>
      <UButton size="xl" label="Become an educator" trailing-icon="i-lucide-arrow-right" class="flex-none self-start rounded-full md:self-center" @click="teachOpen = true" />
    </section>

    <!-- Educator: which programs they can run with their organization. -->
    <section v-if="audience === 'educator'" class="flex flex-col gap-4 rounded-lg bg-black p-6 text-white md:flex-row md:items-center md:justify-between md:px-10" aria-labelledby="run">
      <div class="flex max-w-[620px] flex-col gap-2">
        <span :class="eyebrowDark">{{ ORG }}</span>
        <h2 id="run" class="text-2xl text-white">You can run {{ runnable }} programs</h2>
        <p class="text-stone-300">Programs open to everyone are included. Custom programs need a partnership with Endless Access.</p>
      </div>
      <UButton size="xl" color="neutral" label="Request a partnership" class="flex-none self-start rounded-full bg-white text-black hover:bg-stone-200 md:self-center" />
    </section>

    <section ref="allPrograms" class="flex scroll-mt-6 flex-col gap-6 pt-4" aria-labelledby="all-programs">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="flex flex-col gap-3">
          <span :class="eyebrow">Catalogue</span>
          <h2 id="all-programs" class="text-4xl text-highlighted">All programs</h2>
        </div>
        <UTabs v-if="audience === 'educator'" v-model="tab" :items="educatorTabs" :content="false" color="neutral" variant="pill" :ui="{ list: 'rounded-md bg-stone-100', indicator: 'rounded-md' }" />
      </div>
      <QuickFilters :filters="f" />
      <div v-if="f.visible.value.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CatalogCard v-for="p in f.visible.value" :key="p.id" :program="p" :to="aboutPath" />
      </div>
      <p v-else class="py-10 text-center text-sm text-muted">No programs match. <button type="button" class="font-medium text-highlighted underline" @click="f.clear()">Clear all</button></p>
    </section>

    <template #overlay>
      <EducatorAccountModal v-model:open="teachOpen" :signed-in="audience !== 'guest'" />
    </template>
  </AppFrame>
</template>
