import type { DropdownMenuItem } from '@nuxt/ui'
import { useClipboard } from '@vueuse/core'
import type { ManifestPrototype } from '../../../../app/composables/useManifest'

/**
 * What you may do with a prototype, as menu groups in the studio's order
 * (create, reach, change, delete): everyone can copy its link; locally you
 * can also copy its folder's path. Each runs once the menu has closed.
 * Rename, duplicate, archive and delete join with ticket 13.
 */
export function usePrototypeActions(prototype: () => ManifestPrototype) {
  const { t } = useI18n()
  const toast = useStudioToast()
  const base = useRuntimeConfig().app.baseURL
  const { copy } = useClipboard({ legacy: true })
  const failed = (message: string) => toast.error(t('actions.failed'), message)
  const run = (action: () => unknown) => afterMenuCloses(action, failed)

  return computed<DropdownMenuItem[][]>(() => {
    const { id, folder } = prototype()
    return menuGroups<DropdownMenuItem>([
      [],
      [
        {
          label: t('actions.copyLink'),
          icon: 'i-lucide-link',
          onSelect: run(async () => {
            await copy(new URL(`${base}prototypes/${id}`, location.href).href)
            toast.success(t('actions.linkCopied'))
          }),
        },
        import.meta.dev && {
          label: t('actions.copyPath'),
          icon: 'i-lucide-copy',
          onSelect: run(async () => {
            await copy(folder)
            toast.success(t('actions.pathCopied'))
          }),
        },
      ],
    ])
  })
}
