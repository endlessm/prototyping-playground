<script setup lang="ts">
import s from './wire.module.css'

// An uncontrolled select: it starts on the sample value and can be changed, except to a disabled option.
defineProps<{ options: string[]; value?: string; disabled?: string[] }>()
</script>

<template>
  <select :class="s.input">
    <option
      v-for="option in options"
      :key="option"
      :selected="option === value"
      :disabled="disabled?.includes(option)"
    >
      {{ option }}
    </option>
  </select>
</template>
