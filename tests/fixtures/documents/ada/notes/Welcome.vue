<!-- @studio-id d0c5000000000008 -->
<!-- @studio-state d0c5000000000007 Member -->
<script setup lang="ts">
import { usePrototypeArtifactHref } from '#studio/prototype'

defineProps<{ name?: string }>()
const href = usePrototypeArtifactHref()
</script>

<script lang="ts">
export const states = [{ title: 'Member', props: { name: 'Ana' } }]
</script>

<template>
  <main>
    <h1>{{ name ? 'Welcome back, ' + name : 'Welcome' }}</h1>
    <p>Home lives at {{ href('Home') }}</p>
  </main>
</template>
