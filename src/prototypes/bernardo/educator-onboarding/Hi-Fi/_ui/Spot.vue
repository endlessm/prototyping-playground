<script setup lang="ts">
import s from './ui.module.css'

// A large icon in a soft tinted circle, heading a page or an empty state. Teal is only for youth-gated pages.
withDefaults(defineProps<{ icon: string; tone?: 'primary' | 'kids' | 'secondary' }>(), { tone: 'primary' })
</script>

<template>
  <span :class="[s.spot, s[`spot-${tone}`]]">
    <UIcon :name="icon" class="size-8" />
  </span>
</template>
