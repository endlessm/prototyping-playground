<script setup lang="ts">
import s from './wire.module.css'
</script>

<template>
  <p :class="s.lead"><slot /></p>
</template>
