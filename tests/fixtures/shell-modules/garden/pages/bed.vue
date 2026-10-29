<script lang="ts">
import { h } from 'vue'
import AppFileBoundary from '../../../../../app/components/AppFileBoundary.vue'
import GardenSection from '../components/GardenSection.vue'

// Counts across visits, so the flaky bed fails only the first time.
let flakyVisits = 0
</script>

<script setup lang="ts">
const route = useRoute()
const toast = useStudioToast()
const bed = String(route.params.bed)
const title = bed.charAt(0).toUpperCase() + bed.slice(1)

if (bed === 'slow') await new Promise((resolve) => setTimeout(resolve, 1500))
if (bed === 'flaky' && ++flakyVisits === 1)
  throw new Error('The flaky bed is not ready.')

const Soil = () => {
  if (bed === 'broken') throw new Error('The broken bed has no soil.')
  return h('p', 'Good soil.')
}
</script>

<template>
  <GardenSection>
    <h1 class="text-lg font-semibold">{{ title }}</h1>
    <UButton
      v-if="bed === 'rose'"
      label="Water the rose"
      class="self-start"
      @click="toast.success('Rose watered')"
    />
    <AppFileBoundary>
      <Soil />
    </AppFileBoundary>
    <p v-for="row in 60" :key="row">Row {{ row }}</p>
  </GardenSection>
</template>
