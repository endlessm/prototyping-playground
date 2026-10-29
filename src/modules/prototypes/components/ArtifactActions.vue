<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { ManifestPrototype } from '../../../../app/composables/useManifest'
import { menuGroups } from '../../../../app/utils/menus'
import { shortcutLabel } from '../../../../app/utils/shortcuts'

// The open artifact's file menu, in the studio running locally: its source,
// to edit, or to view when you can't change the prototype (the file service
// has the last word).
const props = defineProps<{ prototype: ManifestPrototype }>()
const emit = defineEmits<{ source: [] }>()
const { t } = useI18n()
const { me } = useMe()

const editable = computed(
  () =>
    me.value.role === 'admin' ||
    (Boolean(me.value.studioId) && me.value.studioId === props.prototype.owner),
)
const items = computed<DropdownMenuItem[][]>(() =>
  menuGroups<DropdownMenuItem>([
    [
      {
        label: editable.value
          ? t('artifact.editSource')
          : t('artifact.viewSource'),
        icon: 'i-lucide-code-xml',
        kbds: [shortcutLabel('source')],
        onSelect: () => emit('source'),
      },
    ],
  ]),
)
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }">
    <UButton
      icon="i-lucide-ellipsis"
      color="neutral"
      variant="ghost"
      size="sm"
      :aria-label="t('artifact.actions')"
    />
  </UDropdownMenu>
</template>
