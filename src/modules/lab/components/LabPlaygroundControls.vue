<script setup lang="ts">
import type {
  ControlValue,
  PlaygroundControl,
  PlaygroundValues,
} from '../utils/playground'
import LabPlaygroundControl from './LabPlaygroundControl.vue'

// The panel beside the stage: one control per prop, in the component's
// order, and Reset, which brings every prop back to its start. Reset stays
// enabled, so a keyboard press never drops the focus, and says it worked.
// While the stage can't start, the controls are shown but disabled.
const props = defineProps<{
  controls: PlaygroundControl[]
  values: PlaygroundValues
  disabled?: boolean
}>()
const emit = defineEmits<{
  change: [name: string, value: ControlValue | undefined]
  reset: []
}>()
const { t } = useI18n()

const editable = computed(() =>
  props.controls.some((control) => control.kind !== 'code'),
)
const wasReset = ref(false)
function reset() {
  emit('reset')
  wasReset.value = true
}
function change(name: string, value: ControlValue | undefined) {
  wasReset.value = false
  emit('change', name, value)
}

// The control last used, so the keyboard can come back to it from the stage.
const panel = useTemplateRef('panel')
let lastUsed: HTMLElement | null = null
function remember(event: FocusEvent) {
  const target = event.target as HTMLElement
  if (target.closest('li')) lastUsed = target
}
/** Focuses the control last used, or the first one. */
function focus() {
  const target =
    lastUsed?.isConnected && !lastUsed.matches(':disabled')
      ? lastUsed
      : panel.value?.querySelector<HTMLElement>(
          'li :is(button, input):not(:disabled)',
        )
  target?.focus()
}
defineExpose({ focus })
</script>

<template>
  <section
    ref="panel"
    aria-labelledby="lab-playground-props"
    class="rounded-lg border border-default p-4"
    @focusin="remember"
  >
    <div class="mb-3 flex items-center justify-between gap-2">
      <h2
        id="lab-playground-props"
        class="text-sm font-semibold text-highlighted"
      >
        {{ t('lab.playground.props') }}
      </h2>
      <UButton
        v-if="editable"
        size="xs"
        color="neutral"
        variant="outline"
        icon="i-lucide-rotate-ccw"
        :label="t('lab.playground.reset')"
        :disabled="disabled"
        @click="reset"
      />
    </div>
    <p role="status" class="sr-only">
      {{ wasReset ? t('lab.playground.resetDone') : '' }}
    </p>
    <ul v-if="controls.length" class="space-y-4">
      <LabPlaygroundControl
        v-for="control in controls"
        :key="control.name"
        :control="control"
        :value="values[control.name]"
        :disabled="disabled"
        @change="change(control.name, $event)"
      />
    </ul>
    <p v-else class="text-sm text-muted">{{ t('lab.playground.noProps') }}</p>
  </section>
</template>
