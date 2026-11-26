<script setup lang="ts">
// The search box the alternatives share, the same field as the list's toolbar.
const search = defineModel<string>({ required: true })
</script>

<template>
  <UInput
    v-model="search"
    icon="i-lucide-search"
    placeholder="Search Teams, Cohorts or people"
    aria-label="Search the structure"
    class="w-full sm:w-72"
  >
    <template v-if="search" #trailing>
      <UButton icon="i-lucide-x" color="neutral" variant="link" size="sm" aria-label="Clear search" @click="search = ''" />
    </template>
  </UInput>
</template>
