<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { ManifestPrototype } from '../../../../app/composables/useManifest'
import { useShowAllFiles } from '../../../../app/composables/useFileTree'
import { usePrototypeActions } from '../composables/usePrototypeActions'

// The "…" beside a prototype's title in its navigation: the prototype's
// actions, and, in the studio running locally, "Show all files".
const props = defineProps<{ prototype: ManifestPrototype }>()
const { t } = useI18n()
const actions = usePrototypeActions(() => props.prototype)
const showAll = useShowAllFiles()

// Not `...(import.meta.dev ? … : [])`: compiled, the spread loses its
// brackets and Nuxt no longer replaces `import.meta.dev` after the dots.
const items = computed<DropdownMenuItem[][]>(() => {
  const groups = [...actions.value]
  if (import.meta.dev)
    groups.push([
      {
        type: 'checkbox',
        label: t('files.showAll'),
        checked: showAll.value,
        onUpdateChecked: (checked: boolean) => (showAll.value = checked),
      },
    ])
  return groups
})
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end' }"
    :ui="{ content: 'min-w-44' }"
  >
    <UButton
      icon="i-lucide-ellipsis"
      color="neutral"
      variant="ghost"
      size="xs"
      square
      :aria-label="t('prototypes.actions')"
    />
  </UDropdownMenu>
</template>
