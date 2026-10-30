<script setup lang="ts">
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import SystemSection from '../components/SystemSection.vue'

// The Context section of a system.
defineProps<{ system: SystemCatalog }>()
</script>

<template>
  <SystemSection :system="system" section="context" />
</template>
