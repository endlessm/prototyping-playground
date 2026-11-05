<script setup lang="ts">
// An uncontrolled field: it starts with the sample value and can be typed in, unless it's locked.
// `active` marks the field the error below it is about.
withDefaults(
  defineProps<{ value?: string; placeholder?: string; active?: boolean; locked?: boolean; type?: string }>(),
  { type: 'text' },
)
</script>

<template>
  <UInput
    :default-value="value"
    :placeholder="placeholder"
    :type="type"
    :readonly="locked"
    :color="active ? 'error' : 'primary'"
    :highlight="active"
    :variant="locked ? 'soft' : 'outline'"
    :trailing-icon="locked ? 'i-lucide-lock' : undefined"
    size="lg"
    class="w-full"
  />
</template>
