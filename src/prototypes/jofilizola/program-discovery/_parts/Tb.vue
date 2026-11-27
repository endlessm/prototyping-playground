<script setup lang="ts">
import { computed } from 'vue'

// Threadbare is always italic: the name of the game, as a title is. Renders any text with every "Threadbare" in <em>.
const props = defineProps<{ text: string }>()
const parts = computed(() => props.text.split(/(Threadbare)/g).filter(Boolean))
</script>

<template>
  <template v-for="(part, i) in parts" :key="i"><em v-if="part === 'Threadbare'">{{ part }}</em><template v-else>{{ part }}</template></template>
</template>
