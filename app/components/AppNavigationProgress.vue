<script setup lang="ts">
// "Opening page", bottom-right, when opening a page takes longer than 0.2 s.
// The current page stays on screen meanwhile; background refreshes don't
// show it.
const { t } = useI18n()
const { isLoading } = useLoadingIndicator({
  throttle: 200,
  hideDelay: 0,
  resetDelay: 0,
})
</script>

<template>
  <div
    v-if="isLoading"
    role="status"
    aria-live="polite"
    class="pointer-events-none fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-md border border-default bg-default px-3 py-2 text-xs text-muted shadow-sm"
  >
    <UIcon
      name="i-lucide-loader-circle"
      class="size-3.5 animate-spin motion-reduce:animate-none"
    />
    {{ t('navigation.opening') }}
  </div>
</template>
