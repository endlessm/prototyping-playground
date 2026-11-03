<script setup lang="ts">
import { ref } from 'vue'
import s from './wire.module.css'

// The team name opens a menu to switch to another team or create one.
defineProps<{ team: string }>()

const open = ref(false)

function closeOnLeave(event: FocusEvent) {
  const root = event.currentTarget as HTMLElement
  if (!root.contains(event.relatedTarget as Node | null)) open.value = false
}
</script>

<template>
  <div :class="s.teamSwitcher" @focusout="closeOnLeave" @keydown.escape="open = false">
    <button type="button" :class="s.teamButton" :aria-expanded="open" @click="open = !open">
      {{ team }}
      <span aria-hidden="true">{{ open ? '▴' : '▾' }}</span>
    </button>
    <div v-if="open" :class="s.teamMenu">
      <span :class="s.navGroup">YOUR TEAMS</span>
      <button type="button" aria-current="true">
        {{ team }}
        <span aria-hidden="true">✓</span>
      </button>
      <hr />
      <button type="button">+ Create Another Team</button>
    </div>
  </div>
</template>
