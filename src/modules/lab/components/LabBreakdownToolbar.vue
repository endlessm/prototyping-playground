<script setup lang="ts">
// The Breakdown's toolbar, a pill at the bottom centre of the canvas: zoom
// out, the zoom as a percentage, zoom in; the selected piece's name and,
// after it, room for that piece's knobs (the `inspector` slot); Reset and
// Save while the breakdown shows (the `actions` slot); then the button that
// switches between the component alone and its breakdown.
defineProps<{
  zoom: number
  mode: 'breakdown' | 'component'
  /** The selected piece's name, or none. */
  selected: string | null
}>()
const emit = defineEmits<{ zoomIn: []; zoomOut: []; toggle: [] }>()
const { t } = useI18n()
</script>

<template>
  <div
    role="toolbar"
    :aria-label="t('lab.breakdown.toolbar')"
    class="flex max-w-[calc(100%-2rem)] items-center gap-1 rounded-full border border-default bg-default/95 p-1 shadow-lg backdrop-blur"
    @pointerdown.stop
    @click.stop
  >
    <UButton
      icon="i-lucide-zoom-out"
      color="neutral"
      variant="ghost"
      size="sm"
      class="rounded-full"
      :aria-label="t('lab.breakdown.zoomOut')"
      @click="emit('zoomOut')"
    />
    <span
      class="w-12 text-center font-mono text-xs text-muted tabular-nums"
      role="status"
      :aria-label="
        t('lab.breakdown.zoom', { percent: `${Math.round(zoom * 100)}%` })
      "
      >{{ Math.round(zoom * 100) }}%</span
    >
    <UButton
      icon="i-lucide-zoom-in"
      color="neutral"
      variant="ghost"
      size="sm"
      class="rounded-full"
      :aria-label="t('lab.breakdown.zoomIn')"
      @click="emit('zoomIn')"
    />
    <template v-if="selected && mode === 'breakdown'">
      <USeparator orientation="vertical" class="h-5" />
      <span
        class="max-w-48 shrink-0 truncate px-2 text-xs font-semibold text-highlighted"
        :aria-label="`${t('lab.breakdown.selected')}: ${selected}`"
        >{{ selected }}</span
      >
      <slot name="inspector" />
    </template>
    <template v-if="mode === 'breakdown' && $slots.actions">
      <USeparator orientation="vertical" class="h-5" />
      <slot name="actions" />
    </template>
    <USeparator orientation="vertical" class="h-5" />
    <UButton
      :icon="mode === 'breakdown' ? 'i-lucide-square' : 'i-lucide-network'"
      color="neutral"
      variant="ghost"
      size="sm"
      class="rounded-full"
      :aria-label="
        mode === 'breakdown'
          ? t('lab.breakdown.showComponent')
          : t('lab.breakdown.showBreakdown')
      "
      @click="emit('toggle')"
    />
  </div>
</template>
