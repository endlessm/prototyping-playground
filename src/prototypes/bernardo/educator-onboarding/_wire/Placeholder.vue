<script setup lang="ts">
import s from './wire.module.css'

// A grey box standing for something outside this wireframe.
defineProps<{ height: number }>()
</script>

<template>
  <div :class="s.placeholder" :style="{ height: `${height}px` }"><slot /></div>
</template>
