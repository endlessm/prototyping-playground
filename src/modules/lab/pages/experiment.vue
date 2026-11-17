<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import LabExperimentActions from '../components/LabExperimentActions.vue'
import LabExperimentStage from '../components/LabExperimentStage.vue'
import { useLabComponent } from '../composables/useLabComponent'
import { experimentsOf } from '../utils/experiments'
import { labAddress } from '../utils/lab'

// One experiment in the Lab, under the Experiments tab: its name, maker and
// date, its actions and its stage. An address naming no experiment of this
// component is not found, with the way back to all of them.
const { system, component } = useLabComponent()
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()
const manifest = await useManifest()

const all = computed(() =>
  labAddress(system.value.id, component.value.slug, 'experiments'),
)
const experiment = computed(() =>
  experimentsOf(manifest.value, system.value.id, component.value.slug).find(
    ({ id }) => id === String(route.params.experiment),
  ),
)
useHead({
  title: () =>
    [
      experiment.value?.title ?? t('notFound.title'),
      t('lab.experiments.tab'),
      component.value.title,
      t('lab.title'),
      studio.name,
    ].join(' — '),
})
</script>

<template>
  <AppNotFound v-if="!experiment" :to="all" label="lab.experiments.all" />
  <div v-else class="space-y-4">
    <ULink
      :to="all"
      class="inline-flex items-center gap-1 rounded-sm text-sm text-muted outline-none hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
    >
      <UIcon name="i-lucide-arrow-left" class="size-3.5" />
      {{ t('lab.experiments.all') }}
    </ULink>
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="text-xl font-semibold text-highlighted">
          {{ experiment.title }}
        </h2>
        <p class="flex flex-wrap gap-x-2 text-sm text-muted">
          <span>{{ experiment.author.name }}</span>
          <time v-if="experiment.created" :datetime="experiment.created">
            {{ formatDate(experiment.created) }}
          </time>
        </p>
      </div>
      <LabExperimentActions
        :experiment="experiment"
        :component-title="component.title"
      />
    </header>
    <LabExperimentStage :key="experiment.id" :experiment="experiment" />
  </div>
</template>
