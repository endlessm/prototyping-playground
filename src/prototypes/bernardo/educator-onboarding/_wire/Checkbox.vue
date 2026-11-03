<script setup lang="ts">
import s from './wire.module.css'

defineProps<{ label: string; checked?: boolean }>()
</script>

<template>
  <label :class="[s.row, s.label]">
    <input type="checkbox" :class="s.checkbox" :checked="checked" />
    {{ label }}
  </label>
</template>
