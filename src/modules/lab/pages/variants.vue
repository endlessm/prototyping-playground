<script setup lang="ts">
import { useLabComponent } from '../composables/useLabComponent'

// Variants: every example of the component side by side. Until they are
// laid out here, it says where they show today.
const { component } = useLabComponent()
const { t } = useI18n()
</script>

<template>
  <p class="text-sm text-muted">
    {{ t('lab.variants.soon', { name: component.title }) }}
  </p>
</template>
