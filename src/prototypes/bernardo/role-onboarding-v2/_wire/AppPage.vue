<script setup lang="ts">
import { ref } from 'vue'
import CreateTeamModal from './CreateTeamModal.vue'
import { places, roles, type RoleKey } from './world'
import s from './wire.module.css'

// Studio pages: sidebar, top bar, content, and an optional modal over them (the overlay slot). The top bar's switcher
// names the place on screen and the viewer's role in it, and lists every place where they hold a role, one role each:
// one account often holds several, at different levels and in more than one Organization or Independent Team.
// The Teach group shows a level only to people who hold a teaching role there; a place where they are a learner
// doesn't count. Create an Independent Team, at the foot of the switcher, is there for every educator: the switcher
// sits above every place, so a Team made from it belongs to no Organization, whatever roles its creator holds
// elsewhere. Org Teams are created from the Organization's Teams tab.
const props = defineProps<{
  viewer: RoleKey
  place: string
  /** Roles gained during the flow, such as the Team Owner of a Team just created. */
  extra?: (typeof places)[RoleKey]
  /** Starts with Create a Team open, from the switcher, with this choice. */
  creating?: 'org' | 'independent'
  /** Where Create Team goes; without it the modal just closes. */
  createdTo?: string
  flow?: number
  note?: number
}>()

const role = roles[props.viewer]
const mine = [...places[props.viewer], ...(props.extra ?? [])]
const order = ['Organization', 'Team', 'Cohort'] as const
const levels = order.filter((level) => mine.some((p) => !p.learner && p.level === level))
const label = { Organization: 'Organization', Team: 'Teams', Cohort: 'Cohorts' } as const
const active = mine.find((p) => p.name === props.place)?.level ?? role.level

const open = ref(false)
const creating = ref(props.creating)

function closeOnLeave(event: FocusEvent) {
  const root = event.currentTarget as HTMLElement
  if (!root.contains(event.relatedTarget as Node | null)) open.value = false
}
</script>

<template>
  <div :class="s.page">
    <div :class="s.app">
      <div :class="s.brand">∞ Endless</div>
      <div :class="s.topBar">
        <div :class="s.teamSwitcher" @focusout="closeOnLeave" @keydown.escape="open = false">
          <button type="button" :class="s.teamButton" :aria-expanded="open" @click="open = !open">
            {{ place }}
            <span :class="s.badge">{{ mine.find((p) => p.name === place)?.role ?? role.label }}</span>
            <span aria-hidden="true">{{ open ? '▴' : '▾' }}</span>
          </button>
          <div v-if="open" :class="[s.teamMenu, s.roPlaceMenu]">
            <span :class="s.navGroup">YOUR PLACES</span>
            <button v-for="p in mine" :key="p.name" type="button" :aria-current="p.name === place || undefined">
              {{ p.name }}
              <small>{{ p.role }}{{ p.independent ? ' · Independent' : '' }}</small>
            </button>
            <hr />
            <button type="button" @click="creating = 'independent'; open = false">
              + Create an Independent Team
              <small>Its own place, outside any Organization</small>
            </button>
          </div>
        </div>
        <span :class="s.avatar">{{ role.person.initials }}</span>
      </div>
      <nav :class="s.sidebar">
        <div :class="[s.stack, s.tight]">
          <span :class="s.navGroup">TEACH</span>
          <span v-for="level in levels" :key="level" :class="[s.navItem, level === active && s.navActive]">
            {{ label[level] }}
          </span>
        </div>
        <div :class="[s.stack, s.tight]">
          <span :class="s.navGroup">LEARNING</span>
          <span :class="s.navItem">My Programs</span>
          <span :class="s.navItem">Resources</span>
        </div>
        <div :class="[s.stack, s.tight]">
          <span :class="s.navGroup">PLAY</span>
          <span :class="s.navItem">Explore Games</span>
          <span :class="s.navItem">My Projects</span>
        </div>
      </nav>
      <main :class="s.content"><slot /></main>
      <slot name="overlay" />
      <CreateTeamModal
        v-if="creating"
        :viewer="viewer"
        :where="creating"
        :independent-only="creating === 'independent'"
        :next="createdTo"
        :flow="flow"
        :note="note"
        @close="creating = undefined"
      />
    </div>
  </div>
</template>
