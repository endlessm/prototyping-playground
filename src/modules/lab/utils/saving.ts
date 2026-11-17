// What Save sends for a Breakdown's unsaved changes, and where it may save
// them. Plain functions, so the component's and an experiment's Breakdown
// agree.
import type { RequestedChange } from '../experiments/save'
import type { BreakdownChange } from '../composables/useBreakdownChanges'
import { isOwnPrototype } from '../../prototypes/utils/ownership'

/** The changes as the dev server takes them: a knob's value on a piece. */
export const requestedChanges = (all: BreakdownChange[]): RequestedChange[] =>
  all.map(({ node, slot, family, value }) => ({ node, slot, family, value }))

/**
 * Where an experiment's Save goes: into its own file when it is yours,
 * otherwise (an Admin's on someone else's too) into a copy of your own, so
 * nobody's exploration changes under them.
 */
export const experimentSaveAs = (
  me: { key: string | null; studioId?: string },
  prototype: { owner: string | null; contributor: string },
): 'file' | 'mine' => (isOwnPrototype(me, prototype) ? 'file' : 'mine')
