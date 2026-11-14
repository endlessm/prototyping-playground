<script setup lang="ts">
import s from './wire.module.css'

// Tabs that switch in place. The page keeps the chosen tab.
defineProps<{ tabs: string[] }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <div :class="s.roTabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab"
      type="button"
      role="tab"
      :aria-selected="tab === model"
      @click="model = tab"
    >
      {{ tab }}
    </button>
  </div>
</template>
