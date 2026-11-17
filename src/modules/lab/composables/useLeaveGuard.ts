import LabLeaveModal from '../components/LabLeaveModal.vue'
import type { BreakdownChanges } from './useBreakdownChanges'

/**
 * Asks before a Breakdown's unsaved changes are lost: leaving for another
 * page (not a change of the address's query, such as the canvas's view),
 * reloading or closing the tab. Discarding drops the changes.
 */
export function useLeaveGuard(changes: BreakdownChanges) {
  const overlay = useOverlay()
  let modal: ReturnType<typeof overlay.create> | undefined

  async function mayLeave(
    to: { path: string },
    from: { path: string },
  ): Promise<boolean> {
    if (!changes.pending.value || to.path === from.path) return true
    modal ??= overlay.create(LabLeaveModal)
    const discard = Boolean(await modal.open().result)
    if (discard) changes.reset()
    return discard
  }
  onBeforeRouteLeave(mayLeave)
  onBeforeRouteUpdate(mayLeave)
  useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
    if (changes.pending.value) event.preventDefault()
  })
}
