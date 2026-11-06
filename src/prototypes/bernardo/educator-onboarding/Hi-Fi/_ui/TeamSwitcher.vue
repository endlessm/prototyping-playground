<script setup lang="ts">
import { ref } from 'vue'
import s from './ui.module.css'

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
      <UIcon :name="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed" />
    </button>
    <div v-if="open" :class="s.teamMenu">
      <span :class="s.navGroup">Your teams</span>
      <button type="button" aria-current="true">
        {{ team }}
        <UIcon name="i-lucide-check" class="size-4" />
      </button>
      <hr />
      <button type="button" style="justify-content: flex-start"><UIcon name="i-lucide-plus" class="size-4" />Create Another Team</button>
    </div>
  </div>
</template>
