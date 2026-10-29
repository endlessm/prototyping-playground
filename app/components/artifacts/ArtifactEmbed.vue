<script setup lang="ts">
import types from '#studio/file-types'
import type { Component } from 'vue'
import type { ManifestPrototype } from '../../composables/useManifest'
import type { ReferenceResolution } from '../../utils/artifactReference'
import ArtifactCard from './ArtifactCard.vue'
import EmbedFrame from './EmbedFrame.vue'

// An artifact shown inside another one (a document): a live preview in the
// shared frame when its type has one, otherwise a card; or a card saying
// why nothing can be shown. A preview that crashes says so in its frame and
// leaves the rest of the page working.
const props = defineProps<{
  prototype: ManifestPrototype
  resolution: ReferenceResolution
  /** The author's description, used as the frame's title. */
  label?: string
  /** Where the embed sits: `document` or `canvas`. */
  surface: 'document' | 'canvas'
  width: number
  height: number
}>()

const { t } = useI18n()

// One loaded component per type, shared by every embed of it.
const loaded = new Map<string, Component>()
const embedOf = (type: string) => {
  const load = types[type]?.embed
  if (!load) return undefined
  if (!loaded.has(type)) loaded.set(type, defineAsyncComponent(load))
  return loaded.get(type)
}

const target = computed(() =>
  props.resolution.state === 'resolved' ? props.resolution.artifact : undefined,
)
const preview = computed(() =>
  props.resolution.state === 'resolved' &&
  props.resolution.presentation === 'preview'
    ? embedOf(props.resolution.artifact.type)
    : undefined,
)
const to = computed(() =>
  target.value
    ? `/prototypes/${props.prototype.id}/artifacts/${target.value.id}`
    : undefined,
)

const card = computed(() => {
  const resolution = props.resolution
  if (resolution.state === 'resolved') {
    const type = types[resolution.artifact.type]
    return {
      title: resolution.artifact.title,
      detail: type?.label ?? t('embed.file'),
      icon: type?.icon,
    }
  }
  switch (resolution.code) {
    case 'elsewhere':
      return {
        title: t('embed.elsewhere'),
        detail: t(`embed.elsewhereDetail.${props.surface}`),
        hint: t(`embed.elsewhereHint.${props.surface}`),
      }
    case 'not_found':
      return {
        title: t('embed.notFound'),
        detail: import.meta.dev ? t('embed.missing') : t('embed.notOnSite'),
      }
    case 'invalid_reference':
      return { title: t('embed.notFound'), detail: t('embed.invalid') }
    case 'unavailable':
      return { title: t('embed.notFound'), detail: t('embed.unavailable') }
    case 'inactive_format':
      return { title: t('embed.notFound'), detail: t('embed.inactive') }
  }
  return { title: t('embed.notFound'), detail: t('embed.unavailable') }
})

const failure = ref<unknown>()
watch(
  () => [target.value?.id, target.value?.file],
  () => (failure.value = undefined),
)
onErrorCaptured((error) => {
  failure.value = error
  return false
})
</script>

<template>
  <EmbedFrame v-if="preview && target" :title="label || target.title" :to="to">
    <p
      v-if="failure"
      role="alert"
      class="p-4 text-sm"
      :style="{ height: `${height}px` }"
    >
      {{ t('embed.failed') }}
    </p>
    <Suspense v-else>
      <component
        :is="preview"
        :prototype="prototype"
        :artifact="target"
        :width="width"
        :height="height"
      />
      <template #fallback>
        <p
          role="status"
          class="p-4 text-sm text-muted"
          :style="{ height: `${height}px` }"
        >
          {{ t('embed.loading') }}
        </p>
      </template>
    </Suspense>
  </EmbedFrame>
  <ArtifactCard
    v-else
    :title="card.title"
    :detail="card.detail"
    :icon="card.icon"
    :hint="card.hint"
    :to="to"
  />
</template>
