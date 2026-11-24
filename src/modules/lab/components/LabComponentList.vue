<script setup lang="ts">
import AppSectionNav from '../../../../app/components/AppSectionNav.vue'
import type { SystemCatalog } from '../../systems/composables/useSystemCatalog'
import {
  appPlace,
  labAddress,
  labComponents,
  labGroups,
  labTitle,
  matchingComponents,
  tabAt,
} from '../utils/lab'

// The Lab's section panel, titled with the open system: a system picker
// when more than one active system has components, a search (titles and
// addresses first, then descriptions), then the system's components in two
// groups: its app components, under their folder in the app copy (each by
// its own name, the full name on hover), then the others in the Systems
// navigation's order. The open one is highlighted. Moving to another
// component keeps the open tab.
const props = defineProps<{
  system: SystemCatalog
  /** The systems the Lab offers (`labSystems`). */
  systems: SystemCatalog[]
}>()
const { t } = useI18n()
const route = useRoute()

const query = ref('')
const all = computed(() => labComponents(props.system))
type Listed = (typeof all.value)[number]
interface Entry {
  component: Listed
  name: string
  full: string
}
// Each group's components in runs that share a folder; only app components
// have one.
const shown = computed(() =>
  labGroups(matchingComponents(all.value, query.value)).map((group) => {
    const folders: { name: string; entries: Entry[] }[] = []
    for (const component of group.components) {
      const place = component.app
        ? appPlace(component)
        : { group: '', name: labTitle(component.title), full: '' }
      const entry = { component, name: place.name, full: place.full }
      const last = folders.at(-1)
      if (last && last.name === place.group) last.entries.push(entry)
      else folders.push({ name: place.group, entries: [entry] })
    }
    return { id: group.id, folders }
  }),
)
const groupLabel = {
  app: 'lab.nav.appComponents',
  system: 'lab.nav.components',
} as const
const openSlug = computed(() =>
  route.params.systemId === props.system.id
    ? String(route.params.component ?? '')
    : '',
)
const tabPath = computed(
  () => tabAt(route.path, props.system.id, openSlug.value)?.path ?? '',
)

const choices = computed(() =>
  props.systems.map(({ id, label }) => ({ label, value: id })),
)
const pick = (id: string) => navigateTo(labAddress(id))

function onEscape(event: KeyboardEvent) {
  if (!query.value) return
  event.preventDefault()
  event.stopPropagation()
  query.value = ''
}
</script>

<template>
  <AppSectionNav :label="t('lab.title')">
    <template #header>
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 class="truncate text-sm font-semibold text-highlighted">
          {{ t('lab.title') }}
        </h2>
        <!-- With a picker, the picker names the system. -->
        <p v-if="systems.length <= 1" class="truncate text-xs text-muted">
          {{ system.label }}
        </p>
      </div>
    </template>
    <div class="space-y-2 px-1 pt-1">
      <USelect
        v-if="systems.length > 1"
        :model-value="system.id"
        :items="choices"
        size="sm"
        class="w-full"
        :aria-label="t('lab.nav.system')"
        @update:model-value="pick"
      />
      <UInput
        v-model="query"
        type="search"
        size="sm"
        icon="i-lucide-search"
        class="w-full"
        :placeholder="t('lab.nav.search')"
        :aria-label="t('lab.nav.search')"
        @keydown.esc="onEscape"
      />
    </div>
    <nav :aria-label="t('lab.nav.components')" class="pb-4">
      <section v-for="group in shown" :key="group.id">
        <p class="flex h-7 items-center px-2 text-xs font-semibold text-muted">
          {{ t(groupLabel[group.id]) }}
        </p>
        <template v-for="(folder, index) in group.folders" :key="index">
          <p
            v-if="folder.name"
            class="flex h-6 items-center px-2 pt-1 text-xs text-muted"
          >
            {{ folder.name }}
          </p>
          <ul class="space-y-0.5">
            <li
              v-for="{ component, name, full } in folder.entries"
              :key="component.slug"
            >
              <ULink
                :to="labAddress(system.id, component.slug, tabPath)"
                :title="full || undefined"
                :aria-label="full || undefined"
                :aria-current="component.slug === openSlug ? 'page' : undefined"
                :class="[
                  'flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  folder.name && 'ps-4',
                  component.slug === openSlug
                    ? 'bg-elevated font-medium text-highlighted'
                    : 'text-default hover:bg-elevated/50',
                ]"
              >
                <UIcon
                  name="i-lucide-blocks"
                  class="size-3.5 shrink-0 text-muted"
                />
                <span class="truncate">{{ name }}</span>
              </ULink>
            </li>
          </ul>
        </template>
      </section>
      <p v-if="!all.length" class="px-2 py-1 text-xs text-muted">
        {{ t('lab.nav.empty') }}
      </p>
      <p
        v-else-if="!shown.length"
        role="status"
        class="px-2 py-1 text-xs text-muted"
      >
        {{ t('lab.nav.noMatches') }}
      </p>
    </nav>
  </AppSectionNav>
</template>
