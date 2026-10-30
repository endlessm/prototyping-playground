<script setup lang="ts">
import GuidanceNav from './GuidanceNav.vue'

// Context & Skills' frame: the navigation beside the open document. Each
// document starts at the top.
const route = useRoute()
const page = useTemplateRef<HTMLElement>('page')
watch(
  () => route.path,
  () => page.value?.closest('[data-slot="body"]')?.scrollTo({ top: 0 }),
  { flush: 'post' },
)
</script>

<template>
  <GuidanceNav />
  <UDashboardPanel id="guidance-page">
    <template #body>
      <div ref="page" class="contents">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
