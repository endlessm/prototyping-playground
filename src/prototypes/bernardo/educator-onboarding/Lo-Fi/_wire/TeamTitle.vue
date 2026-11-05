<script setup lang="ts">
import IconButton from './IconButton.vue'
import Lead from './Lead.vue'
import Title from './Title.vue'
import s from './wire.module.css'

// The team name with a small edit button that opens the rename modal.
defineProps<{ team: string }>()
const emit = defineEmits<{ rename: [] }>()
</script>

<template>
  <div :class="[s.stack, s.tight]">
    <div :class="s.row">
      <Title>{{ team }}</Title>
      <IconButton label="Rename team" @click="emit('rename')">✎</IconButton>
    </div>
    <Lead>Team Dashboard</Lead>
  </div>
</template>
