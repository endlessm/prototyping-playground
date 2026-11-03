import { restartHandoff } from '../../../../app/utils/restartHandoff'

// A system change in the tab that asked for it, through the restart handoff
// (`tooling/restart/handoff.ts`), which owns the screen, the wait through the
// dev server's restart and the confirmation, shown once on the page where
// the tab finishes. These calls only say what the screen reads and when the
// destination is ready. Development only: there is no handoff on the
// deployed site.

export type SystemOperation =
  'create' | 'delete' | 'rename' | 'archive' | 'restore' | 'default'

// What a Systems page waits for: a created system shown, a deleted one gone.
const CREATED = 'created:'
const DELETED = 'deleted:'

// "Opening <Name>", said once a creation is answered on the same page.
let opening = { title: '', description: '' }

/** Covers the app while a system change runs and the studio restarts. */
export function beginSystemTransition(
  operation: SystemOperation,
  name: string,
  studioId?: string,
) {
  // Called from a dialog's handler, outside any component's setup.
  const { t } = useNuxtApp().$i18n
  opening = {
    title: t('systems.transition.titles.opening', { name }),
    description: t('systems.transition.descriptions.opening'),
  }
  restartHandoff()?.start({
    kind: 'system',
    title: t(`systems.transition.titles.${operation}`, { name }),
    description: t(`systems.transition.descriptions.${operation}`),
    // A creation's page waits for its answer, which says where to go.
    hold: operation === 'create',
    destination:
      operation === 'create'
        ? true
        : operation === 'delete' && studioId
          ? DELETED + studioId
          : undefined,
  })
}

/** A new system exists: "Opening <Name>", until its Overview is ready. */
export function systemCreated(studioId: string) {
  restartHandoff()?.update({
    hold: false,
    ...opening,
    destination: CREATED + studioId,
  })
}

/** The change was refused: the screen goes, and nothing is confirmed. */
export function finishSystemTransition() {
  restartHandoff()?.cancel()
}

/** The confirmation, shown once where the tab finishes. */
export function queueSystemToast(title: string) {
  restartHandoff()?.update({ confirmation: title })
}

/**
 * On a Systems page: marks a pending change's destination ready, a new
 * system's Overview, or a collection without the deleted system. Other
 * changes have no destination: any page finishes them.
 */
export function useSystemTransition(
  systems: () => string[],
  current: () => string | undefined,
) {
  const handoff = restartHandoff()
  if (!import.meta.dev || !handoff) return
  function settle() {
    const awaited = handoff!.destination()
    if (typeof awaited !== 'string') return
    const ids = systems()
    const created = awaited.startsWith(CREATED)
      ? awaited.slice(CREATED.length)
      : ''
    const deleted = awaited.startsWith(DELETED)
      ? awaited.slice(DELETED.length)
      : ''
    if (
      (created && ids.includes(created) && current() === created) ||
      (deleted && !ids.includes(deleted))
    )
      handoff!.markReady()
  }
  onMounted(settle)
  watch([systems, current], settle)
}
