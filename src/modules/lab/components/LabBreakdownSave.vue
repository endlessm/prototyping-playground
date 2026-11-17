<script setup lang="ts">
// Reset and Save at the end of the Breakdown's inspector. Save names where
// the changes go (a new experiment from the original component, a copy of
// someone else's experiment, or the experiment's own file) and counts them.
const props = defineProps<{
  pending: number
  saveAs: 'experiment' | 'mine' | 'file'
  /** Whether saving is offered here; until then Save stays disabled. */
  canSave: boolean
}>()
const emit = defineEmits<{ reset: []; save: [] }>()
const { t } = useI18n()

const text = computed(() =>
  props.saveAs === 'experiment'
    ? t('lab.knobs.saveAsExperiment')
    : props.saveAs === 'mine'
      ? t('lab.knobs.saveAsMine')
      : t('lab.knobs.save'),
)
const label = computed(() =>
  props.pending
    ? `${text.value}, ${t('lab.knobs.pending', { count: props.pending }, props.pending)}`
    : text.value,
)
</script>

<template>
  <UTooltip :text="t('lab.knobs.reset')" :content="{ side: 'top' }">
    <UButton
      icon="i-lucide-rotate-ccw"
      color="neutral"
      variant="ghost"
      size="sm"
      class="rounded-full"
      :aria-label="t('lab.knobs.reset')"
      :disabled="!pending"
      @click="emit('reset')"
    />
  </UTooltip>
  <UButton
    color="neutral"
    variant="solid"
    size="sm"
    class="shrink-0 rounded-full"
    :aria-label="label"
    :disabled="!canSave || !pending"
    @click="emit('save')"
  >
    {{ text }}
    <span
      v-if="pending"
      class="grid h-4 min-w-4 place-items-center rounded-full bg-inverted/20 px-1 text-[10px] tabular-nums"
      >{{ pending }}</span
    >
  </UButton>
</template>
