<!-- @studio-id g0ne00000000a001 -->
<!-- @studio-state gstm00000000a001 Member -->
<script setup lang="ts">
const word = 'Gone'
</script>

<script lang="ts">
// Read statically, the list names Member; running, it has no states.
export const states = [{ title: 'Member', props: {} }].filter(() => false)
</script>

<template>
  <p>{{ word }}</p>
</template>
