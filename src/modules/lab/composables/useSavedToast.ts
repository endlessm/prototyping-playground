/**
 * Confirms a save with a toast counting the changes written, and says how
 * many were left unsaved because their pieces live in other files.
 */
export function useSavedToast() {
  const toast = useStudioToast()
  const { t } = useI18n()
  return (reply: { saved?: number; skipped?: unknown[] }) => {
    const saved = reply.saved ?? 0
    const skipped = reply.skipped?.length ?? 0
    if (!saved && !skipped) return
    toast.success(
      t('lab.save.saved', { count: saved }, saved),
      skipped ? t('lab.save.skipped', { count: skipped }, skipped) : undefined,
    )
  }
}
