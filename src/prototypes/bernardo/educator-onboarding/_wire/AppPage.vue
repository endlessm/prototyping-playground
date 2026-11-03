<script setup lang="ts">
import TeamSwitcher from './TeamSwitcher.vue'
import s from './wire.module.css'

// Studio pages: sidebar, top bar with the team name, content, and an optional modal or wizard over them (the overlay slot).
withDefaults(defineProps<{ team: string; active?: 'Team Dashboard' | 'Cohorts' }>(), {
  active: 'Team Dashboard',
})

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
        <span :class="s.avatar">MO</span>
      </div>
      <nav :class="s.sidebar">
        <div v-for="[group, items] in nav" :key="group" :class="[s.stack, s.tight]">
          <span :class="s.navGroup">{{ group }}</span>
          <span v-for="item in items" :key="item" :class="[s.navItem, item === active && s.navActive]">
            {{ item }}
          </span>
        </div>
      </nav>
      <main :class="s.content"><slot /></main>
      <slot name="overlay" />
    </div>
  </div>
</template>
