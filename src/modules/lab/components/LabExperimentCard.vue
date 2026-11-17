<script setup lang="ts">
import LabExperimentActions from './LabExperimentActions.vue'
import LabExperimentPreview from './LabExperimentPreview.vue'
import { experimentAddress, type LabExperiment } from '../utils/experiments'

// One experiment in the Experiments tab: its live preview, its name (which
// opens it in the Lab), who made it and when, and its actions.
defineProps<{
  experiment: LabExperiment
  componentTitle: string
}>()
</script>

<template>
  <article :data-experiment="experiment.id" class="flex min-w-0 flex-col gap-2">
    <LabExperimentPreview
      :system-id="experiment.systemId"
      :experiment="experiment.id"
      :title="experiment.title"
    />
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <h3 class="truncate text-sm font-medium text-highlighted">
          <ULink
            :to="experimentAddress(experiment)"
            class="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary"
          >
            {{ experiment.title }}
          </ULink>
        </h3>
        <p class="flex flex-wrap gap-x-2 text-xs text-muted">
          <span>{{ experiment.author.name }}</span>
          <time v-if="experiment.created" :datetime="experiment.created">
            {{ formatDate(experiment.created) }}
          </time>
        </p>
      </div>
      <LabExperimentActions
        :experiment="experiment"
        :component-title="componentTitle"
      />
    </div>
  </article>
</template>
