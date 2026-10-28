<!-- @studio-id vhme000000000001 -->
<script setup lang="ts">
// Nothing is imported: Vue, Nuxt UI and the system's stand-ins are
// auto-imports, as in the Endless Studios app.
const { $i18n } = useNuxtApp()
const count = ref(0)
const menu = [[{ label: 'Profile' }, { label: 'Sign out' }]]
</script>

<template>
  <UCard class="m-6">
    <template #header>
      <h1 class="font-heading text-xl">{{ $t('welcome_back') }}</h1>
    </template>
    <p>Locale: {{ $i18n.locale.value }}</p>
    <div class="mt-4 flex gap-2">
      <UButton icon="i-lucide-rocket" @click="count++">Start</UButton>
      <UDropdownMenu :items="menu">
        <UButton color="neutral" variant="outline">Menu</UButton>
      </UDropdownMenu>
    </div>
    <p>Started {{ count }} times</p>
  </UCard>
</template>
