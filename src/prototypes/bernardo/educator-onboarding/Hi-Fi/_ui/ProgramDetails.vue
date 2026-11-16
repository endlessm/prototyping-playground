<script setup lang="ts">
import gameBuilt from '~/assets/images/games/game-built.png'
import gameDefault from '~/assets/images/games/endstar-default.jpg'
import type { Program } from './cohort'
import Marker from './Marker.vue'
import TextLink from './TextLink.vue'
import s from './ui.module.css'

// The selected program in full, beside the list: what learners make, the skills, the first workshops, and what
// learners get, which differs by program (a certificate, an open class, how they join).
// The default slot shows a note at the card's top, such as why this program is already selected.
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
    <slot />
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
      <span v-if="program.more" :class="s.small">+ {{ program.more }} more</span>
    </div>
    <div :class="[s.stack, s.tight]">
      <span :class="[s.label, s.row]">What your learners get <Marker :flow="4" :n="3" /></span>
      <ul :class="s.bullets" style="padding-left: 18px">
        <li v-for="item in program.gets" :key="item">{{ item }}</li>
      </ul>
    </div>
    <TextLink v-if="program.guide">Preview the teacher guide</TextLink>
  </div>
</template>
