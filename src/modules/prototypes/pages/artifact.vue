<script setup lang="ts">
import types from '#studio/file-types'
import AppFileBoundary from '../../../../app/components/AppFileBoundary.vue'
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
  <PrototypeViewer
    :prototype="prototype"
    :artifacts="artifacts"
    :not-found="!artifact"
  >
    <!-- A crash in one file's page stays inside it. -->
    <AppFileBoundary :key="artifact?.id">
      <component
        :is="page"
        v-if="page && prototype && artifact"
        :prototype="prototype"
        :artifact="artifact"
      />
    </AppFileBoundary>
  </PrototypeViewer>
</template>
