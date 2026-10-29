<script setup lang="ts">
import type { ContextMenuItem } from '@nuxt/ui'
import { menuGroups } from '../../../../app/utils/menus'
import { shortcutLabel } from '../../../../app/utils/shortcuts'
import { useCopy } from '../composables/useCopy'

export interface SystemNavLink {
  label: string
  to: string
  icon: string
  /** The file or folder it shows, repository-relative: its hover text. */
  path: string
  /** Whether it has a source to open in source mode. */
  source?: boolean
}

// One page in a system's navigation. Right-click for its file actions:
// locally, its source and its path; anywhere, its link. Pages are never
// renamed or deleted from here.
const props = defineProps<{ item: SystemNavLink }>()
const { t } = useI18n()
const route = useRoute()
const copy = useCopy()

const current = computed(() => route.path === props.item.to)
const actions = computed<ContextMenuItem[][]>(() =>
  menuGroups<ContextMenuItem>([
    [
      import.meta.dev &&
        props.item.source && {
          label: t('systems.fileActions.editSource'),
          icon: 'i-lucide-code-xml',
          kbds: [shortcutLabel('source')],
          onSelect: () =>
            navigateTo({ path: props.item.to, query: { mode: 'source' } }),
        },
      {
        label: t('systems.copyLink'),
        icon: 'i-lucide-link',
        onSelect: () => copy.link(props.item.to),
      },
      import.meta.dev && {
        label: t('systems.copyPath'),
        icon: 'i-lucide-copy',
        onSelect: () => copy.path(props.item.path),
      },
    ],
  ]),
)
</script>

<template>
  <UContextMenu :items="actions">
    <ULink
      :to="item.to"
      :title="item.path"
      :aria-current="current ? 'page' : undefined"
      :class="[
        'flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary',
        current
          ? 'bg-elevated font-medium text-highlighted'
          : 'text-default hover:bg-elevated/50',
      ]"
    >
      <UIcon :name="item.icon" class="size-3.5 shrink-0 text-muted" />
      <span class="truncate">{{ item.label }}</span>
    </ULink>
  </UContextMenu>
</template>
