<!-- @studio-id vwe1c0me00000001 -->
<!-- @studio-state smbr000000000001 Member -->
<!-- @studio-state snew000000000001 New user -->
<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'

defineProps<{ name?: string }>()
</script>

<script lang="ts">
export const states = [
  { title: 'Member', props: { name: 'Ana' } },
  { title: 'New user', props: { name: '' } },
]
</script>

<template>
  <main>
    <h1>{{ name ? 'Welcome back, ' + name : 'Welcome' }}</h1>
    <p>One screen, two named states.</p>
    <PrototypeLink to="Details">Details</PrototypeLink>
  </main>
</template>
