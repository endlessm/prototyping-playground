<script setup lang="ts">
import type {
  ControlValue,
  PlaygroundControl,
  PlaygroundValues,
} from '../utils/playground'
import LabPlaygroundControl from './LabPlaygroundControl.vue'

// The panel beside the stage: one control per prop, in the component's
// order, and Reset, which brings every prop back to its start.
defineProps<{
  controls: PlaygroundControl[]
  values: PlaygroundValues
}>()
const emit = defineEmits<{
  change: [name: string, value: ControlValue | undefined]
  reset: []
}>()
const { t } = useI18n()
</script>

<template>
  <section
    aria-labelledby="lab-playground-props"
    class="rounded-lg border border-default p-4"
  >
    <div class="mb-3 flex items-center justify-between gap-2">
      <h2
        id="lab-playground-props"
        class="text-sm font-semibold text-highlighted"
      >
        {{ t('lab.playground.props') }}
      </h2>
      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        icon="i-lucide-rotate-ccw"
        :label="t('lab.playground.reset')"
        :disabled="!Object.keys(values).length"
        @click="emit('reset')"
      />
    </div>
    <ul v-if="controls.length" class="space-y-4">
      <LabPlaygroundControl
        v-for="control in controls"
        :key="control.name"
        :control="control"
        :value="values[control.name]"
        @change="emit('change', control.name, $event)"
      />
    </ul>
    <p v-else class="text-sm text-muted">{{ t('lab.playground.noProps') }}</p>
  </section>
</template>
