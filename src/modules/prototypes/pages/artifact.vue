<script setup lang="ts">
import types from '#studio/file-types'
import PrototypeViewer from '../components/PrototypeViewer.vue'
import { usePrototype } from '../composables/usePrototype'

const route = useRoute()
const studio = useStudioConfig()
const { prototype, artifacts } = await usePrototype(
  () => route.params.prototypeId as string,
)
const artifact = computed(() =>
  artifacts.value.find(({ id }) => id === route.params.artifactId),
)
const page = computed(() => {
  const type = artifact.value && types[artifact.value.type]
  return type ? defineAsyncComponent(type.page) : undefined
})

useHead({
  title: () =>
    prototype.value && artifact.value
      ? `${prototype.value.title} — ${artifact.value.title} — ${studio.name}`
      : studio.name,
})
</script>

<template>
  <PrototypeViewer :prototype="prototype" :artifacts="artifacts">
    <component
      :is="page"
      v-if="page && prototype && artifact"
      :key="artifact.id"
      :prototype="prototype"
      :artifact="artifact"
    />
  </PrototypeViewer>
</template>
