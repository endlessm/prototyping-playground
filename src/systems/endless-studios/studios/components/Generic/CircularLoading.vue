<script setup lang="ts">
// The Endless Loader: the mark rests at 20% while a light travels the
// infinity loop over 2.4s, passing behind the crossing the way the ribbon
// itself does.
// Source of truth: the Endless Loader design artifact (v1.0, 2026-09-09).
import { computed } from 'vue'
import SvgSymbol from '~/components/Generic/SvgSymbol.vue'
import EndlessLoader from '~/assets/images/loader/endless-loader.svg?component'

const { size = 56, label = '' } = defineProps<{
  // Width in px. The documented steps are 24 (minimum), 32, 56, 96 and 160.
  size?: number
  // Accessible name announced by screen readers. Defaults to a plain
  // "Loading"; pass one when the surrounding context deserves something
  // more specific.
  label?: string
}>()

const { t } = useI18n()
const accessibleLabel = computed(() => label || t('loading'))
</script>

<template>
  <span class="inline-block" :style="{ width: `${size}px` }">
    <!-- Fixed 2.4:1 ratio: set the width and the height follows. -->
    <SvgSymbol
      :icon="EndlessLoader"
      symbol-key="endless_loader"
      class="block w-full aspect-[466/194]"
      role="img"
      :aria-label="accessibleLabel"
    />
  </span>
</template>
