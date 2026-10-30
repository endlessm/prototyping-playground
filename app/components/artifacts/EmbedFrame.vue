<script setup lang="ts">
// One frame for previews in documents (and later canvases): rounded corners
// and a full-width header with the artifact's name, which opens it.
// Hovering or focusing the header reveals "Open".
defineProps<{
  title: string
  /** The artifact's page; without one the header is a plain label. */
  to?: string
}>()
const { t } = useI18n()
</script>

<template>
  <div
    class="relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-default bg-default"
  >
    <ULink
      v-if="to"
      :to="to"
      :aria-label="t('embed.openNamed', { name: title })"
      class="group/open flex h-9 shrink-0 items-center justify-between gap-2 border-b border-default bg-elevated/60 px-3 text-xs text-default transition-colors hover:bg-elevated focus-visible:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inverted focus-visible:ring-inset"
    >
      <span class="truncate font-semibold">{{ title }}</span>
      <span class="inline-flex shrink-0 items-center gap-1.5 font-medium">
        <span
          class="opacity-0 transition-opacity group-hover/open:opacity-100 group-focus-visible/open:opacity-100"
        >
          {{ t('embed.open') }}
        </span>
        <UIcon name="i-lucide-maximize-2" class="size-4 text-muted" />
      </span>
    </ULink>
    <div
      v-else
      class="flex h-9 shrink-0 items-center border-b border-default bg-elevated/60 px-3 text-xs font-semibold"
    >
      {{ title }}
    </div>
    <slot />
  </div>
</template>
