// What Save sends for a Breakdown's unsaved changes, and where it may save
// them. Plain functions, so the component's and an experiment's Breakdown
// agree.
import type { RequestedChange } from '../experiments/save'
import type { BreakdownChange } from '../composables/useBreakdownChanges'

/** The changes as the dev server takes them: a knob's value on a piece. */
export const requestedChanges = (all: BreakdownChange[]): RequestedChange[] =>
  all.map(({ node, slot, family, value }) => ({ node, slot, family, value }))

/**
 * Where an experiment's Save goes: into its own file for whoever may change
 * its prototype (its owner or an Admin), otherwise into a copy of your own.
 */
export function experimentSaveAs(
  me: { key: string | null; studioId?: string; role?: string | null },
  prototype: { owner: string | null; contributor: string },
): 'file' | 'mine' {
  if (!me.key) return 'mine'
  if (me.role === 'admin') return 'file'
  const own = prototype.owner
    ? prototype.owner === me.studioId
    : prototype.contributor === me.key
  return own ? 'file' : 'mine'
}
