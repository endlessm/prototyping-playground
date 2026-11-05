<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import logo from '~/assets/images/logo-endless-studios-orange.svg'
import TeamSwitcher from './TeamSwitcher.vue'
import s from './ui.module.css'

// Studio pages, laid out like the app's StudioLayout: sidebar, top bar with the team name, content, and an optional
// modal or wizard over them (the overlay slot). Teach is the proposed new group, in the app's orange beside Play
// (purple) and Learning (blue). `links` sends sidebar items to views of this prototype; the others stay plain text.
withDefaults(
  defineProps<{ team: string; active?: 'Team Dashboard' | 'Cohorts'; /** Who is signed in, shown in the top bar. */ initials?: string; links?: Partial<Record<'Team Dashboard' | 'Cohorts', string>> }>(),
  { active: 'Team Dashboard', initials: 'MO' },
)

const nav = [
  { group: 'Teach', icon: 'i-lucide-presentation', items: ['Team Dashboard', 'Cohorts'] },
  { group: 'Play', icon: 'i-lucide-gamepad-2', items: ['Explore Games', 'My Projects'] },
  { group: 'Learning', icon: 'i-lucide-brain', items: ['My Programs', 'Resources'] },
] as const
</script>

<template>
  <div :class="s.page">
    <div :class="s.app">
      <div :class="s.brand"><img :src="logo" alt="Endless Studios" :class="s.logo" /></div>
      <div :class="s.topBar">
        <TeamSwitcher :team="team" />
        <div class="flex items-center gap-2">
          <UButton icon="i-lucide-bell" color="neutral" variant="ghost" aria-label="Notifications" />
          <UAvatar :text="initials" size="md" class="bg-cornflower-50 text-cornflower-700" />
        </div>
      </div>
      <nav :class="s.sidebar">
        <div v-for="{ group, icon, items } in nav" :key="group" class="flex flex-col gap-0.5">
          <span :class="s.navGroup"><UIcon :name="icon" class="size-5" />{{ group }}</span>
          <template v-for="item in items" :key="item">
            <PrototypeLink
              v-if="links?.[item as 'Team Dashboard' | 'Cohorts']"
              :to="links[item as 'Team Dashboard' | 'Cohorts']!"
              :class="[s.navItem, item === active && s.navActive]"
              style="text-decoration: none"
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
