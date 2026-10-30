<script setup lang="ts">
import GuidanceFrame from '../../components/documentation/GuidanceFrame.vue'

// Context & Skills: the Platform's and enabled modules' guidance. The page
// keeps one key, so its navigation stays on screen, with its scroll, search
// and open branches, while documents and source mode change.
definePageMeta({ key: 'documentation-context' })
</script>

<template>
  <GuidanceFrame />
</template>
