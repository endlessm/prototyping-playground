<script setup lang="ts">
import s from './ui.module.css'

// Something outside this flow, such as the Cohort Dashboard, drawn as a quiet card with an icon and its name.
withDefaults(defineProps<{ height: number; icon?: string }>(), { icon: 'i-lucide-layout-dashboard' })
</script>

<template>
  <div :class="s.placeholder" :style="{ height: `${height}px` }">
    <UIcon :name="icon" class="size-6 text-dimmed" />
    <slot />
  </div>
</template>
