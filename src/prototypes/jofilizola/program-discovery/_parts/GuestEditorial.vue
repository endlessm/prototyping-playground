<script setup lang="ts">
import { computed, ref } from 'vue'
import { PrototypeLink } from '#studio/prototype'
import AppFrame from './AppFrame.vue'
import CatalogCard from './CatalogCard.vue'
import EducatorAccountModal from './EducatorAccountModal.vue'
import QuickFilters from './QuickFilters.vue'
import Tb from './Tb.vue'
import { cataloguePrograms, programArt, programs } from './programs'
import { useQuickFilters } from './useQuickFilters'

// Proposed: option D, an editorial guest Programs page, now built from the Figma redesign "Programs — Guest"
// (65:5785). The catalogue keeps the Magnific filters, with the list's groups taken from the program guides.
// Palette: stone page, white cards with light shadows and small corners, black bands, orange for the main action.
defineProps<{ aboutPath: string }>()

const teachOpen = ref(false)
const path = ref<HTMLElement | null>(null)
const go = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: 'smooth', block: 'start' })

// Laid out from the Figma redesign "Programs — Guest" (65:5785): stone canvas, Allo titles (set in AppFrame), Nuxt UI
// buttons and badges, and the catalogue in the design's order. The Fellowship isn't in the redesign, so it's left out.
const byId = (id: string) => programs.find((p) => p.id === id)!
const f = useQuickFilters(cataloguePrograms)
const shown = computed(() => f.visible.value)

const steps = [
  { n: '01', id: 'explore-threadbare', ask: 'New to game making?', meta: '13 independent sessions' },
  { n: '02', id: 'explore-godot', ask: 'Ready for a real engine?', meta: '10 sessions · Project' },
  { n: '03', id: 'core-threadbare', ask: 'Want to build with a team?', meta: '18 sessions · Intermediate' },
  { n: '04', id: 'more-threadbare', ask: 'Already built a StoryQuest?', meta: 'Game backlog · Advanced' },
].map((s) => ({ ...s, program: byId(s.id), art: programArt(byId(s.id)) }))

const eyebrow = 'text-[11px] leading-[14px] font-semibold tracking-[0.14em] text-stone-500 uppercase'
</script>

<template>
  <AppFrame audience="guest" canvas="bg-stone-50">
    <section class="flex flex-col items-start gap-6 pt-6" aria-labelledby="d-hero">
      <span :class="eyebrow">Programs</span>
      <h1 id="d-hero" class="max-w-[860px] text-5xl leading-[1] font-medium tracking-[-0.03em] text-stone-800 md:text-7xl md:leading-[72px]">
        Go from playing games <br class="hidden md:block" />to making them.
      </h1>
      <p class="max-w-[654px] text-lg text-stone-600">Free programs in Godot and Endstar, with a team and an open-source world to build in. In English and Spanish, with ASU microcredentials.</p>
      <div class="flex flex-wrap items-center gap-3">
        <UButton size="xl" label="Find my starting point" class="rounded-full" @click="go(path)" />
        <UButton size="xl" color="neutral" variant="outline" label="I'm an educator" class="rounded-full" @click="teachOpen = true" />
      </div>
    </section>

    <section ref="path" class="flex scroll-mt-6 flex-col gap-8 pt-8" aria-labelledby="d-path">
      <div class="flex flex-col gap-2">
        <div class="flex flex-col gap-3">
          <span :class="eyebrow">Your path</span>
          <h2 id="d-path" class="text-4xl text-highlighted">Start where you are</h2>
        </div>
        <p class="max-w-[702px] text-sm text-stone-600">Four free programs, one after the other. Each one stands on its own, so skip ahead if you're ready.</p>
      </div>
      <ol class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li v-for="s in steps" :key="s.n">
          <PrototypeLink :to="aboutPath" class="group flex h-full flex-col overflow-hidden rounded-md border border-stone-200 bg-stone-100 no-underline">
            <div class="h-28 flex-none overflow-hidden">
              <img v-if="s.art" :src="s.art.src" alt="" :style="{ objectPosition: s.art.position }" class="size-full object-cover [image-rendering:pixelated] transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none" />
            </div>
            <div class="flex flex-1 flex-col gap-1 p-5">
              <span class="text-xs leading-[14px] font-semibold tracking-[0.14em] text-primary uppercase">Step {{ s.n }}</span>
              <span class="text-xs text-stone-600">{{ s.ask }}</span>
              <span class="font-heading text-xl leading-7 font-semibold text-default"><Tb :text="s.program.en.name" /></span>
              <span class="mt-auto flex items-center justify-between gap-3 pt-4">
                <span class="text-xs text-stone-500">{{ s.meta }}</span>
                <span class="flex size-9 flex-none items-center justify-center rounded-full bg-black text-white transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true">
                  <UIcon name="i-lucide-arrow-right" class="size-5" />
                </span>
              </span>
            </div>
          </PrototypeLink>
        </li>
      </ol>
    </section>

    <section class="flex flex-col gap-6 pt-10" aria-labelledby="d-all">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="flex flex-col gap-3">
          <span :class="eyebrow">Catalogue</span>
          <h2 id="d-all" class="text-4xl text-highlighted">All programs</h2>
        </div>
      </div>
      <QuickFilters :filters="f" />
      <div v-if="shown.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CatalogCard v-for="p in shown" :key="p.id" :program="p" :to="aboutPath" />
      </div>
      <p v-else class="py-10 text-center text-sm text-muted">No programs match. <button type="button" class="font-medium text-highlighted underline" @click="f.clear()">Clear all</button></p>
    </section>

    <section class="mt-6 flex flex-col gap-6 rounded-lg bg-black p-6 text-white md:flex-row md:items-center md:justify-between md:p-10" aria-labelledby="d-teach">
      <div class="flex max-w-[560px] flex-col gap-3">
        <span class="text-[11px] leading-[14px] font-semibold tracking-[0.14em] text-stone-400 uppercase">For educators</span>
        <h2 id="d-teach" class="text-3xl tracking-[-0.02em] text-white">Bring these programs to your learners.</h2>
        <p class="text-lg text-stone-300">A playbook for every session, training, and a path to an ASU facilitator microcredential.</p>
      </div>
      <UButton size="xl" label="Create an educator account" trailing-icon="i-lucide-arrow-right" class="flex-none self-start rounded-full md:self-center" @click="teachOpen = true" />
    </section>

    <template #overlay>
      <EducatorAccountModal v-model:open="teachOpen" :signed-in="false" />
    </template>
  </AppFrame>
</template>
