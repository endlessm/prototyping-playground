import { pageHandoff } from '../../../../app/utils/pageHandoff'
import type { SystemDestination } from '../utils/destination'

export type SystemOperation =
  'create' | 'rename' | 'default' | 'archive' | 'restore' | 'delete'

export interface SystemChange<T> {
  operation: SystemOperation
  /** The system's name, as the screen says it. */
  name: string
  /** Sends the change to the dev server. */
  request: () => Promise<T>
  /** Shown once, on the page where the tab finishes. */
  confirmation?: string
  /**
   * The page the tab waits for before it finishes; from the answer when
   * only the answer says where it is, as for a new system.
   */
  destination?: SystemDestination | ((answer: T) => SystemDestination)
}

/**
 * A system change behind the restart handoff's screen, in the tab that
 * asked for it (`tooling/restart/handoff.ts`): the screen reads as the
 * operation says, the page holds until the request is answered, and a
 * refusal lifts the screen and throws for the dialog to show. Waiting,
 * reloading and finishing are the handoff's.
 */
export function useSystemChange() {
  const { t } = useI18n()
  const handoff = pageHandoff()
  const words = (operation: SystemOperation | 'opening', name: string) => ({
    title: t(`systems.transition.titles.${operation}`, { name }),
    description: t(`systems.transition.descriptions.${operation}`),
  })

  return async function change<T>(options: SystemChange<T>): Promise<T> {
    const { operation, name, destination } = options
    handoff?.start({
      kind: 'system',
      ...words(operation, name),
      hold: true,
      destination:
        typeof destination === 'function' ? true : (destination ?? false),
    })
    try {
      const answer = await options.request()
      handoff?.update({
        hold: false,
        ...(options.confirmation ? { confirmation: options.confirmation } : {}),
        // A new system exists once answered: the screen says it opens.
        ...(operation === 'create' ? words('opening', name) : {}),
        ...(typeof destination === 'function'
          ? { destination: destination(answer) }
          : {}),
      })
      return answer
    } catch (error) {
      handoff?.cancel()
      throw error
    }
  }
}

/**
 * Marks the tab's destination ready on this page once `ready` holds for
 * the destination its system change named.
 */
export function useSystemDestination(ready: (destination: unknown) => boolean) {
  const handoff = import.meta.dev ? pageHandoff() : undefined
  if (handoff)
    watchEffect(() => {
      if (ready(handoff.destination())) handoff.markReady()
    })
}
