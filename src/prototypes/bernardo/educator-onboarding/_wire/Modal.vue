<script setup lang="ts">
import { useId } from 'vue'
import IconButton from './IconButton.vue'
import Lead from './Lead.vue'
import { useEscape } from './useEscape'
import s from './wire.module.css'

// A centered pop-up for one short task, such as renaming. Escape, the close button and the backdrop all close it.
defineProps<{ title: string; lead?: string }>()
const emit = defineEmits<{ close: [] }>()

const titleId = useId()
useEscape(() => emit('close'))
</script>

<template>
  <div :class="s.backdrop" @click.self="emit('close')">
    <div role="dialog" aria-modal="true" :aria-labelledby="titleId" :class="s.modal">
      <div :class="s.dialogHeader">
        <div :class="[s.stack, s.tight]">
          <h2 :id="titleId" :class="s.subtitle">{{ title }}</h2>
          <Lead v-if="lead">{{ lead }}</Lead>
        </div>
        <IconButton label="Close" @click="emit('close')">×</IconButton>
      </div>
      <div :class="[s.dialogBody, s.stack]"><slot /></div>
      <div v-if="$slots.footer" :class="s.dialogFooter"><slot name="footer" /></div>
    </div>
  </div>
</template>
