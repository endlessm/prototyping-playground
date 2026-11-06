<script setup lang="ts">
import { computed } from 'vue'

// An uncontrolled select: it starts on the sample value and can be changed, except to a disabled option.
const props = defineProps<{ options: string[]; value?: string; disabled?: string[] }>()

const items = computed(() =>
  props.options.map((option) => ({ label: option, value: option, disabled: props.disabled?.includes(option) })),
)
</script>

<template>
  <USelect :items="items" :default-value="value ?? options[0]" size="lg" class="w-full" />
</template>
