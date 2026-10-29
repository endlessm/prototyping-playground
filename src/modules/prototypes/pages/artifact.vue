<script setup lang="ts">
import types from '#studio/file-types'
import type { Component } from 'vue'
import PrototypeViewer from '../components/PrototypeViewer.vue'
import { usePrototype } from '../composables/usePrototype'

// The page stays while the person moves between artifacts of a prototype.
definePageMeta({ key: (route) => `prototype:${route.params.prototypeId}` })

const route = useRoute()
const studio = useStudioConfig()
const { t } = useI18n()
const { prototype, artifacts } = await usePrototype(
  () => route.params.prototypeId as string,
)
const artifact = computed(() =>
  artifacts.value.find(({ id }) => id === route.params.artifactId),
)
// One page component per file type, so moving between artifacts of the
// same type keeps the page (and a view's preview document) in place.
const pages = new Map<string, Component>()
const page = computed(() => {
  const id = artifact.value?.type
  const type = id && types[id]
  if (!type) return undefined
  if (!pages.has(id)) pages.set(id, defineAsyncComponent(type.page))
  return pages.get(id)
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
      :key="`${prototype.id}:${artifact.type}`"
      :prototype="prototype"
      :artifact="artifact"
    />
    <p v-else-if="prototype" class="text-muted">
      {{ t('prototypes.notFound') }}
    </p>
  </PrototypeViewer>
</template>
