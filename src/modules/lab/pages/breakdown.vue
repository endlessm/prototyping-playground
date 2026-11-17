<script setup lang="ts">
import LabBreakdownStage from '../components/LabBreakdownStage.vue'
import { useBreakdownChanges } from '../composables/useBreakdownChanges'
import { useLabComponent } from '../composables/useLabComponent'
import { controlFor, readValues, stageProps } from '../utils/playground'

// Breakdown: the component drawn as the tree of pieces it is built from,
// its root live with the same values the Playground opens with (its
// Default example's), so it never starts empty. Whether the canvas shows
// the breakdown or the component alone lives in the address. A component
// without a component file, or one whose structure can't be read, says
// why.
const { component, system, stem, data, reload } = useLabComponent()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const result = computed(() => data.value?.breakdown ?? null)
const props = computed(() => {
  const loaded = data.value
  const controls =
    loaded?.props?.props.map((prop) =>
      controlFor(prop, loaded.seeds[prop.name]),
    ) ?? []
  return stageProps(controls, readValues(controls, {}))
})

const selected = ref<string | null>(null)

// Knob changes are kept for this component only, and only in memory.
const changes = useBreakdownChanges()
watch(() => component.value.breakdown, changes.reset)
const theme = computed(() => ({
  colors: system.value.colors,
  // The theme's own text sizes (`--text-body`), which aren't colours.
  textSizes: system.value.tokens.flatMap(({ name }) => {
    const size = /^--text-([a-z0-9]+)$/.exec(name)?.[1]
    return size ? [size] : []
  }),
}))
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
      :props="props"
      :changes="changes"
      :theme="theme"
    />
  </Suspense>
</template>
