<script setup lang="ts">
import s from './wire.module.css'

defineProps<{ tone?: 'solid' | 'outline' }>()
</script>

<template>
  <span :class="[s.badge, tone === 'solid' && s.badgeSolid, tone === 'outline' && s.badgeOutline]"><slot /></span>
</template>
