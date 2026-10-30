<script setup lang="ts">
import AppFileError from '../../../../../app/components/AppFileError.vue'
import MarkdownReader from '../../../../../app/components/markdown/MarkdownReader.vue'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../../app/composables/useManifest'
import {
  parseDocument,
  type ParsedDocument,
} from '../../../../../app/markdown/parse'

// A document's page: the `.md` file read in the studio's own style, not its
// prototype's system. Saving the file updates the open page in place,
// keeping its scroll; while the newer text is on its way the page says it is
// out of date. Text that can't be read shows the error until it is fixed.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
}>()

const SLOW_MS = 200
const { t } = useI18n()
const artifacts = await usePrototypeArtifacts(() => props.prototype.id)
provideMarkdownOrigin(() => ({
  prototype: props.prototype,
  artifact: props.artifact,
  artifacts: artifacts.value,
}))

const {
  text,
  error: loadError,
  updating,
} = useArtifactText(
  () => props.prototype,
  () => props.artifact,
)

const parsed = shallowRef<{ id: string; document: ParsedDocument }>()
const parseError = ref<unknown>()
const parsing = ref(false)
let parses = 0
watch(
  text,
  async (source) => {
    if (source === undefined) return
    const parse = ++parses
    const id = props.artifact.id
    parsing.value = true
    try {
      const document = await parseDocument(source, {
        file: props.artifact.file,
      })
      if (parse !== parses) return
      parsed.value = { id, document }
      parseError.value = undefined
    } catch (failure) {
      if (parse !== parses) return
      parseError.value = failure
    } finally {
      if (parse === parses) parsing.value = false
    }
  },
  { immediate: true },
)

// A part of the page that crashes shows the error; the next text tries again.
const renderError = ref<unknown>()
watch(text, () => (renderError.value = undefined))
onErrorCaptured((failure) => {
  renderError.value = failure
  return false
})

const error = computed(
  () => loadError.value ?? parseError.value ?? renderError.value,
)
const current = computed(() =>
  parsed.value?.id === props.artifact.id ? parsed.value.document : undefined,
)
const catchingUp = computed(() => updating.value || parsing.value)
const slow = refDebounced(catchingUp, SLOW_MS)
</script>

<template>
  <div
    class="relative h-full min-h-0"
    :data-document-state="error ? 'error' : current ? 'ready' : 'loading'"
    :data-document-freshness="catchingUp ? 'stale' : 'current'"
  >
    <div v-if="error" class="space-y-4 p-8">
      <div class="flex justify-end"><slot name="actions" /></div>
      <AppFileError :error="error" />
    </div>
    <MarkdownReader v-else-if="current" :document="current" :page="artifact.id">
      <template #actions>
        <div class="ml-auto shrink-0"><slot name="actions" /></div>
      </template>
    </MarkdownReader>
    <p v-else role="status" class="p-8 text-sm text-muted">
      {{ t('document.loading') }}
    </p>
    <p
      v-if="current && catchingUp && slow"
      role="status"
      class="absolute inset-x-0 bottom-0 border-t border-default bg-default p-3 text-sm"
    >
      {{ t('document.outOfDate') }} {{ t('document.updating') }}
    </p>
  </div>
</template>
