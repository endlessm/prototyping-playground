<script setup lang="ts">
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import SystemDocumentPage from '../components/SystemDocumentPage.vue'

// One of a system's Skills documents.
defineProps<{ system: SystemCatalog }>()
</script>

<template>
  <SystemDocumentPage :system="system" section="skills" />
</template>
