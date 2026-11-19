<script setup lang="ts">
import { computed, ref } from 'vue'

// The People tab of an Organization, a Team or a Cohort: everyone in the place as a vertical card, face in the middle,
// then name, email and every position they hold there, one line each with its place. A person can hold different
// positions in different places; positions held outside this place are not its to show.
// On top, how many people and Add people, a menu of the roles the viewer awards (`add`); then the system's list
// toolbar, the quick search on the left and the filters on the right. Role and Place apply to the same position, so
// Facilitator with Lincoln finds the Facilitators of Lincoln's Cohorts; a group takes in what is under it. Place shows
// only where there is more than one place to pick (`groups`). A card offers removing a position only where
// `removable` says the viewer may strip it, never on the viewer's own card.
export interface DirectoryHolding {
  role: string
  place: string
  /** The group the Place filter finds the position under, such as the Team a Cohort belongs to; none for the page's
   * own place. */
  group?: string
}

export interface DirectoryPerson {
  name: string
  initials: string
  email: string
  you?: boolean
  invited?: boolean
  held: DirectoryHolding[]
}

const props = defineProps<{
  people: DirectoryPerson[]
  /** The page's own place. */
  place: string
  /** The groups under it the Place filter offers, with what each takes in. */
  groups?: { name: string; description: string }[]
  /** The roles the viewer awards, as menu items for Add people. */
  add?: { label: string; onSelect: () => void }[]
  removable?: (person: DirectoryPerson, holding: DirectoryHolding) => boolean
}>()
const emit = defineEmits<{ remove: [person: DirectoryPerson, holding: DirectoryHolding] }>()

const search = ref('')
const roles = ref<string[]>([])
const places = ref<string[]>([])
const status = ref<'all' | 'active' | 'invited'>('all')

const roleItems = computed(() => [...new Set(everyone.value.flatMap((p) => p.held.map((h) => h.role)))])
const placeItems = computed(() => [
  { label: props.place, value: props.place, description: 'Its own roles only' },
  ...(props.groups ?? []).map((g) => ({ label: g.name, value: g.name, description: g.description })),
])
const addItems = computed(() => (props.add ?? []).map((item) => ({ ...item, icon: 'i-lucide-user-plus' })))
const statusItems = [
  { label: 'Everyone', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Invited', value: 'invited' },
]

const placeOf = (h: DirectoryHolding) => h.group ?? props.place
const fits = (h: DirectoryHolding) =>
  (!roles.value.length || roles.value.includes(h.role)) && (!places.value.length || places.value.includes(placeOf(h)))

const matches = (person: DirectoryPerson) => {
  const query = search.value.trim().toLowerCase()
  if (query && !`${person.name} ${person.email}`.toLowerCase().includes(query)) return false
  if (status.value === 'active' && person.invited) return false
  if (status.value === 'invited' && !person.invited) return false
  return person.held.some(fits)
}

// Removing a position takes it off the card at once, and the card goes when nothing is left on it.
const removed = ref(new Set<string>())
const keyOf = (person: DirectoryPerson, h: DirectoryHolding) => `${person.email}/${h.place}/${h.role}`
const everyone = computed(() =>
  props.people
    .map((person) => ({ ...person, held: person.held.filter((h) => !removed.value.has(keyOf(person, h))) }))
    .filter((person) => person.held.length),
)
const shown = computed(() => everyone.value.filter(matches))
const filtering = computed(
  () => !!search.value.trim() || !!roles.value.length || !!places.value.length || status.value !== 'all',
)

function clear() {
  search.value = ''
  roles.value = []
  places.value = []
  status.value = 'all'
}

const menuOf = (person: DirectoryPerson) =>
  person.held
    .filter((h) => props.removable?.(person, h))
    .map((h) => ({
      label: `Remove as ${h.role}`,
      description: h.place,
      icon: 'i-lucide-user-minus',
      color: 'error' as const,
      onSelect: () => {
        removed.value = new Set(removed.value).add(keyOf(person, h))
        emit('remove', person, h)
      },
    }))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <p class="flex items-center gap-1 text-sm text-muted">
        <span class="font-semibold text-highlighted">
          {{ everyone.length }} {{ everyone.length === 1 ? 'person' : 'people' }}
        </span>
        in {{ place }}
        <slot name="note" />
      </p>
      <UDropdownMenu v-if="addItems.length" :items="addItems" :content="{ align: 'end' }">
        <UButton icon="i-lucide-user-plus" trailing-icon="i-lucide-chevron-down" class="shrink-0">Add people</UButton>
      </UDropdownMenu>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search by name or email"
        aria-label="Search people"
        class="w-full sm:w-72"
      >
        <template v-if="search" #trailing>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="link"
            size="sm"
            aria-label="Clear search"
            @click="search = ''"
          />
        </template>
      </UInput>

      <div class="flex flex-wrap items-center gap-2">
        <UButton v-if="filtering" color="neutral" variant="ghost" @click="clear">Clear filters</UButton>
        <USelectMenu
          v-model="roles"
          :items="roleItems"
          multiple
          :search-input="{ placeholder: 'Find a role' }"
          aria-label="Filter by role"
          class="w-40"
        >
          <span class="flex items-center gap-1.5">
            Role
            <UBadge v-if="roles.length" color="neutral" variant="soft" size="sm">{{ roles.length }}</UBadge>
          </span>
        </USelectMenu>
        <USelectMenu
          v-if="placeItems.length > 1"
          v-model="places"
          :items="placeItems"
          value-key="value"
          multiple
          :search-input="{ placeholder: 'Find a place' }"
          aria-label="Filter by place"
          :content="{ align: 'end' }"
          :ui="{ content: 'min-w-72' }"
          class="w-40"
        >
          <span class="flex items-center gap-1.5">
            Place
            <UBadge v-if="places.length" color="neutral" variant="soft" size="sm">{{ places.length }}</UBadge>
          </span>
        </USelectMenu>
        <USelect v-model="status" :items="statusItems" aria-label="Filter by status" class="w-32" />
      </div>
    </div>

    <p v-if="filtering" class="text-sm text-muted" aria-live="polite">
      Showing {{ shown.length }} of {{ everyone.length }} people
    </p>

    <ul v-if="shown.length" class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
      <li
        v-for="person in shown"
        :key="person.email"
        class="relative flex flex-col items-center gap-4 rounded-xl border border-default bg-default p-5 text-center"
      >
        <UDropdownMenu v-if="menuOf(person).length" :items="menuOf(person)" :content="{ align: 'end' }">
          <UButton
            icon="i-lucide-ellipsis"
            color="neutral"
            variant="ghost"
            size="sm"
            :aria-label="`Options for ${person.name}`"
            class="absolute top-2 right-2"
          />
        </UDropdownMenu>
        <UAvatar
          :text="person.initials"
          :alt="person.name"
          size="3xl"
          :class="person.invited ? 'bg-info-50 text-info-700' : 'bg-secondary-50 text-secondary-700'"
        />
        <div class="flex w-full min-w-0 flex-col items-center gap-0.5">
          <p class="flex max-w-full items-center gap-1.5 text-sm font-semibold text-highlighted">
            <span class="truncate" :title="person.name">{{ person.name }}</span>
            <span v-if="person.you" class="flex-none font-normal text-muted">(you)</span>
          </p>
          <p class="max-w-full truncate text-xs text-muted" :title="person.email">{{ person.email }}</p>
          <UBadge v-if="person.invited" color="info" variant="soft" size="sm" class="mt-1.5">Invited</UBadge>
        </div>
        <ul class="flex w-full flex-col gap-1.5 border-t border-default pt-4 text-left">
          <li v-for="h in person.held" :key="`${h.place}/${h.role}`" class="flex min-w-0 flex-col">
            <span class="text-xs font-medium text-highlighted">{{ h.role }}</span>
            <span class="truncate text-xs text-muted" :title="h.place">{{ h.place }}</span>
          </li>
        </ul>
      </li>
    </ul>

    <div
      v-else
      class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-default px-6 py-12 text-center"
    >
      <UIcon name="i-lucide-search-x" class="size-8 text-dimmed" />
      <div class="flex flex-col gap-1">
        <p class="text-sm font-medium text-highlighted">No one matches</p>
        <p class="text-sm text-muted">Try another name, or clear the filters to see everyone.</p>
      </div>
      <UButton color="neutral" variant="outline" @click="clear">Clear filters</UButton>
    </div>
  </div>
</template>
