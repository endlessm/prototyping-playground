<script setup lang="ts">
import s from './wire.module.css'

// A short quote from an educator, to show how others use a step.
defineProps<{ quote: string; who: string }>()
</script>

<template>
  <figure :class="s.testimonial">
    <blockquote>“{{ quote }}”</blockquote>
    <figcaption :class="s.small">{{ who }}</figcaption>
  </figure>
</template>
