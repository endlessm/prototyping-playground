<script setup lang="ts">
import AppLoadError from '../components/AppLoadError.vue'
import AppRail from '../components/AppRail.vue'
import { SECTION_NAV } from '../composables/useSectionNav'

// Every page's frame: the rail, then the page, which may put its section
// navigation first. The page area scrolls on its own; the window never
// does. A page that fails to load says so inside the frame.
const { toggle } = useSectionNav()
const palette = useCommandPalette()
const loadPalette = () => import('../components/CommandPaletteModal.vue')
useTimeoutFn(() => {
  void loadPalette()
}, 1500)
const paletteDialog = useOverlay().create(defineAsyncComponent(loadPalette))
watch(palette.open, (open) => {
  if (open)
    void paletteDialog.open().result.finally(() => {
      palette.open.value = false
    })
  else paletteDialog.close()
})
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (event.defaultPrevented || !paletteShortcut(event, palette.open.value))
    return
  event.preventDefault()
  if (palette.open.value) palette.open.value = false
  else palette.show()
})

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
