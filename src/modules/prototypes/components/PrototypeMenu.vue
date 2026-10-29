<script setup lang="ts">
import type { ManifestPrototype } from '../../../../app/composables/useManifest'
import { usePrototypeActions } from '../composables/usePrototypeActions'

// The "…" on a prototype's card or row: the prototype's actions. It shows
// while the pointer or focus is on the card (always on touch screens), and
// not at all when there is nothing you may do.
const props = defineProps<{ prototype: ManifestPrototype }>()
const { t } = useI18n()
const groups = usePrototypeActions(() => props.prototype)
</script>

<template>
  <UDropdownMenu
    v-if="groups.length"
    :items="groups"
    :content="{ align: 'end' }"
    :ui="{ content: 'min-w-44' }"
  >
    <UButton
      icon="i-lucide-ellipsis"
      :aria-label="t('prototypes.actionsFor', { title: prototype.title })"
      color="neutral"
      variant="ghost"
      size="sm"
      square
      class="opacity-0 group-focus-within/card:opacity-100 group-hover/card:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
    />
  </UDropdownMenu>
</template>
