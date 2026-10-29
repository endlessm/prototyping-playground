import { useClipboard } from '@vueuse/core'

/**
 * Menu actions that copy a link to a studio address, or a repository path,
 * and say so. Each runs once the menu has closed.
 */
export function useCopy() {
  const { t } = useI18n()
  const toast = useStudioToast()
  const router = useRouter()
  const { copy } = useClipboard({ legacy: true })
  const failed = (message: string) => toast.error(t('actions.failed'), message)
  const run = (action: () => unknown) => afterMenuCloses(action, failed)
  return {
    link: (address: string) =>
      run(async () => {
        await copy(new URL(router.resolve(address).href, location.href).href)
        toast.success(t('actions.linkCopied'))
      }),
    path: (file: string) =>
      run(async () => {
        await copy(file)
        toast.success(t('actions.pathCopied'))
      }),
  }
}
