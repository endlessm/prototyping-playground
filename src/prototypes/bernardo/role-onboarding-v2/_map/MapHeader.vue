<script setup lang="ts">
import logo from '~/assets/images/logo-endless.svg'

// The view's top bar: the title and what the map shows, any controls in the middle, and the Proposed label.
</script>

<template>
  <header class="flex h-15 shrink-0 items-center justify-between gap-6 border-b border-default bg-default px-5">
    <div class="flex min-w-0 items-center gap-3.5">
      <img :src="logo" alt="Endless" class="h-[18px] w-auto" />
      <span class="h-6 w-px shrink-0 bg-accented" aria-hidden="true" />
      <h1 class="font-heading text-lg font-bold tracking-tight whitespace-nowrap text-highlighted">Roles Map</h1>
      <p class="truncate text-sm text-dimmed">How people, Teams and Cohorts grow inside an Organization</p>
    </div>
    <slot />
    <UBadge color="warning" variant="soft" size="md" class="shrink-0">Proposed model · 12 Nov 2026</UBadge>
  </header>
</template>
