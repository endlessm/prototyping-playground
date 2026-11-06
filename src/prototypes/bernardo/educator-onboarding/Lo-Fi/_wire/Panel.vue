<script setup lang="ts">
import s from './wire.module.css'
</script>

<template>
  <div :class="[s.panel, s.stack, s.tight]"><slot /></div>
</template>
