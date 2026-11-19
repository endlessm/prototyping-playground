<script setup lang="ts">
import type { Component } from 'vue'

const {
  icon,
  symbolKey,
  tag = 'svg',
} = defineProps<{
  icon: Component
  symbolKey: string
  tag?: 'svg' | 'g'
}>()

const svgRef = useSvgSymbolsContainer(symbolKey)
</script>

<template>
  <component :is="tag">
    <component :is="icon" :ref="svgRef" width="100%" height="100%" />
  </component>
</template>
