<script setup lang="ts">
import PrototypeViewer from '../components/PrototypeViewer.vue'
import { usePrototype } from '../composables/usePrototype'

// A prototype's address opens its first artifact, replacing the history
// entry so Back doesn't return here.
const route = useRoute()
const { prototype, artifacts } = await usePrototype(
  () => route.params.prototypeId as string,
)
const first = artifacts.value[0]
if (prototype.value && first)
  await navigateTo(
    {
      path: `/prototypes/${prototype.value.id}/artifacts/${first.id}`,
      query: route.query,
      hash: route.hash,
    },
    { replace: true },
  )
</script>

<template>
  <PrototypeViewer :prototype="prototype" :artifacts="artifacts" />
</template>
