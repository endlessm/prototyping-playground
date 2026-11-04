import type { RestartHandoff } from '../../tooling/restart/handoff'
import { HANDOFF_GLOBAL } from '../../tooling/restart/names'

/**
 * The page's restart handoff, resumed by its head script before the
 * application started. None on the deployed site.
 */
export function pageHandoff(): RestartHandoff | undefined {
  if (!import.meta.client) return undefined
  return (window as unknown as Record<string, RestartHandoff | undefined>)[
    HANDOFF_GLOBAL
  ]
}
