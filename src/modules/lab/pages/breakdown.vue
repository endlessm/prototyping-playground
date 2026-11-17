<script setup lang="ts">
import { knobTheme } from '../../../../tooling/preview/knobs'
import LabBreakdownStage from '../components/LabBreakdownStage.vue'
import { useBreakdownChanges } from '../composables/useBreakdownChanges'
import { useLabComponent } from '../composables/useLabComponent'
import { useLabExperimentDialog } from '../composables/useLabExperimentDialog'
import { useLeaveGuard } from '../composables/useLeaveGuard'
import { useSavedToast } from '../composables/useSavedToast'
import { requestedChanges } from '../utils/saving'

// Breakdown: the component drawn as the tree of pieces it is built from,
// starting from the source its new experiments start from (its Default
// example, so it never starts empty), so Save as experiment writes every
// change into the new experiment's own tags. Whether the canvas shows
// the breakdown or the component alone lives in the address. The original
// never changes: Save as experiment keeps the knobs' changes as a new
// experiment, and leaving with changes asks first. A component without a
// component file, or one whose structure can't be read, says why.
const { component, system, stem, data, reload } = useLabComponent()
const { t } = useI18n()
const { me } = useMe()
const savedToast = useSavedToast()
const route = useRoute()
const router = useRouter()

const result = computed(() => data.value?.breakdown ?? null)

const selected = ref<string | null>(null)

// Knob changes are kept for this component only, and only in memory.
const changes = useBreakdownChanges()
watch(() => component.value.breakdown, changes.reset)
useLeaveGuard(changes)
const theme = computed(() => knobTheme(system.value))
const canSave = computed(() =>
  Boolean(import.meta.dev && me.value.key && component.value.source),
)
const open = useLabExperimentDialog()
function saveAsExperiment() {
  open({
    request: {
      action: 'create',
      system: system.value.id,
      component: component.value.slug,
    },
    systemId: system.value.id,
    component: component.value.slug,
    title: t('lab.save.dialog.experimentTitle'),
    description: t('lab.save.dialog.experimentDescription', {
      name: component.value.title,
    }),
    changes: requestedChanges(changes.all()),
    // The changes are kept in the experiment now, so leaving doesn't ask.
    onMade: (made) => {
      changes.keepOnly(made.skipped ?? [])
      savedToast(made)
    },
  })
}
const mode = computed({
  get: () => (route.query.view === 'component' ? 'component' : 'breakdown'),
  set: (next: 'breakdown' | 'component') =>
    void router.replace({
      query: { ...route.query, view: next === 'component' ? next : undefined },
    }),
})
</script>

<template>
  <i18n-t
    v-if="!component.breakdown"
    keypath="lab.breakdown.noComponent"
    tag="p"
    class="text-sm text-muted"
    scope="global"
  >
    <template #file>
      <code class="font-mono">{{ stem }}.vue</code>
    </template>
  </i18n-t>
  <div
    v-else-if="!result?.tree"
    role="alert"
    class="space-y-2 rounded-md border border-default p-3 text-sm"
  >
    <p class="text-default">
      {{ t('lab.breakdown.unreadable', { name: component.title }) }}
    </p>
    <p v-if="result?.error" class="text-muted">{{ result.error }}</p>
    <UButton
      size="sm"
      color="neutral"
      variant="outline"
      :label="t('lab.breakdown.tryAgain')"
      @click="reload"
    />
  </div>
  <Suspense v-else>
    <LabBreakdownStage
      :key="component.breakdown"
      v-model:selected="selected"
      v-model:mode="mode"
      :tree="result.tree"
      :system-id="system.id"
      :system-folder="system.folder"
      :system-label="system.label"
      :artifact="component.breakdown"
      :name="component.title"
      :changes="changes"
      :theme="theme"
      save-as="experiment"
      :can-save="canSave"
      @save="saveAsExperiment"
    />
  </Suspense>
</template>
