/**
 * Confirms a save with a toast counting the changes written, and says how
 * many were left unsaved because their pieces live in other files, or
 * because their props are set in code.
 */
export function useSavedToast() {
  const toast = useStudioToast()
  const { t } = useI18n()
  return (reply: {
    saved?: number
    skipped?: unknown[]
    skippedProps?: unknown[]
  }) => {
    const saved = reply.saved ?? 0
    const skipped = reply.skipped?.length ?? 0
    const inCode = reply.skippedProps?.length ?? 0
    if (!saved && !skipped && !inCode) return
    const notes = [
      skipped ? t('lab.save.skipped', { count: skipped }, skipped) : '',
      inCode ? t('lab.dial.skipped', { count: inCode }, inCode) : '',
    ].filter(Boolean)
    toast.success(
      t('lab.save.saved', { count: saved }, saved),
      notes.length ? notes.join(' ') : undefined,
    )
  }
}
