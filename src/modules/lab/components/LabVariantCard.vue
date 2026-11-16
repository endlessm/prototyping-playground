<script setup lang="ts">
import SystemPreview from '../../systems/components/SystemPreview.vue'
import type { CatalogExample } from '../../systems/composables/useSystemCatalog'

// One variant in the grid: an example's title and its preview. An example
// that needs more room than its column takes the whole row, and keeps it,
// so the grid doesn't flip back and forth as the column widens.
defineProps<{ systemId: string; example: CatalogExample }>()

const wide = ref(false)
</script>

<template>
  <div
    data-variant
    class="min-w-0"
    :class="{ '@3xl:col-span-2': wide }"
    :data-variant-wide="wide || undefined"
  >
    <h3 class="mb-2 text-xs font-medium text-muted">
      {{ example.title }}
    </h3>
    <SystemPreview
      :system-id="systemId"
      :artifact="example.id"
      :title="example.title"
      @wide="wide = true"
    />
  </div>
</template>
