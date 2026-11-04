<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import TeamSwitcher from './TeamSwitcher.vue'
import s from './wire.module.css'

// Studio pages: sidebar, top bar with the team name, content, and an optional modal or wizard over them (the overlay slot).
// `links` sends sidebar items to views of this prototype; the others stay plain text.
withDefaults(
  defineProps<{ team: string; active?: 'Team Dashboard' | 'Cohorts'; /** Who is signed in, shown in the top bar. */ initials?: string; links?: Partial<Record<'Team Dashboard' | 'Cohorts', string>> }>(),
  { active: 'Team Dashboard', initials: 'MO' },
)

const nav = [
  ['TEACH', ['Team Dashboard', 'Cohorts']],
  ['LEARNING', ['My Programs', 'Resources']],
  ['PLAY', ['Explore Games', 'My Projects']],
] as const
</script>

<template>
  <div :class="s.page">
    <div :class="s.app">
      <div :class="s.brand">∞ Endless</div>
      <div :class="s.topBar">
        <TeamSwitcher :team="team" />
        <span :class="s.avatar">{{ initials }}</span>
      </div>
      <nav :class="s.sidebar">
        <div v-for="[group, items] in nav" :key="group" :class="[s.stack, s.tight]">
          <span :class="s.navGroup">{{ group }}</span>
          <template v-for="item in items" :key="item">
            <PrototypeLink
              v-if="links?.[item as 'Team Dashboard' | 'Cohorts']"
              :to="links[item as 'Team Dashboard' | 'Cohorts']!"
              :class="[s.navItem, item === active && s.navActive]"
              style="color: inherit; text-decoration: none"
            >
              {{ item }}
            </PrototypeLink>
            <span v-else :class="[s.navItem, item === active && s.navActive]">{{ item }}</span>
          </template>
        </div>
      </nav>
      <main :class="s.content"><slot /></main>
      <slot name="overlay" />
    </div>
  </div>
</template>
