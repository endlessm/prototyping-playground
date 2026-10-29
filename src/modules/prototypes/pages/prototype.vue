<script setup lang="ts">
import PrototypeEmpty from '../components/PrototypeEmpty.vue'
import PrototypeViewer from '../components/PrototypeViewer.vue'
import { usePrototype } from '../composables/usePrototype'

// A prototype's address opens its first artifact, replacing the history
// entry so Back doesn't return here. A prototype with no artifacts stays
// here and says what to add, until its first artifact appears.
const route = useRoute()
const studio = useStudioConfig()
const { prototype, artifacts } = await usePrototype(
  () => route.params.prototypeId as string,
)

async function openFirst() {
  const first = artifacts.value[0]
  if (!prototype.value || !first) return
  await navigateTo(
    {
      path: `/prototypes/${prototype.value.id}/artifacts/${first.id}`,
      query: route.query,
      hash: route.hash,
    },
    { replace: true },
  )
}
await openFirst()
watch(() => artifacts.value[0], openFirst)

useHead({
  title: () =>
    prototype.value ? `${prototype.value.title} — ${studio.name}` : studio.name,
})
</script>

<template>
  <PrototypeViewer :prototype="prototype" :artifacts="artifacts">
    <PrototypeEmpty
      v-if="prototype && !artifacts.length"
      :prototype="prototype"
    />
  </PrototypeViewer>
</template>
