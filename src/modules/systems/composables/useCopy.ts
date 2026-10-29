/** Copies a link to a studio address, or a repository path, and says so. */
export function useCopy() {
  const { t } = useI18n()
  const toast = useStudioToast()
  const router = useRouter()
  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(done)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }
  return {
    link: (address: string) =>
      copy(
        new URL(router.resolve(address).href, location.origin).href,
        t('systems.linkCopied'),
      ),
    path: (file: string) => copy(file, t('systems.pathCopied')),
  }
}
