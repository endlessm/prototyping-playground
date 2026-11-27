import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { ageLabel, guideOf, isPaid, languagesOf, programs, toolsOf, type Program } from './programs'

// Filters in Magnific's pattern: a few one-tap labels for what people ask for most (Free, ASU, Godot, Endstar, Spanish),
// and every other filter in one list behind a Filters button. Labels add up: Godot + Free shows free Godot programs.
//
// The list's groups follow the program guides (endlessm.github.io/program-guides): their own filters (program stage,
// skill domain, and the standards sessions map to), then the ages, credentials, technical requirements and time each
// program states. Ages live here, not on the cards. Within a group, options are alternatives (OR); across groups they
// narrow (AND).

export const quickLabels = [
  { key: 'asu', label: 'ASU microcredential', test: (p: Program) => guideOf(p).credentials.includes('ASU microcredential') },
  { key: 'godot', label: 'Godot', test: (p: Program) => toolsOf(p).includes('Godot') },
  { key: 'endstar', label: 'Endstar', test: (p: Program) => toolsOf(p).includes('Endstar') },
  { key: 'spanish', label: 'Spanish', test: (p: Program) => languagesOf(p).includes('Español') },
  { key: 'ai', label: 'AI', test: (p: Program) => guideOf(p).setup.includes('Uses AI') },
  { key: 'free', label: 'Free enrollment', test: (p: Program) => !isPaid(p) },
] as const
export type QuickKey = (typeof quickLabels)[number]['key']

interface Group {
  key: string
  label: string
  options: string[]
  /** The values a program has in this group. */
  of: (p: Program) => string[]
}
const g = (key: string, label: string, options: string[], of: (p: Program) => string[]): Group => ({ key, label, options, of })

export const listGroups: Group[] = [
  g('stage', 'Stage', ['Explore', 'Core', 'More'], (p) => (p.tier ? [p.tier] : [])),
  g('skill', 'Skill domain', ['Art', 'Engineering', 'Game Design', 'Go to Market', 'Management & Production'], (p) => guideOf(p).skills),
  g('age', 'Ages', ['Ages 12–14', 'Ages 13+', 'Ages 15+', 'Adults'], (p) => [ageLabel(p)]),
  g('standards', 'Standards', ['CSTA 6–8', 'CSTA 9–12', 'CSTA Game Dev specialty', 'ISTE Students', 'ISTE CT for Educators'], (p) => guideOf(p).standards),
  g('credential', 'You earn', ['XP only', 'Certificate of Completion', 'ASU microcredential'], (p) => guideOf(p).credentials),
  g('setup', 'Devices and tools', ['Runs in a browser', 'Install Godot', 'Works offline', 'Uses AI'], (p) => guideOf(p).setup),
  g('duration', 'Time', ['Up to 10 hours', '11–15 hours', '16+ hours'], (p) => (p.durationBucket ? [p.durationBucket] : [])),
  g('status', 'Availability', ['Live', 'In development'], (p) => [guideOf(p).status]),
]
export type ListKey = string

/** `source` is the programs a page lists (option D leaves the Fellowship out; the educator's tabs change it); counts
 *  and results come from it. */
export function useQuickFilters(source: MaybeRefOrGetter<Program[]> = programs) {
  const search = ref('')
  const quick = ref<QuickKey[]>([])
  const list = ref<Record<ListKey, string[]>>(Object.fromEntries(listGroups.map((x) => [x.key, []])))

  const toggleQuick = (k: QuickKey) => {
    quick.value = quick.value.includes(k) ? quick.value.filter((x) => x !== k) : [...quick.value, k]
  }
  const toggleList = (k: ListKey, v: string) => {
    const cur = list.value[k]!
    list.value[k] = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
  }
  const listCount = computed(() => Object.values(list.value).reduce((n, v) => n + v.length, 0))
  const active = computed(() => quick.value.length + listCount.value + (search.value ? 1 : 0))
  const clear = () => {
    search.value = ''
    quick.value = []
    for (const k of Object.keys(list.value)) list.value[k] = []
  }
  /** How many programs have this option, ignoring the other filters: shown next to each checkbox. */
  const countOf = (group: Group, option: string) => toValue(source).filter((p) => group.of(p).includes(option)).length

  const visible = computed(() => {
    const q = search.value.trim().toLowerCase()
    return toValue(source).filter((p) => {
      if (q && ![p.en.name, p.en.tagline, p.es?.name ?? '', p.es?.tagline ?? '', guideOf(p).makes].join(' ').toLowerCase().includes(q)) return false
      for (const k of quick.value) if (!quickLabels.find((x) => x.key === k)!.test(p)) return false
      for (const grp of listGroups) {
        const want = list.value[grp.key]!
        if (want.length && !grp.of(p).some((v) => want.includes(v))) return false
      }
      return true
    })
  })

  return { search, quick, list, toggleQuick, toggleList, listCount, active, clear, visible, countOf }
}
export type QuickFilters = ReturnType<typeof useQuickFilters>
