<!-- @studio-id wvb4ew1ethbn0s14 -->
<script setup lang="ts">
import { usePrototypeNavigate } from '#studio/prototype'

// The prototype's front page. It uses the Endless Studios system's fonts and components in white and shades of one
// colour, the app's Learn blue, so it reads as a page about the product, not a product screen. Contrast, all above WCAG AA:
// white on blue-800 14.5:1, blue-200 on blue-800 8.5:1, blue-900 and blue-700 on white 18.4:1 and 9.5:1,
// white on the blue-700 button 9.5:1, blue-900 on the blue-300 badge 8.4:1.
const navigate = usePrototypeNavigate()

const audiences = [
  { folder: '1 Guest', title: 'Guest', who: 'Signed out. Every join asks them to sign up; Teach asks them to create an educator account.', icon: 'i-lucide-user-round' },
  { folder: '2 Independent learner', title: 'Independent learner', who: 'Noah, 18, in no organization. Applies to a live group, starts self-paced or uses a code.', icon: 'i-lucide-compass' },
  { folder: '3 Learner in an organization', title: 'Learner in an organization', who: 'Ben, 15, at Maple Ridge Secondary School. Sees his school’s group first. Under 18, so no Teach prompt.', icon: 'i-lucide-school' },
  { folder: '4 Educator', title: 'Educator', who: 'Evelyn, Org Educator at Maple Ridge. Teach in the menu, which programs she can run, how to start a cohort, her training.', icon: 'i-lucide-presentation' },
]
const problems = [
  'Learners and educators can’t tell what a program is, how long it takes, who it’s for, or what the community looks like.',
  'Educators can’t tell which programs they’re allowed to run, or which ones are training.',
]
</script>

<template>
  <div class="min-h-screen bg-blue-800">
    <div class="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 md:px-8 md:py-16">
      <header class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge color="neutral" variant="solid" label="Proposed" class="bg-blue-300 text-blue-900" />
          <span class="text-sm font-medium text-blue-200">Programs catalogue and About page</span>
        </div>
        <h1 class="text-4xl font-semibold text-white lg:text-5xl">Program discovery</h1>
        <p class="max-w-3xl text-lg text-blue-200">
          A redesign of the Programs catalogue and a program’s About page, for four people. Every card and page shows
          format, time, level, language and partner, and the catalogue filters by them.
        </p>
      </header>

      <UCard variant="outline" class="bg-white ring-blue-100" :ui="{ body: 'flex flex-col gap-3' }">
        <h2 class="text-lg font-semibold text-blue-900">The problem today</h2>
        <ul class="flex flex-col gap-2">
          <li v-for="p in problems" :key="p" class="flex items-start gap-3 text-sm text-blue-700">
            <UIcon name="i-lucide-circle-alert" class="mt-0.5 size-5 flex-none text-blue-600" />{{ p }}
          </li>
        </ul>
      </UCard>

      <section class="flex flex-col gap-4" aria-labelledby="screens">
        <div class="flex items-baseline justify-between gap-3">
          <h2 id="screens" class="text-2xl font-semibold text-white">Screens</h2>
          <span class="text-sm text-blue-200">4 people · 8 screens</span>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UCard v-for="a in audiences" :key="a.folder" variant="outline" class="bg-white ring-blue-100" :ui="{ body: 'flex h-full flex-col gap-3' }">
            <div class="flex items-center gap-3">
              <div class="flex size-10 flex-none items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <UIcon :name="a.icon" class="size-5" />
              </div>
              <h3 class="text-lg font-semibold text-blue-900">{{ a.title }}</h3>
            </div>
            <p class="text-sm text-blue-700">{{ a.who }}</p>
            <div class="mt-auto flex flex-wrap gap-2 pt-1">
              <UButton color="neutral" size="sm" class="bg-blue-700 text-white hover:bg-blue-600" icon="i-lucide-house" label="Workshop" @click="navigate(`${a.folder}/Workshop`)" />
              <UButton color="neutral" size="sm" variant="outline" class="bg-transparent text-blue-700 ring-blue-300 hover:bg-blue-50" icon="i-lucide-layout-grid" label="Catalogue" @click="navigate(`${a.folder}/Catalogue`)" />
              <UButton color="neutral" variant="outline" size="sm" class="bg-transparent text-blue-700 ring-blue-300 hover:bg-blue-50" icon="i-lucide-file-text" label="About page" @click="navigate(`${a.folder}/About Core Threadbare`)" />
            </div>
          </UCard>
        </div>
      </section>

      <p class="flex items-start gap-2 text-sm text-blue-200">
        <UIcon name="i-lucide-info" class="mt-0.5 size-4 flex-none" />
        Only Core: <em>Threadbare</em> has an About page here, so every catalogue card opens it. Weekly times, community numbers,
        StoryQuests and the programs marked “Sample details” are made up for the prototype.
      </p>
    </div>
  </div>
</template>
