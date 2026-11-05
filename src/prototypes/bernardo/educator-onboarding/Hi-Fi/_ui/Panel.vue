<script setup lang="ts">
import s from './ui.module.css'
</script>

<template>
  <div :class="[s.panel, s.stack, s.tight]"><slot /></div>
</template>
