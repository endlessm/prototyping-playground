<script setup lang="ts">
import s from './ui.module.css'

defineProps<{ items: string[] }>()
</script>

<template>
  <ul :class="s.bullets">
    <li v-for="(item, i) in items" :key="i">{{ item }}</li>
  </ul>
</template>
