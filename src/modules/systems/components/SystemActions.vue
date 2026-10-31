<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { AsyncComponentLoader } from 'vue'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import { menuGroups } from '../../../../app/utils/menus'
import { onApple } from '../../../../app/utils/shortcuts'
import { useCopy } from '../composables/useCopy'
import {
  beginSystemTransition,
  finishSystemTransition,
  queueSystemToast,
} from '../composables/useSystemTransition'
import { systemMenu, type SystemActionId } from '../utils/actions'
import { systemAddress } from '../utils/pages'

// A system's "…" menu, shared by its card, its row and its navigation
// header (`../utils/actions.ts`): copy its link anywhere; locally, open its
// folder, show it in the file browser and copy its path; Admins and its
// maintainers rename it; Admins make it the default, archive, restore and
// delete it. Dialogs load only in development, and changes go through the
// dev server's systems route, which restarts the studio once they're done.
const props = defineProps<{
  system: SystemCatalog
  /**
   * Runs the action the address asks for (`?action=rename`), as the command
   * palette sends it: only the navigation's menu does.
   */
  answers?: boolean
}>()
const { t } = useI18n()
const { me, known } = useMe()
const toast = useStudioToast()
const copy = useCopy()
const manifest = await useManifest()
const base = useRuntimeConfig().app.baseURL

const local = computed(
  () => import.meta.dev && known.value && Boolean(me.value.key),
)
const admin = computed(() => local.value && me.value.role === 'admin')
const isDefault = computed(
  () => manifest.value.defaultSystem === props.system.id,
)

const failed = (message: string) => toast.error(t('actions.failed'), message)
const run = (action: () => unknown) => afterMenuCloses(action, failed)

// Only the dev server has this route; the static build never names it.
const route = import.meta.dev ? `${base}_studio/files/systems` : ''
const post = <T,>(body: Record<string, unknown>) =>
  requestJson<T>(route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: props.system.id, ...body }),
  })

const overlay = import.meta.dev ? useOverlay() : undefined
type Dialog = 'rename' | 'lifecycle'
const loaders: Record<Dialog, AsyncComponentLoader> | undefined = import.meta
  .dev
  ? {
      rename: () => import('./SystemRenameModal.vue'),
      lifecycle: () => import('./SystemLifecycleModal.vue'),
    }
  : undefined
const dialogs = new Map<
  Dialog,
  ReturnType<NonNullable<typeof overlay>['create']>
>()
function dialog(name: Dialog) {
  if (!dialogs.has(name))
    dialogs.set(name, overlay!.create(defineAsyncComponent(loaders![name])))
  return dialogs.get(name)!
}

/** The prototypes that use the system or wait to be rebuilt with it. */
const dependents = () =>
  manifest.value.prototypes
    .filter(
      (prototype) =>
        prototype.systemId === props.system.id ||
        prototype.rebuild?.targetSystemId === props.system.id,
    )
    .map((prototype) => ({
      id: prototype.id,
      title: prototype.title,
      archived: prototype.status === 'archived',
      pending: prototype.rebuild?.targetSystemId === props.system.id,
      uses: prototype.systemId === props.system.id,
    }))

function lifecycle(operation: 'archive' | 'restore' | 'delete') {
  void dialog('lifecycle').open({
    operation,
    system: { id: props.system.id, label: props.system.label },
    isDefault: isDefault.value,
    dependents: dependents(),
  })
}

async function makeDefault() {
  const { label, id } = props.system
  beginSystemTransition('default', label, id)
  try {
    await post({ op: 'default' })
    queueSystemToast(t('systems.toasts.isDefault', { name: label }))
  } catch (error) {
    finishSystemTransition()
    throw error
  }
}

const revealLabel = () => {
  if (onApple()) return t('files.reveal.apple')
  return /Win/.test(navigator.userAgent)
    ? t('files.reveal.windows')
    : t('files.reveal.other')
}

const items: Record<SystemActionId, () => DropdownMenuItem> = {
  open: () => ({
    label: t('files.openInEditor'),
    icon: 'i-lucide-square-pen',
    onSelect: run(async () => {
      const reply = await post<{ opened: boolean; message?: string }>({
        op: 'open',
      })
      if (!reply.opened && reply.message) toast.success(reply.message)
    }),
  }),
  reveal: () => ({
    label: revealLabel(),
    icon: 'i-lucide-folder-open',
    onSelect: run(() => post({ op: 'reveal' })),
  }),
  copyLink: () => ({
    label: t('actions.copyLink'),
    icon: 'i-lucide-link',
    onSelect: copy.link(systemAddress(props.system.id)),
  }),
  copyPath: () => ({
    label: t('actions.copyPath'),
    icon: 'i-lucide-copy',
    onSelect: copy.path(`${props.system.folder}/`),
  }),
  rename: () => ({
    label: t('systems.menu.rename'),
    icon: 'i-lucide-pencil',
    onSelect: run(() =>
      dialog('rename').open({
        system: { id: props.system.id, label: props.system.label },
      }),
    ),
  }),
  setDefault: () => ({
    label: t('systems.menu.setDefault'),
    icon: 'i-lucide-star',
    onSelect: run(makeDefault),
  }),
  isDefault: () => ({
    label: t('systems.menu.isDefault'),
    icon: 'i-lucide-star',
    disabled: true,
  }),
  archive: () => ({
    label: t('systems.menu.archive'),
    icon: 'i-lucide-archive',
    onSelect: run(() => lifecycle('archive')),
  }),
  restore: () => ({
    label: t('systems.menu.restore'),
    icon: 'i-lucide-archive-restore',
    onSelect: run(() => lifecycle('restore')),
  }),
  delete: () => ({
    label: t('systems.menu.delete'),
    icon: 'i-lucide-trash-2',
    color: 'error',
    onSelect: run(() => lifecycle('delete')),
  }),
}

const groups = computed<DropdownMenuItem[][]>(() =>
  menuGroups(
    systemMenu(
      {
        local: local.value,
        admin: admin.value,
        maintainer:
          admin.value || Boolean(me.value.maintains?.includes(props.system.id)),
        archived: props.system.status === 'archived',
        isDefault: isDefault.value,
      },
      (id) => ({ ...items[id](), id }),
    ),
  ),
)

// The palette's action, once it's known who you are: run if the menu
// offers it to you.
const address = useRoute()
if (props.answers && import.meta.dev)
  watch(
    [() => address.query.action, known],
    async ([wanted, ready]) => {
      if (typeof wanted !== 'string' || !ready) return
      await navigateTo(
        { query: { ...address.query, action: undefined } },
        { replace: true },
      )
      const item = groups.value
        .flat()
        .find((entry) => entry.id === wanted && !entry.disabled)
      item?.onSelect?.(new Event('select'))
    },
    { immediate: true },
  )
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
      color="neutral"
      variant="ghost"
      size="sm"
      :aria-label="t('systems.actions', { name: system.label })"
      v-bind="$attrs"
    />
  </UDropdownMenu>
</template>
