<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ORG } from '../../../../_wire/world'
import AppFrame from '../../../_ui/AppFrame.vue'
import AddPeopleModal from './AddPeopleModal.vue'
import { provideOrgChart } from './district'
import PeopleGrid from './PeopleGrid.vue'
import StructureList from './StructureList.vue'
import TreeBranch from './TreeBranch.vue'
import UndoBar from './UndoBar.vue'

// The Organization's page as Grace (Org Owner) sees it once every flow is done. Structure lists the Organization's
// Teams with their Cohorts folded under them, a row per place with the faces of its people, so a large district grows
// down the page and never sideways; People lists everyone in it as cards. The other tabs are drawn only. `cards` keeps
// the earlier drawings, where People itself was a tree, with people added and removed in place.
const props = defineProps<{
  cards?: 'people' | 'places'
  tab?: 'structure' | 'people'
  scale?: 'sample' | 'large'
}>()

const chart = provideOrgChart(props.scale)
const { adding, headcount, places, root } = chart

const earlier = computed(() => !!props.cards)
const tab = ref(props.tab ?? 'structure')
watch(
  () => props.tab,
  (value) => (tab.value = value ?? 'structure'),
)

const tabItems = computed(() =>
  earlier.value
    ? ['Teams', 'People', 'Programs', 'Settings'].map((label) => ({ label, active: label === 'People' }))
    : [
        { label: 'Teams' },
        { label: 'Structure', active: tab.value === 'structure', onSelect: () => (tab.value = 'structure') },
        { label: 'People', active: tab.value === 'people', onSelect: () => (tab.value = 'people') },
        { label: 'Programs' },
        { label: 'Settings' },
      ],
)

const count = (level: string) => places.value.filter((p) => p.level === level).length
const teamCount = computed(() => count('Team'))
</script>

<template>
  <AppFrame viewer="orgOwner" :place="ORG">
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <h1 class="text-3xl font-semibold text-highlighted">{{ ORG }}</h1>
        <UTooltip text="Rename" :delay-duration="150">
          <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" aria-label="Rename" />
        </UTooltip>
      </div>
      <p class="text-sm text-muted">Organization · {{ teamCount }} Teams</p>
    </div>

    <div class="flex flex-col gap-6">
      <div>
        <UNavigationMenu :items="tabItems" variant="pill" color="neutral" :ui="{ link: 'no-underline cursor-pointer' }" />
        <USeparator class="mt-2" />
      </div>

      <p v-if="earlier || tab === 'structure'" class="text-sm text-muted">
        <span class="font-semibold text-highlighted">{{ headcount }} people</span>
        in {{ teamCount }} Teams and {{ count('Cohort') }} Cohorts
      </p>

      <PeopleGrid v-if="!earlier && tab === 'people'" />
      <StructureList v-else-if="!earlier" :root="root" />
      <div v-else class="overflow-x-auto pb-2" tabindex="0" role="group" aria-label="Organization chart">
        <ul class="tree">
          <TreeBranch :place="root" root :cards="cards" />
        </ul>
      </div>
    </div>

    <template #overlay>
      <AddPeopleModal
        v-if="adding"
        :key="adding.position.id"
        :place="adding.place"
        :position="adding.position"
        @send="chart.add"
        @close="adding = null"
      />
      <UndoBar />
    </template>
  </AppFrame>
</template>

<style scoped>
.tree {
  display: flex;
  width: max-content;
  margin: 0 auto;
  padding: 0;
  list-style: none;
}
</style>
