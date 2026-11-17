<script setup lang="ts">
import LabExperimentCard from '../components/LabExperimentCard.vue'
import LabJoinNote from '../components/LabJoinNote.vue'
import { useLabComponent } from '../composables/useLabComponent'
import { useLabExperimentDialog } from '../composables/useLabExperimentDialog'
import { experimentsOf } from '../utils/experiments'

// Experiments: everyone's experiments with the component, from the
// manifest, each with its live preview, name, maker and date, newest
// first. New experiment starts one from the component as it is, in your own
// "<Component> experiments" prototype, only while the studio runs locally
// and for someone registered; someone who hasn't joined is told how. The
// deployed site lists them too.
const { system, component, stem } = useLabComponent()
const { t } = useI18n()
const manifest = await useManifest()
const { me } = useMe()
const local = import.meta.dev
const open = useLabExperimentDialog()

const experiments = computed(() =>
  experimentsOf(manifest.value, system.value.id, component.value.slug),
)

function create() {
  open({
    request: {
      action: 'create',
      system: system.value.id,
      component: component.value.slug,
    },
    systemId: system.value.id,
    component: component.value.slug,
    title: t('lab.experiments.dialog.newTitle'),
    description: t('lab.experiments.dialog.newDescription', {
      name: component.value.title,
    }),
  })
}
</script>

<template>
  <section
    :aria-label="t('lab.experiments.label', { name: component.title })"
    class="space-y-5"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <p class="max-w-prose text-sm text-muted">
        {{ t('lab.experiments.description', { name: component.title }) }}
      </p>
      <UButton
        v-if="local && me.key && component.source"
        icon="i-lucide-plus"
        :label="t('lab.experiments.new')"
        @click="create"
      />
    </div>
    <LabJoinNote />
    <i18n-t
      v-if="local && me.key && !component.source"
      keypath="lab.experiments.noComponent"
      tag="p"
      class="text-sm text-muted"
      scope="global"
    >
      <template #file>
        <code class="font-mono">{{ stem }}.vue</code>
      </template>
    </i18n-t>
    <p v-if="!experiments.length" class="text-sm text-muted">
      {{ t('lab.experiments.empty') }}
    </p>
    <div v-else class="@container">
      <div class="grid grid-cols-1 gap-5 @3xl:grid-cols-2">
        <LabExperimentCard
          v-for="experiment in experiments"
          :key="experiment.id"
          :experiment="experiment"
          :component-title="component.title"
        />
      </div>
    </div>
  </section>
</template>
