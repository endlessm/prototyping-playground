import { computed, ref } from 'vue'
import { occupantsOf, type Place } from '../_chart/district'

// The quick search every alternative shares, with the list's own rule: a Team that matches keeps all its Cohorts, a
// Team with only matching Cohorts shows just those, and a match on someone finds the places they hold a position in.
export function useStructureSearch(root: Place) {
  const search = ref('')
  const query = computed(() => search.value.trim().toLowerCase())

  const found = (place: Place) =>
    !query.value ||
    `${place.name} ${occupantsOf(place)
      .map((o) => `${o.name} ${o.email}`)
      .join(' ')}`
      .toLowerCase()
      .includes(query.value)

  const teams = computed(() =>
    root.children
      .map((team) => ({ team, cohorts: found(team) ? team.children : team.children.filter(found) }))
      .filter(({ team, cohorts }) => found(team) || cohorts.length > 0),
  )

  return { search, query, teams }
}
