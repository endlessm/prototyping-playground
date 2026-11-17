<script setup lang="ts">
import LabPlaygroundControls from '../components/LabPlaygroundControls.vue'
import LabPlaygroundStage from '../components/LabPlaygroundStage.vue'
import { useLabComponent } from '../composables/useLabComponent'
import {
  blockingProp,
  changeValue,
  controlFor,
  readValues,
  stageProps,
  writeQuery,
  type ControlValue,
} from '../utils/playground'

// Playground: the real component file on the stage, beside controls built
// from its props. Changed values live in the address, replaced rather than
// pushed so typing doesn't fill the history; what no longer fits a control
// is dropped. A component without a component file, with props that can't
// be read, or with a required prop the panel can't fill says why instead.
// Escape in the stage brings the keyboard back to the controls.
const { component, system, stem, data, reload } = useLabComponent()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const controls = computed(() => data.value?.props?.props.map(controlFor) ?? [])
const values = computed(() => readValues(controls.value, route.query))
const blocking = computed(() => blockingProp(controls.value, values.value))
const props = computed(() => stageProps(controls.value, values.value))

function change(name: string, value: ControlValue | undefined) {
  const next = changeValue(controls.value, values.value, name, value)
  void router.replace({ query: writeQuery(controls.value, next) })
}
function reset() {
  void router.replace({ query: {} })
}
// A prop the component changed itself, such as a modal closed with Escape:
// its control follows, as if the person had set it.
function update(name: string, value: unknown) {
  if (['string', 'number', 'boolean'].includes(typeof value))
    change(name, value as ControlValue)
}

const panel = useTemplateRef('panel')

// An address holding props the component lacks or values that don't fit is
// rewritten without them, so passing the link on doesn't carry them along.
watch(
  () => [data.value?.props, route.query] as const,
  ([loaded, query]) => {
    if (!loaded) return
    const clean = writeQuery(controls.value, values.value)
    const keys = Object.keys(query)
    const same =
      keys.length === Object.keys(clean).length &&
      keys.every((key) => query[key] === clean[key])
    if (!same) void router.replace({ query: clean })
  },
  { immediate: true },
)
</script>

<template>
  <i18n-t
    v-if="!component.playground"
    keypath="lab.playground.noComponent"
    tag="p"
    class="text-sm text-muted"
    scope="global"
  >
    <template #file>
      <code class="font-mono">{{ stem }}.vue</code>
    </template>
  </i18n-t>
  <div
    v-else-if="!data?.props"
    role="alert"
    class="space-y-2 rounded-md border border-default p-3 text-sm"
  >
    <p class="text-default">
      {{ t('lab.playground.unreadable', { name: component.title }) }}
    </p>
    <p v-for="error in data?.errors" :key="error" class="text-muted">
      {{ error }}
    </p>
    <UButton
      size="sm"
      color="neutral"
      variant="outline"
      :label="t('lab.playground.tryAgain')"
      @click="reload"
    />
  </div>
  <div v-else class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
    <!-- The stage stays in view while the controls scroll: above them on
         narrow screens, beside them on wide ones. -->
    <div class="sticky top-0 z-10 min-w-0 bg-default pb-2 lg:top-4 lg:pb-0">
      <i18n-t
        v-if="blocking"
        :keypath="
          blocking.kind === 'code'
            ? 'lab.playground.codeOnly'
            : 'lab.playground.chooseFirst'
        "
        tag="p"
        role="status"
        class="rounded-lg border border-dashed border-default p-4 text-sm text-muted"
        scope="global"
      >
        <template #name>{{ component.title }}</template>
        <template #prop>
          <code class="font-mono text-highlighted">{{ blocking.name }}</code>
        </template>
      </i18n-t>
      <Suspense v-else>
        <LabPlaygroundStage
          :key="component.playground"
          :system-id="system.id"
          :artifact="component.playground"
          :title="t('lab.playground.stage', { name: component.title })"
          :props="props"
          @update="update"
          @escape="panel?.focus()"
        />
      </Suspense>
    </div>
    <LabPlaygroundControls
      ref="panel"
      :controls="controls"
      :values="values"
      :disabled="blocking?.kind === 'code'"
      @change="change"
      @reset="reset"
    />
  </div>
</template>
