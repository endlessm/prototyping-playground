<script setup lang="ts">
import { PREVIEW_CHANNEL } from '../../../../../tooling/preview/constants'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../../app/composables/useManifest'

// A view renders in its system's preview document, a same-origin iframe
// that holds only the system's app.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
}>()

const { t } = useI18n()
const { previewUrl } = await useSystems()
const src = computed(() =>
  previewUrl(props.prototype.systemId, props.artifact.id),
)
const frame = useTemplateRef('frame')
const state = ref<'loading' | 'ready' | 'error'>('loading')
watch(src, () => (state.value = 'loading'))

useEventListener(window, 'message', (event: MessageEvent) => {
  const data = event.data as { channel?: string; state?: typeof state.value }
  if (
    event.origin !== location.origin ||
    event.source !== frame.value?.contentWindow ||
    data?.channel !== PREVIEW_CHANNEL ||
    !data.state
  )
    return
  state.value = data.state
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-2">
    <div class="flex justify-end">
      <UButton
        :to="src"
        external
        target="_blank"
        icon="i-lucide-external-link"
        size="sm"
        :label="t('prototypes.openInTab')"
      />
    </div>
    <iframe
      ref="frame"
      :src="src"
      :title="artifact.title"
      :data-preview-state="state"
      class="min-h-0 w-full flex-1 rounded-md border border-default bg-white"
    />
  </div>
</template>
