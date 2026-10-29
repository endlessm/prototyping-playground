<script setup lang="ts">
import types from '#studio/file-types'
import type { Component } from 'vue'
import AppFileBoundary from '../../../../app/components/AppFileBoundary.vue'
import ArtifactActions from '../components/ArtifactActions.vue'
import ArtifactUnavailable from '../components/ArtifactUnavailable.vue'
import PrototypeViewer from '../components/PrototypeViewer.vue'
import { usePrototype } from '../composables/usePrototype'

// The page stays while the person moves between artifacts of a prototype.
definePageMeta({ key: (route) => `prototype:${route.params.prototypeId}` })

// The source editor exists only in the studio running locally, so the
// deployed site never loads it.
const ArtifactSource = import.meta.dev
  ? defineAsyncComponent(() => import('../components/ArtifactSource.vue'))
  : undefined

const route = useRoute()
const studio = useStudioConfig()
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
  if (!type || artifact.value?.unavailable) return undefined
  if (!pages.has(id)) pages.set(id, defineAsyncComponent(type.page))
  return pages.get(id)
})

const rendered = useTemplateRef<HTMLElement>('rendered')
const { source, toggle } = useSourceMode(rendered)

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
    <!-- The rendered page stays alive, hidden and inert, while its source
         is open, and keeps updating. -->
    <div
      v-show="!source"
      ref="rendered"
      tabindex="-1"
      :inert="source || undefined"
      class="h-full min-h-0 outline-none"
    >
      <ArtifactUnavailable
        v-if="artifact?.unavailable"
        :unavailable="artifact.unavailable"
        @source="toggle"
      />
      <!-- A crash in one file's page stays inside it. Keyed like the page,
           so moving between artifacts of the same type keeps both in place. -->
      <AppFileBoundary v-else :key="`${prototype?.id}:${artifact?.type}`">
        <component
          :is="page"
          v-if="page && prototype && artifact"
          :prototype="prototype"
          :artifact="artifact"
        >
          <template v-if="ArtifactSource" #actions>
            <ArtifactActions :prototype="prototype" @source="toggle" />
          </template>
        </component>
      </AppFileBoundary>
    </div>
    <ArtifactSource
      v-if="ArtifactSource && source && prototype && artifact"
      :key="artifact.id"
      :prototype="prototype"
      :artifact="artifact"
      @done="toggle"
    />
  </PrototypeViewer>
</template>
