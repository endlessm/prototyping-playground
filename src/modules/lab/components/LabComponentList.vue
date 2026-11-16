<script setup lang="ts">
import AppSectionNav from '../../../../app/components/AppSectionNav.vue'
import type { SystemCatalog } from '../../systems/composables/useSystemCatalog'
import { labAddress, matchingComponents, tabAt } from '../utils/lab'

// The Lab's section panel: a system picker when more than one active system
// has components, a search, then the system's components in the Systems
// navigation's order, the open one highlighted. Moving to another component
// keeps the open tab.
const props = defineProps<{
  system: SystemCatalog
  /** The systems the Lab offers (`labSystems`). */
  systems: SystemCatalog[]
}>()
const { t } = useI18n()
const route = useRoute()

const query = ref('')
const shown = computed(() =>
  matchingComponents(props.system.components, query.value),
)
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
      <p class="flex h-7 items-center px-2 text-xs font-semibold text-muted">
        {{ t('lab.nav.components') }}
      </p>
      <ul class="space-y-0.5">
        <li v-for="component in shown" :key="component.slug">
          <ULink
            :to="labAddress(system.id, component.slug, tabPath)"
            :title="component.description ?? undefined"
            :aria-current="component.slug === openSlug ? 'page' : undefined"
            :class="[
              'flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary',
              component.slug === openSlug
                ? 'bg-elevated font-medium text-highlighted'
                : 'text-default hover:bg-elevated/50',
            ]"
          >
            <UIcon
              name="i-lucide-blocks"
              class="size-3.5 shrink-0 text-muted"
            />
            <span class="truncate">{{ component.title }}</span>
          </ULink>
        </li>
      </ul>
      <p v-if="!system.components.length" class="px-2 py-1 text-xs text-muted">
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
