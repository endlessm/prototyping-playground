<script setup lang="ts">
import { useStorage } from '@vueuse/core'

// The panel every section's navigation is built in, beside the page: a
// header (the section's title by default), then a list or tree. Showing and
// hiding it (the rail's toggle or ⌘;) and its width apply to every section
// and are remembered in this browser. Drag its edge to resize it, or focus
// the edge and use the arrow keys; double-click or Enter resets it.
const props = defineProps<{
  /** The section's name: its landmark's name and default title. */
  label: string
}>()

const { t } = useI18n()
const { open, register } = useSectionNav()
const { width } = SECTION_NAV

// Present even while hidden, so the rail can offer to show it again.
onMounted(() => onBeforeUnmount(register()))

// The dashboard sidebar keeps its size here; the keyboard writes the same
// entry, and VueUse keeps the two in step.
const stored = useStorage(
  `${SECTION_NAV.storageKey}-sidebar-${SECTION_NAV.id}`,
  { size: width.default, collapsed: false },
  undefined,
  { mergeDefaults: true },
)
const size = computed(() => Math.round(stored.value.size))
const clamp = (value: number) =>
  Math.min(width.max, Math.max(width.min, Math.round(value)))
const resize = (value: number) => {
  stored.value = { ...stored.value, size: clamp(value) }
}

function onKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? 24 : 8
  const next = {
    ArrowLeft: size.value - step,
    ArrowRight: size.value + step,
    Home: width.min,
    End: width.max,
    Enter: width.default,
  }[event.key]
  if (next === undefined) return
  event.preventDefault()
  resize(next)
}

// While dragging, the resize cursor stays everywhere and text isn't
// selected.
function dragging(start: (event: MouseEvent) => void) {
  return (event: MouseEvent) => {
    if (event.button !== 0) return
    const { style } = document.body
    style.cursor = 'col-resize'
    style.userSelect = 'none'
    document.addEventListener(
      'mouseup',
      () => {
        style.cursor = ''
        style.userSelect = ''
      },
      { once: true },
    )
    start(event)
  }
}
</script>

<template>
  <UDashboardSidebar
    v-if="open"
    :id="SECTION_NAV.id"
    role="complementary"
    :aria-label="props.label"
    resizable
    :min-size="width.min"
    :max-size="width.max"
    :default-size="width.default"
    :toggle="false"
    :ui="{
      root: 'flex min-h-0 bg-elevated/25',
      header: 'h-auto min-h-12 px-4 pt-3',
      body: 'gap-2 px-2',
    }"
  >
    <template #header>
      <slot name="header">
        <h2 class="truncate text-sm font-semibold text-highlighted">
          {{ props.label }}
        </h2>
      </slot>
    </template>
    <slot />
    <template #resize-handle="{ onMouseDown, onTouchStart, onDoubleClick }">
      <div
        role="separator"
        aria-orientation="vertical"
        :aria-label="t('sectionNav.resize', { section: label.toLowerCase() })"
        :aria-valuenow="size"
        :aria-valuemin="width.min"
        :aria-valuemax="width.max"
        :title="t('sectionNav.resizeHint')"
        tabindex="0"
        class="relative z-10 w-0 shrink-0 cursor-col-resize touch-none outline-none select-none before:absolute before:inset-y-0 before:-right-1.5 before:-left-1.5 after:absolute after:inset-y-0 after:-left-px after:w-0.5 after:transition-colors hover:after:bg-accented focus-visible:after:bg-primary"
        @mousedown="dragging(onMouseDown)($event)"
        @touchstart="onTouchStart"
        @dblclick="onDoubleClick"
        @keydown="onKeydown"
      />
    </template>
  </UDashboardSidebar>
</template>
