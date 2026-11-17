<script setup lang="ts">
import { knobTheme } from '../../../../tooling/preview/knobs'
import type { ExperimentBreakdown } from '../experiments/trees'
import type { SavedChanges } from '../experiments/save'
import LabBreakdownStage from './LabBreakdownStage.vue'
import LabJoinNote from './LabJoinNote.vue'
import LabExperimentPreview from './LabExperimentPreview.vue'
import { useBreakdownChanges } from '../composables/useBreakdownChanges'
import { useLabComponent } from '../composables/useLabComponent'
import { useLabExperimentDialog } from '../composables/useLabExperimentDialog'
import { useLeaveGuard } from '../composables/useLeaveGuard'
import { useSavedToast } from '../composables/useSavedToast'
import type { LabExperiment } from '../utils/experiments'
import { experimentSaveAs, requestedChanges } from '../utils/saving'

// An experiment's own Breakdown, on its page in the Lab: the tree read from
// the experiment's file (the Lab's build data, so the deployed site has it
// too), its instrumented preview, piece cards and knobs, as a component's.
// Locally, Save writes the knobs' changes into the file, over the version
// the Breakdown showed when they began, so a file changed on disk since is
// refused; someone who may not change the experiment saves a copy of their
// own instead. The Breakdown follows the file after a save and after any
// edit on disk. Until its tree arrives, the experiment's live preview
// stands in.
const props = defineProps<{ experiment: LabExperiment }>()
const { system, component, data: componentData } = useLabComponent()
const { t } = useI18n()
const { me } = useMe()
const toast = useStudioToast()
const savedToast = useSavedToast()
const route = useRoute()
const router = useRouter()
const base = useRuntimeConfig().app.baseURL
const local = import.meta.dev

const { data, reload } = useModuleData<Record<string, ExperimentBreakdown>>(
  'lab',
  'experiments',
)
const breakdown = computed(() => data.value?.[props.experiment.id] ?? null)
const tree = computed(() => breakdown.value?.tree.tree ?? null)
// The component's props, which the dial panel offers on its instances.
const propDocs = computed(() => componentData.value?.props?.props ?? [])

const selected = ref<string | null>(null)
const changes = useBreakdownChanges()
useLeaveGuard(changes)
const theme = computed(() => knobTheme(system.value))
const mode = computed({
  get: () => (route.query.view === 'component' ? 'component' : 'breakdown'),
  set: (next: 'breakdown' | 'component') =>
    void router.replace({
      query: { ...route.query, view: next === 'component' ? next : undefined },
    }),
})

// The file's newest version, and the one the changes were made over.
const latest = ref<string | null>(null)
const startedOver = ref<string | null>(null)
watch(
  () => breakdown.value?.version,
  (version) => {
    if (version) latest.value = version
  },
  { immediate: true },
)
watch(changes.pending, (count, before) => {
  if (!count) startedOver.value = null
  else if (!before) startedOver.value = latest.value
})

const saveAs = computed(() =>
  experimentSaveAs(me.value, props.experiment.prototype),
)
const canSave = computed(() => Boolean(local && me.value.key))
const saving = ref(false)
const open = useLabExperimentDialog()

function saveAsMine() {
  open({
    request: { action: 'duplicate', experiment: props.experiment.id },
    systemId: props.experiment.systemId,
    component: props.experiment.component,
    title: t('lab.save.dialog.mineTitle'),
    description: t('lab.save.dialog.mineDescription', {
      name: props.experiment.title,
      component: component.value.title,
    }),
    name: props.experiment.title,
    changes: requestedChanges(changes.all()),
    props: changes.allProps(),
    // The changes are kept in the copy now, so leaving doesn't ask.
    onMade: (made) => {
      changes.keepOnly(made.skipped ?? [], made.skippedProps ?? [])
      savedToast(made)
    },
  })
}

async function save() {
  if (saveAs.value === 'mine') return saveAsMine()
  saving.value = true
  try {
    const reply = await requestJson<SavedChanges & { version: string }>(
      `${base}_studio/modules/lab/save`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prototype: props.experiment.prototype.id,
          artifact: props.experiment.id,
          base: startedOver.value ?? latest.value,
          changes: requestedChanges(changes.all()),
          props: changes.allProps(),
        }),
      },
    )
    latest.value = reply.version
    changes.keepOnly(reply.skipped, reply.skippedProps ?? [])
    if (changes.pending.value) startedOver.value = reply.version
    savedToast(reply)
  } catch (error) {
    const failure = error as StudioRequestError
    toast.error(
      t('lab.save.failed'),
      failure.status === 409
        ? `${failure.message} ${t('lab.save.stale')}`
        : failure.message,
    )
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section
    data-lab-experiment-stage
    :aria-label="t('lab.experiments.stage', { name: experiment.title })"
  >
    <LabJoinNote class="mb-3" />
    <Suspense v-if="breakdown && tree">
      <LabBreakdownStage
        :key="breakdown.preview"
        v-model:selected="selected"
        v-model:mode="mode"
        :tree="tree"
        :system-id="experiment.systemId"
        :system-folder="system.folder"
        :system-label="system.label"
        :artifact="breakdown.preview"
        :name="experiment.title"
        :changes="changes"
        :theme="theme"
        :save-as="saveAs"
        :can-save="canSave"
        :saving="saving"
        dials
        :instances="breakdown.instances"
        :prop-docs="propDocs"
        @save="save"
      />
    </Suspense>
    <div
      v-else-if="breakdown?.tree.error"
      role="alert"
      class="space-y-2 rounded-md border border-default p-3 text-sm"
    >
      <p class="text-default">
        {{ t('lab.breakdown.unreadable', { name: experiment.title }) }}
      </p>
      <p class="text-muted">{{ breakdown.tree.error }}</p>
      <UButton
        size="sm"
        color="neutral"
        variant="outline"
        :label="t('lab.breakdown.tryAgain')"
        @click="reload"
      />
    </div>
    <LabExperimentPreview
      v-else
      :system-id="experiment.systemId"
      :experiment="experiment.id"
      :title="experiment.title"
    />
  </section>
</template>
