<script setup lang="ts">
import AppLoadError from '../components/AppLoadError.vue'
import AppRail from '../components/AppRail.vue'
import { SECTION_NAV } from '../composables/useSectionNav'

// Every page's frame: the rail, then the page, which may put its section
// navigation first. The page area scrolls on its own; the window never
// does. A page that fails to load says so inside the frame.
const { toggle } = useSectionNav()

// ⌘; (Ctrl+; elsewhere) shows or hides the section navigation. It is
// handled before an editor's own keys.
useEventListener(
  window,
  'keydown',
  (event: KeyboardEvent) => {
    if (!sectionNavShortcut(event)) return
    event.preventDefault()
    event.stopPropagation()
    toggle()
  },
  { capture: true },
)
</script>

<template>
  <UDashboardGroup
    unit="px"
    storage="local"
    :storage-key="SECTION_NAV.storageKey"
  >
    <AppRail />
    <NuxtErrorBoundary>
      <slot />
      <template #error="{ error, clearError }">
        <UDashboardPanel id="load-error">
          <template #body>
            <AppLoadError :error="error" @retry="clearError()" />
          </template>
        </UDashboardPanel>
      </template>
    </NuxtErrorBoundary>
  </UDashboardGroup>
</template>
