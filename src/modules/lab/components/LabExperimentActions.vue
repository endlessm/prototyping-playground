<script setup lang="ts">
import { useLabExperimentDialog } from '../composables/useLabExperimentDialog'
import { viewAddress, type LabExperiment } from '../utils/experiments'

// An experiment's actions: Open as view, its page in its prototype with
// comments; and, while the studio runs locally for someone registered,
// Duplicate into your own experiments. Renaming and deleting are the
// prototype's own tools.
const props = defineProps<{
  experiment: LabExperiment
  /** The component's title, for the dialog. */
  componentTitle: string
}>()
const { t } = useI18n()
const { me } = useMe()
const local = import.meta.dev
const open = useLabExperimentDialog()

function duplicate() {
  open({
    request: { action: 'duplicate', experiment: props.experiment.id },
    systemId: props.experiment.systemId,
    component: props.experiment.component,
    title: t('lab.experiments.dialog.duplicateTitle'),
    description: t('lab.experiments.dialog.duplicateDescription', {
      name: props.experiment.title,
      component: props.componentTitle,
    }),
    name: props.experiment.title,
  })
}
</script>

<template>
  <div class="flex shrink-0 flex-wrap gap-1">
    <UButton
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-lucide-app-window"
      :to="viewAddress(experiment)"
      :label="t('lab.experiments.openAsView')"
    />
    <UButton
      v-if="local && me.key"
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-lucide-copy"
      :label="t('lab.experiments.duplicate')"
      :aria-label="
        t('lab.experiments.duplicateNamed', { name: experiment.title })
      "
      @click="duplicate"
    />
  </div>
</template>
