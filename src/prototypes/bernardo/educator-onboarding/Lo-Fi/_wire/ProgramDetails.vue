<script setup lang="ts">
import type { Program } from './cohort'
import TextLink from './TextLink.vue'
import s from './wire.module.css'

// The selected program in full, beside the list: what learners make, the skills, and the first workshops.
defineProps<{ program: Program | null }>()
</script>

<template>
  <div
    v-if="!program"
    :class="s.placeholder"
    style="height: 260px; font-size: 12px; color: #666; background: #fafafa"
  >
    Select a program to see what's inside.
  </div>
  <div v-else :class="[s.card, s.stack]" style="gap: 12px" aria-live="polite">
    <span :class="s.placeholder" style="height: 96px; font-size: 11px; color: #999; border: 0">Cover</span>
    <div :class="[s.stack, s.tight]">
      <strong style="font-size: 14px">{{ program.name }}</strong>
      <span :class="s.small" style="font-size: 12px">{{ program.about }}</span>
    </div>
    <div :class="[s.row, s.wrap]" style="gap: 6px">
      <span :class="s.badge">{{ program.short.split(' · ')[0] }}</span>
      <span v-if="program.short.includes('Ages')" :class="s.badge">{{ program.short.split(' · ')[1] }}</span>
      <span v-if="program.school" :class="s.badge">Reviewed for school use</span>
    </div>
    <div :class="[s.stack, s.tight]">
      <span :class="s.label">Skills</span>
      <span :class="s.small" style="font-size: 12px">{{ program.skills.join(' · ') }}</span>
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
