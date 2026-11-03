<script setup lang="ts">
import s from './wire.module.css'

// An uncontrolled field: it starts with the sample value and can be typed in.
withDefaults(defineProps<{ value?: string; placeholder?: string; active?: boolean; type?: string }>(), {
  type: 'text',
})
</script>

<template>
  <input :class="[s.input, active && s.inputActive]" :value="value" :placeholder="placeholder" :type="type" />
</template>
