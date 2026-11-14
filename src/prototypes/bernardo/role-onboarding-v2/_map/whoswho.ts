// Who's who: every role of the story, grouped by the kind of place it lives in, with how many hold it once a given
// step has happened. Built from `heldRoles`, so Ben counts as both Team Manager and Cohort Owner, and the learners
// tile counts as its number of learners. A role nobody holds (yet) still gets its row, with a count of 0.

import { heldRoles, mapRoles, nodeTitle, type MapRoleKey, type NodeId, type PlaceKind, type Story } from './story'

/** One person (or the learners' tile) holding a role, and the step that gave it. */
export interface Holder {
  id: NodeId
  name: string
  step: number
  /** How many people the holder stands for: 1, or the learners' count. */
  weight: number
}

export interface WhoRow {
  role: MapRoleKey
  label: string
  /** Holders at the current step, in the order the story gives them the role. */
  holders: Holder[]
  count: number
  /** Holders whose name matches the search, when the row matched by person rather than by role. */
  matches: Holder[]
}

export interface WhoGroup {
  kind: PlaceKind
  title: string
  rows: WhoRow[]
}

const groupTitles: Record<PlaceKind, string> = {
  Platform: 'Endless Access',
  Organization: 'Organization',
  Team: 'Team',
  Cohort: 'Cohort',
}

const kinds: PlaceKind[] = ['Platform', 'Organization', 'Team', 'Cohort']

/** Everyone who holds each role at some point of the story. */
export function holdersByRole(story: Story): Record<MapRoleKey, Holder[]> {
  const byRole = Object.fromEntries(Object.keys(mapRoles).map((key) => [key, [] as Holder[]])) as Record<
    MapRoleKey,
    Holder[]
  >
  for (const node of Object.values(story.nodes)) {
    for (const held of heldRoles(story, node.id)) {
      byRole[held.role].push({ id: node.id, name: nodeTitle(node), step: held.step, weight: node.count ?? 1 })
    }
  }
  for (const holders of Object.values(byRole)) holders.sort((a, b) => a.step - b.step)
  return byRole
}

const normalise = (text: string) => text.toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim()

/**
 * The groups and rows to list once `step` has happened, filtered by `query`: a row stays when its role or the name of
 * someone holding it (at this step) contains the query. Groups left without rows are dropped.
 */
export function whosWho(story: Story, step: number, query = ''): WhoGroup[] {
  const all = holdersByRole(story)
  const needle = normalise(query)
  return kinds
    .map((kind) => {
      const rows = (Object.values(mapRoles) as (typeof mapRoles)[MapRoleKey][])
        .filter((role) => role.kind === kind)
        .flatMap((role): WhoRow[] => {
          const holders = all[role.key].filter((holder) => holder.step <= step)
          const row = {
            role: role.key,
            label: role.label,
            holders,
            count: holders.reduce((sum, holder) => sum + holder.weight, 0),
            matches: [] as Holder[],
          }
          if (!needle || normalise(role.label).includes(needle)) return [row]
          const matches = holders.filter((holder) => normalise(holder.name).includes(needle))
          return matches.length ? [{ ...row, matches }] : []
        })
      return { kind, title: groupTitles[kind], rows }
    })
    .filter((group) => group.rows.length > 0)
}

/**
 * Who a click on a row selects: the first matching holder (or the first holder), or the next one after the person
 * already selected, so repeated clicks walk through a role held by several people.
 */
export function rowTarget(row: WhoRow, selected: NodeId | null): NodeId | null {
  const pool = row.matches.length ? row.matches : row.holders
  if (pool.length === 0) return null
  const index = pool.findIndex((holder) => holder.id === selected)
  return pool[(index + 1) % pool.length]?.id ?? null
}
