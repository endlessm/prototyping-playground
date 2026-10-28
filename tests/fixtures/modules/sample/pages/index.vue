<script setup lang="ts">
const module = useStudioModule('sample')
const { data: notes } = useModuleData<string[]>('sample', 'notes')
</script>

<template>
  <UDashboardPanel id="sample">
    <template #header>
      <UDashboardNavbar :title="module?.label" />
    </template>
    <template #body>
      <ul :aria-label="module?.label">
        <li v-for="note in notes ?? []" :key="note">{{ note }}</li>
      </ul>
    </template>
  </UDashboardPanel>
</template>
