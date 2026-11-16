<script setup lang="ts">
import { useLabComponent } from '../composables/useLabComponent'

// Playground: the real component beside controls built from its props.
// Until the stage and controls are here, it says what will show.
const { component } = useLabComponent()
const { t } = useI18n()
</script>

<template>
  <p class="text-sm text-muted">
    {{ t('lab.playground.soon', { name: component.title }) }}
  </p>
</template>
