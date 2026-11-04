<script setup lang="ts">
import GardenSection from '../components/GardenSection.vue'

// A menu for the shell's menu tests.
const actions = [{ label: 'Water' }, { label: 'Prune' }]
</script>

<template>
  <GardenSection>
    <h1 class="text-lg font-semibold">The garden</h1>
    <UDropdownMenu :items="actions">
      <UButton
        label="Garden actions"
        icon="i-lucide-ellipsis"
        color="neutral"
        variant="ghost"
      />
    </UDropdownMenu>
  </GardenSection>
</template>
