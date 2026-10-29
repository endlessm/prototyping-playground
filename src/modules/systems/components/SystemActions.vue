<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import { menuGroups } from '../../../../app/utils/menus'
import { useCopy } from '../composables/useCopy'
import { systemAddress } from '../utils/pages'

// A system's "…" menu, shared by its card, its row and its navigation
// header. An active system's link can be copied anywhere; locally, a
// registered contributor also copies its folder. Archived systems offer
// nothing yet; restoring and deleting them come with the lifecycle actions.
const props = defineProps<{ system: SystemCatalog }>()
const { t } = useI18n()
const { me } = useMe()
const copy = useCopy()

const items = computed<DropdownMenuItem[][]>(() =>
  props.system.status === 'archived'
    ? []
    : menuGroups<DropdownMenuItem>([
        [
          {
            label: t('systems.copyLink'),
            icon: 'i-lucide-link',
            onSelect: () => copy.link(systemAddress(props.system.id)),
          },
          import.meta.dev &&
            Boolean(me.value.key) && {
              label: t('systems.copyPath'),
              icon: 'i-lucide-copy',
              onSelect: () => copy.path(props.system.folder),
            },
        ],
      ]),
)
</script>

<template>
  <UDropdownMenu v-if="items.length" :items="items" :content="{ align: 'end' }">
    <UButton
      icon="i-lucide-ellipsis"
      color="neutral"
      variant="ghost"
      size="sm"
      :aria-label="t('systems.actions', { name: system.label })"
      v-bind="$attrs"
    />
  </UDropdownMenu>
</template>
