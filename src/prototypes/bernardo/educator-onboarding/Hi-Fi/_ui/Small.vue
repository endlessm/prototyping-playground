<script setup lang="ts">
import s from './ui.module.css'
</script>

<template>
  <p :class="s.small"><slot /></p>
</template>
