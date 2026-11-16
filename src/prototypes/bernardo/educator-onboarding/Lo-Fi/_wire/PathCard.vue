<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import s from './wire.module.css'

// One thing a new account can do on Endless: an illustration (a placeholder for now), a title and two lines.
// With a destination the whole card opens it; without one the card is off (a path this prototype doesn't follow).
defineProps<{ title: string; to?: string }>()
</script>

<template>
  <component
    :is="to ? PrototypeLink : 'div'"
    :to="to"
    :class="[s.path, !to && s.pathOff]"
    :aria-disabled="to ? undefined : 'true'"
  >
    <div :class="s.pathArt">Illustration</div>
    <div :class="[s.stack, s.tight]">
      <h2 :class="s.subtitle">{{ title }}</h2>
      <p :class="s.pathText"><slot /></p>
    </div>
  </component>
</template>
