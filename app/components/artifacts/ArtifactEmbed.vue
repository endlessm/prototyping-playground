<script setup lang="ts">
import types from '#studio/file-types'
import type { Component } from 'vue'
import type { ManifestPrototype } from '../../composables/useManifest'
import type {
  EmbedSurface,
  ReferenceResolution,
} from '../../utils/artifactReference'
import ArtifactCard from './ArtifactCard.vue'
import EmbedFrame from './EmbedFrame.vue'

// An artifact shown inside another one (a document, a canvas): a live
// preview in the shared frame when its type has one there, otherwise a
// card; or a card saying why nothing can be shown. A preview that crashes
// says so in its frame, leaves the rest of the page working, and tries
// again when its file changes.
const props = withDefaults(
  defineProps<{
    prototype: ManifestPrototype
    resolution: ReferenceResolution
    /** The author's description, used as the frame's title. */
    label?: string
    /** Where the embed sits. */
    surface: EmbedSurface
    /** The preview's size, inside the frame. */
    width: number
    height: number
    /** False keeps the frame with a quiet placeholder, not the preview. */
    mounted?: boolean
    /** Not painted, but the preview keeps running and updating. */
    hidden?: boolean
    /** A picture only: the preview takes no pointer, focus or keys. */
    inert?: boolean
  }>(),
  { label: undefined, mounted: true, hidden: false, inert: false },
)

const { t } = useI18n()

// One loaded component per type, shared by every embed of it here.
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
// A type's own surface while its preview loads, from when loading began,
// so its delayed status continues across the handoff to the preview.
const pending = computed(() =>
  target.value ? types[target.value.type]?.embedPending : undefined,
)
const startedAt = ref(Date.now())
watch(target, () => (startedAt.value = Date.now()))
const timing = computed(() =>
  pending.value ? { startedAt: startedAt.value } : {},
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
      icon: type?.icon ?? 'i-lucide-file',
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
// Counts fresh attempts after a failure.
const attempt = ref(0)
function retry() {
  if (!failure.value) return
  if (target.value) loaded.delete(target.value.type)
  failure.value = undefined
  attempt.value++
}
watch(() => [target.value?.id, target.value?.file], retry)
if (import.meta.hot) {
  const hot = import.meta.hot
  const changed = ({ files }: { files: string[] }) => {
    if (target.value && files.includes(target.value.file)) retry()
  }
  hot.on('studio:source', changed)
  onScopeDispose(() => hot.off('studio:source', changed))
}
onErrorCaptured((error) => {
  failure.value = error
  return false
})
</script>

<template>
  <EmbedFrame v-if="preview && target" :title="label || target.title" :to="to">
    <div
      class="min-h-0"
      :class="{ 'pointer-events-none': inert }"
      :inert="inert || undefined"
      :style="{
        height: `${height}px`,
        ...(hidden
          ? { visibility: 'hidden', contentVisibility: 'hidden' }
          : {}),
      }"
    >
      <div v-if="!mounted" class="h-full bg-muted/50" />
      <p v-else-if="failure" role="alert" class="h-full p-4 text-sm">
        {{ t('embed.failed') }}
      </p>
      <Suspense v-else :key="attempt">
        <component
          :is="preview"
          :prototype="prototype"
          :artifact="target"
          :width="width"
          :height="height"
          v-bind="timing"
        />
        <template #fallback>
          <component :is="pending" v-if="pending" :started-at="startedAt" />
          <p
            v-else
            role="status"
            class="h-full bg-muted/50 p-4 text-sm text-muted"
          >
            {{ t('embed.loading') }}
          </p>
        </template>
      </Suspense>
    </div>
    <slot />
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
