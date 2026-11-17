<script setup lang="ts">
import LabExperimentPreview from './LabExperimentPreview.vue'
import type { LabExperiment } from '../utils/experiments'

// Where an experiment's own Breakdown shows, on its page in the Lab: the
// Breakdown stage, fed by the experiment view's file, mounts here. Until it
// does, the experiment's live preview stands in.
defineProps<{ experiment: LabExperiment }>()
const { t } = useI18n()
</script>

<template>
  <section
    data-lab-experiment-stage
    :aria-label="t('lab.experiments.stage', { name: experiment.title })"
  >
    <LabExperimentPreview
      :system-id="experiment.systemId"
      :experiment="experiment.id"
      :title="experiment.title"
    />
  </section>
</template>
