import contributedActions from '#studio/prototype-actions'
import type { DropdownMenuItem } from '@nuxt/ui'
import { useClipboard } from '@vueuse/core'
import type { AsyncComponentLoader } from 'vue'
import {
  refreshManifest,
  type ManifestPrototype,
} from '../../../../app/composables/useManifest'
import { onApple } from '../../../../app/utils/shortcuts'
import { prototypeMenu, type PrototypeActionId } from '../utils/actions'
import { makerOf } from '../utils/gallery'

/** Where deleted files go on this computer. */
export const trashPlace = () =>
  /Win/.test(navigator.userAgent) ? 'recycle-bin' : 'trash'

/**
 * Who may change a prototype, as far as the page knows: its owner or an
 * Admin, while the studio runs locally. The file service checks again.
 */
export function useMayChange(prototype: () => ManifestPrototype) {
  const { me, known } = useMe()
  return computed(() => {
    if (!import.meta.dev || !known.value || !me.value.key) return false
    if (me.value.role === 'admin') return true
    const { owner, contributor } = prototype()
    return owner ? owner === me.value.studioId : contributor === me.value.key
  })
}

/**
 * What you may do with a prototype, for its "…" menus (header, card, row)
 * and its header's right-click menu, in the studio's groups
 * (`../utils/actions.ts`). Everyone can copy its link; locally anyone can
 * open it in a code editor, show it in the file browser and copy its path;
 * its owner or an Admin can rename, duplicate, archive or restore, and
 * delete it, and use what other modules add. Dialogs load only in
 * development, and each action runs once the menu has closed.
 */
export function usePrototypeActions(prototype: () => ManifestPrototype) {
  const { t } = useI18n()
  const toast = useStudioToast()
  const route = useRoute()
  const base = useRuntimeConfig().app.baseURL
  const { copy } = useClipboard({ legacy: true })
  const editable = useMayChange(prototype)
  const failed = (message: string) => toast.error(t('actions.failed'), message)
  const run = (action: () => unknown) => afterMenuCloses(action, failed)

  // Only the dev server has these routes; the static build never names them.
  const route_ = (name: string) =>
    import.meta.dev ? `${base}_studio/files/${name}` : ''
  const post = <T>(name: string, body: Record<string, unknown>) =>
    requestJson<T>(route_(name), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prototype: prototype().id, ...body }),
    })

  // The dialogs, made when first opened. Only the studio running locally
  // has them, so the deployed site carries neither them nor the service.
  const overlay = import.meta.dev ? useOverlay() : undefined
  type Loaders = Record<'rename' | 'duplicate' | 'delete', AsyncComponentLoader>
  const loaders: Loaders | undefined = import.meta.dev
    ? {
        rename: () => import('../components/PrototypeRenameModal.vue'),
        duplicate: () => import('../components/PrototypeDuplicateModal.vue'),
        delete: () => import('../components/PrototypeDeleteModal.vue'),
      }
    : undefined
  const dialogs = new Map<
    string,
    ReturnType<NonNullable<typeof overlay>['create']>
  >()
  function dialog(name: 'rename' | 'duplicate' | 'delete') {
    if (!dialogs.has(name))
      dialogs.set(name, overlay!.create(defineAsyncComponent(loaders![name])))
    return dialogs.get(name)!
  }

  async function setStatus(op: 'archive' | 'restore') {
    await post('prototypes', { op })
    await refreshManifest()
    toast.success(
      op === 'archive'
        ? t('prototypes.organize.archivedToast')
        : t('prototypes.organize.restoredToast'),
    )
  }

  async function remove() {
    const { id, title } = prototype()
    const deleted = await dialog('delete').open({
      prototype: prototype(),
      place: trashPlace(),
    }).result
    if (!deleted) return
    // Leave a prototype that is gone; elsewhere, the page and its filters stay.
    if (route.path.startsWith(`/prototypes/${id}`))
      await navigateTo('/prototypes')
    await refreshManifest()
    toast.success(
      t('files.deleted', {
        name: title,
        place: t(`files.trash.${trashPlace()}`),
      }),
    )
  }

  async function open() {
    const reply = await post<{ opened: boolean; message?: string }>('tree', {
      op: 'open',
      path: '',
    })
    if (!reply.opened && reply.message) toast.success(reply.message)
  }

  const revealLabel = () => {
    if (onApple()) return t('files.reveal.apple')
    return /Win/.test(navigator.userAgent)
      ? t('files.reveal.windows')
      : t('files.reveal.other')
  }

  const items: Record<PrototypeActionId, () => DropdownMenuItem> = {
    open: () => ({
      label: t('files.openInEditor'),
      icon: 'i-lucide-square-pen',
      onSelect: run(open),
    }),
    reveal: () => ({
      label: revealLabel(),
      icon: 'i-lucide-folder-open',
      onSelect: run(() => post('tree', { op: 'reveal', path: '' })),
    }),
    copyLink: () => ({
      label: t('actions.copyLink'),
      icon: 'i-lucide-link',
      onSelect: run(async () => {
        await copy(
          new URL(`${base}prototypes/${prototype().id}`, location.href).href,
        )
        toast.success(t('actions.linkCopied'))
      }),
    }),
    copyPath: () => ({
      label: t('actions.copyPath'),
      icon: 'i-lucide-copy',
      onSelect: run(async () => {
        await copy(prototype().folder)
        toast.success(t('actions.pathCopied'))
      }),
    }),
    rename: () => ({
      label: t('prototypes.organize.rename'),
      icon: 'i-lucide-pencil',
      onSelect: run(async () => {
        const manifest = await useManifest()
        void dialog('rename').open({
          prototype: prototype(),
          maker: makerOf(manifest.value, prototype()).name,
        })
      }),
    }),
    duplicate: () => ({
      label: t('prototypes.organize.duplicate'),
      icon: 'i-lucide-copy-plus',
      onSelect: run(async () => {
        const { systems } = (await useManifest()).value
        const current = prototype().systemId
        void dialog('duplicate').open({
          prototype: prototype(),
          systems: systems
            .filter(({ status }) => status === 'active')
            .map(({ id, label }) => ({ id, label })),
          current:
            current === null
              ? null
              : (systems.find(({ id }) => id === current)?.label ?? current),
        })
      }),
    }),
    archive: () => ({
      label: t('prototypes.organize.archive'),
      icon: 'i-lucide-archive',
      onSelect: run(() => setStatus('archive')),
    }),
    restore: () => ({
      label: t('prototypes.organize.restore'),
      icon: 'i-lucide-archive-restore',
      onSelect: run(() => setStatus('restore')),
    }),
    delete: () => ({
      label: t('prototypes.organize.delete'),
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: run(remove),
    }),
  }

  const groups = computed<DropdownMenuItem[][]>(() => {
    const current = prototype()
    // What other modules add, such as a publish action.
    const contributed = contributedActions.flatMap((actions) =>
      actions(current).map((action): DropdownMenuItem => ({
        label: action.label,
        icon: action.icon,
        onSelect: run(action.onSelect),
      })),
    )
    return prototypeMenu(
      {
        local: import.meta.dev,
        editable: editable.value,
        archived: current.status === 'archived',
      },
      (id) => items[id](),
      contributed,
    )
  })

  return { groups, editable }
}
