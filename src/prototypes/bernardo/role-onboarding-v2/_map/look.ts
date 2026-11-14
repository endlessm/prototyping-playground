// How the map encodes what things are: the colour of each level of place (Endless Access, Organization, Team,
// Cohort) and how each kind of arrow is drawn. The tiles, the panel, the arrows and the legend all read it here, so
// the encoding can't drift between them. The level tints are the diagram's data colours, the one place the map uses
// palette shades rather than the system's semantic utilities; they come from the same colour roles as the chips.

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

/** The Tailwind classes that tint each level wherever the map shows it. */
export interface LevelTint {
  /** An area's fill, border and corner. */
  area: string
  /** The person panel's portrait box. */
  art: string
  /** The level's name in an area's tab. */
  kind: string
  /** The small square before a group in Who's who. */
  dot: string
  /** The faint outline of an area that a path replay hasn't reached yet. */
  ghost: string
}

export const levelTint: Record<PlaceKind, LevelTint> = {
  Platform: {
    area: 'rounded-4xl border-accented bg-elevated',
    art: 'border-default bg-elevated',
    kind: 'text-toned',
    dot: 'bg-(--ui-border-accented)',
    ghost: 'rounded-4xl border-accented',
  },
  Organization: {
    area: 'rounded-4xl border-secondary-500/38 bg-[color-mix(in_oklab,var(--color-secondary-50)_32%,white)]',
    art: 'border-secondary-500/18 bg-[color-mix(in_oklab,var(--color-secondary-50)_60%,white)]',
    kind: 'text-secondary-500',
    dot: 'bg-secondary-500',
    ghost: 'rounded-4xl border-accented',
  },
  Team: {
    area: 'rounded-[28px] border-primary-500/42 bg-primary-50',
    art: 'border-primary-500/18 bg-primary-50',
    kind: 'text-primary-600',
    dot: 'bg-primary-500',
    ghost: 'rounded-[28px] border-primary-500/28',
  },
  Cohort: {
    area: 'rounded-3xl border-info-500/42 bg-[color-mix(in_oklab,var(--color-info-50)_45%,white)]',
    art: 'border-info-100 bg-info-50',
    kind: 'text-info-600',
    dot: 'bg-info-500',
    ghost: 'rounded-3xl border-info-500/28',
  },
}

/**
 * The one shadow on the map, for the objects that float on its canvas (tiles, area tabs, the Programs shelf, the
 * legend and the zoom bar), as the concept draws them: the app's outline card shadow. Nothing else on the map casts one.
 */
export const FLOATING = 'shadow-[0_25px_50px_-12px_rgb(0_0_0/0.08)]'

/** The small uppercase label over a section: the panel's headings, the legend's title, Who's who's groups. */
export const EYEBROW = 'text-xs font-bold tracking-wider text-dimmed uppercase'

/** The halo around what the story's current step adds (a tile, an area tab, the timeline's current stop). */
export const NOW_HALO = 'ring-6 ring-primary-500/16'

/** The halo around the selected tile, in the sky that also tints the selected row in Who's who and the panel. */
export const SELECTED_HALO = 'ring-5 ring-info-500/14'

/** The soft orange of what happens in this step: the New tags, the timeline's step and the current arrow's label. */
export const NOW_TINT = 'border border-primary-200 bg-primary-50 text-primary-900'

/** The Programs' cornflower: an Organization's colour, for the Programs a Cohort runs and the arrows to them. */
export const RUNS_TINT = 'bg-[color-mix(in_oklab,var(--color-secondary-50)_40%,white)] text-secondary-700'

/** A path playing fades what isn't on it; only opacity moves. */
export const FADE = 'transition-opacity duration-240 ease-out motion-reduce:transition-none'
export const FADED = 'opacity-32'

/** An arrow label's pill, by look; the next step's arrow has none. */
export const pillTint: Record<ArrowLook, string> = {
  invite: 'border-default bg-default',
  create: 'border-default bg-default',
  runs: `border-secondary-50 ${RUNS_TINT}`,
  now: NOW_TINT,
  next: 'border-default bg-default',
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
  invite: { color: 'var(--ui-color-neutral-400)', width: 1.6 },
  create: { color: 'var(--ui-color-neutral-400)', width: 1.6, dash: '5 4' },
  runs: { color: 'var(--ui-color-secondary-500)', width: 1.8, dash: '1.5 4.5' },
  now: { color: 'var(--ui-color-primary-600)', width: 2.4 },
  next: { color: 'var(--ui-border-accented)', width: 1.6, dash: '4 4' },
}

/** An arrow look's line as inline style, for the map's arrows and the legend's samples alike. */
export function strokeStyle(look: ArrowLook): Record<string, string> {
  const { color, width, dash } = arrowStroke[look]
  return { stroke: color, strokeWidth: String(width), strokeDasharray: dash ?? 'none' }
}
