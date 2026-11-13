// How the map encodes what things are: the colour of each level of place (Endless Access, Organization, Team,
// Cohort) and how each kind of arrow is drawn. The tiles, the panel, the arrows and the legend all read it here, so
// the encoding can't drift between them.

import type { ArrowLook } from './arrows'
import { mapRoles, type MapRoleKey, type PlaceKind } from './story'

/** The Nuxt UI colours the map's badges take. */
export type LevelColor = 'neutral' | 'secondary' | 'primary' | 'info'

/** Each level's colour role: Organizations are cornflower (secondary), Teams orange (primary), Cohorts sky (info). */
export const levelColor: Record<PlaceKind, LevelColor> = {
  Platform: 'neutral',
  Organization: 'secondary',
  Team: 'primary',
  Cohort: 'info',
}

/** A role's chip colour: its level's, except the learners', who aren't educators. */
export function roleColor(role: MapRoleKey): LevelColor {
  return role === 'learner' ? 'neutral' : levelColor[mapRoles[role].kind]
}

export interface ArrowStroke {
  color: string
  width: number
  dash?: string
}

/** Each arrow look's line: invitations solid, creations dashed, Programs dotted, the current step bold and orange. */
export const arrowStroke: Record<ArrowLook, ArrowStroke> = {
  invite: { color: 'var(--color-slate-400)', width: 1.6 },
  create: { color: 'var(--color-slate-400)', width: 1.6, dash: '5 4' },
  runs: { color: 'var(--ui-color-secondary-500)', width: 1.8, dash: '1.5 4.5' },
  now: { color: 'var(--ui-color-primary-600)', width: 2.4 },
  next: { color: 'var(--ui-border-accented)', width: 1.6, dash: '4 4' },
}

/** An arrow look's line as inline style, for the map's arrows and the legend's samples alike. */
export function strokeStyle(look: ArrowLook): Record<string, string> {
  const { color, width, dash } = arrowStroke[look]
  return { stroke: color, strokeWidth: String(width), strokeDasharray: dash ?? 'none' }
}
