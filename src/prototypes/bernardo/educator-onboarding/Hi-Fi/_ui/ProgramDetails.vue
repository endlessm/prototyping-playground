<script setup lang="ts">
import gameBuilt from '~/assets/images/games/game-built.png'
import gameDefault from '~/assets/images/games/endstar-default.jpg'
import type { Program } from './cohort'
import TextLink from './TextLink.vue'
import s from './ui.module.css'

// The selected program in full, beside the list: what learners make, the skills, and the first workshops.
defineProps<{ program: Program | null }>()

// Threadbare shows game art from the app; the others use the app's default game image until they have their own.
const covers: Record<string, string> = { 'Explore: Threadbare': gameBuilt }
</script>

<template>
  <div
    v-if="!program"
    :class="s.placeholder"
    style="height: 260px; color: var(--es-dimmed); background: var(--es-canvas)"
  >
    Select a program to see what's inside.
  </div>
  <div v-else :class="[s.card, s.stack]" style="gap: 12px" aria-live="polite">
    <img
      :src="covers[program.name] ?? gameDefault"
      :alt="`${program.name} cover`"
      style="display: block; width: 100%; height: 160px; object-fit: cover; border-radius: 16px"
    />
    <div :class="[s.stack, s.tight]">
      <strong >{{ program.name }}</strong>
      <span :class="s.small" >{{ program.about }}</span>
    </div>
    <div :class="[s.row, s.wrap]" style="gap: 6px">
      <span :class="s.badge">{{ program.short.split(' · ')[0] }}</span>
      <span v-if="program.short.includes('Ages')" :class="s.badge">{{ program.short.split(' · ')[1] }}</span>
      <span v-if="program.school" :class="s.badge">Reviewed for school use</span>
    </div>
    <div :class="[s.stack, s.tight]">
      <span :class="s.label">Skills</span>
      <span :class="s.small" >{{ program.skills.join(' · ') }}</span>
    </div>
    <div :class="[s.stack, s.tight]">
      <span :class="s.label">Workshops, unlocked as you go</span>
      <ol :class="s.bullets" style="padding-left: 18px">
        <li v-for="workshop in program.workshops" :key="workshop">{{ workshop }}</li>
      </ol>
      <span :class="s.small">+ {{ program.more }} more</span>
    </div>
    <TextLink>Preview the teacher guide</TextLink>
  </div>
</template>
