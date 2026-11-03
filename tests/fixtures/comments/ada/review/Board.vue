<!-- @studio-id b0ard0000000c001 -->
<!-- @studio-state sta0000000000c01 Full -->
<!-- @studio-state stb0000000000c01 Empty -->
<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ name?: string }>()
const count = ref(0)
</script>

<script lang="ts">
export const states = [
  { title: 'Full', props: { name: 'Ana' } },
  { title: 'Empty', props: { name: '' } },
]
</script>

<template>
  <main style="padding: 24px">
    <h1>{{ name ? 'Students of ' + name : 'No students yet' }}</h1>
    <button type="button" data-testid="invite" @click="count++">
      Invite students
    </button>
    <p>Invited {{ count }}</p>
    <p data-testid="deadline">Remember the deadline</p>
    <a href="https://example.com/help">Help</a>
    <label>Notes <input type="text" /></label>
    <div style="height: 2000px"></div>
    <p id="bottom">Bottom of the board</p>
  </main>
</template>
