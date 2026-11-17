<script setup lang="ts">
import type { ControlValue, PlaygroundControl } from '../utils/playground'

// One prop's control: labelled with the prop's name, its description in a
// tooltip on the name, required props marked. Props the panel can't edit
// show their type and that code sets them.
const props = defineProps<{
  control: PlaygroundControl
  /** The changed value, or undefined at its start. */
  value: ControlValue | undefined
  disabled?: boolean
}>()
const emit = defineEmits<{ change: [value: ControlValue | undefined] }>()
const { t } = useI18n()

// Reka's select can't hold undefined, so Default stands in for it.
const UNSET = '\u0000default'
const shown = computed(() => props.value ?? props.control.start)
const items = computed(() =>
  props.control.kind === 'select'
    ? [
        ...(props.control.unset
          ? [{ label: t('lab.playground.default'), value: UNSET }]
          : []),
        ...props.control.options.map((option) => ({
          label: option,
          value: option,
        })),
      ]
    : [],
)

function pick(value: unknown) {
  emit('change', value === UNSET ? undefined : (value as string))
}
function type(value: string | number | null | undefined) {
  emit('change', value === null || value === '' ? undefined : value)
}
</script>

<template>
  <li class="min-w-0">
    <UFormField
      v-if="control.kind !== 'code'"
      :name="control.name"
      :ui="{ label: 'font-mono text-xs' }"
    >
      <template #label>
        <UTooltip
          :text="control.description"
          :disabled="!control.description"
          :content="{ side: 'left' }"
          :ui="{ content: 'h-auto max-w-xs', text: 'whitespace-normal' }"
        >
          <span :class="{ 'cursor-help': control.description }">{{
            control.name
          }}</span>
        </UTooltip>
        <!-- The control itself says it is required, so this mark is only seen. -->
        <span
          v-if="control.required"
          aria-hidden="true"
          class="ms-0.5 text-error"
          >*</span
        >
      </template>
      <USelect
        v-if="control.kind === 'select'"
        :model-value="
          (shown as string | undefined) ?? (control.unset ? UNSET : undefined)
        "
        :items="items"
        :placeholder="t('lab.playground.choose')"
        :required="control.required"
        :disabled="disabled"
        size="sm"
        class="w-full"
        @update:model-value="pick"
      />
      <USwitch
        v-else-if="control.kind === 'switch'"
        :model-value="Boolean(shown)"
        :required="control.required"
        :disabled="disabled"
        size="sm"
        @update:model-value="emit('change', $event)"
      />
      <UInputNumber
        v-else-if="control.kind === 'number'"
        :model-value="(shown as number | undefined) ?? null"
        :required="control.required"
        :disabled="disabled"
        size="sm"
        class="w-full"
        @update:model-value="type"
      />
      <UInput
        v-else
        :model-value="(shown as string | undefined) ?? ''"
        :required="control.required"
        :disabled="disabled"
        size="sm"
        class="w-full"
        @update:model-value="type"
      />
    </UFormField>
    <div v-else class="text-sm">
      <p class="font-mono text-xs text-highlighted">
        <UTooltip
          :text="control.description"
          :disabled="!control.description"
          :content="{ side: 'left' }"
          :ui="{ content: 'h-auto max-w-xs', text: 'whitespace-normal' }"
        >
          <span :class="{ 'cursor-help': control.description }">{{
            control.name
          }}</span>
        </UTooltip>
        <template v-if="control.required">
          <span aria-hidden="true" class="ms-0.5 text-error">*</span>
          <span class="sr-only">{{ t('lab.playground.required') }}</span>
        </template>
      </p>
      <p class="mt-1 text-xs text-muted">{{ t('lab.playground.setInCode') }}</p>
      <p
        class="mt-1 truncate font-mono text-xs text-muted"
        :title="control.type"
      >
        {{ control.type }}
      </p>
    </div>
  </li>
</template>
