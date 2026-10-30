<script setup lang="ts">
import type { PreviewShortcut } from '../../../../../tooling/preview/protocol'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../../app/composables/useManifest'
import { usePreviewFrame } from '../../composables/usePreviewFrame'
import ViewEmpty from './ViewEmpty.vue'
import ViewError from './ViewError.vue'

// A view renders in its system's preview document, a same-origin iframe
// that holds only the system's app. The frame stays while the person moves
// between views of the prototype: the studio tells the document which view
// to show, and the document keeps the outgoing one until the next is ready.
// The document reports how rendering went and whether it shows the latest
// saved source; this page says so in the studio's own words. Links in the
// view open through the studio, and the studio's shortcuts pressed in the
// view reach it.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
  /** The preview document's address, without its query. */
  document: string
}>()

const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL

const SHORTCUT_KEYS = {
  palette: { key: 'k', code: 'KeyK' },
  navigation: { key: ';', code: 'Semicolon' },
  source: { key: "'", code: 'Quote' },
  grid: { key: '"', code: 'Quote', shiftKey: true },
} satisfies Record<PreviewShortcut, KeyboardEventInit>

const frame = useTemplateRef('frame')
const boundary = useTemplateRef('boundary')
const {
  session,
  src,
  state,
  detail,
  phase,
  phaseDetail,
  shown,
  slow,
  silent,
  freshness,
} = usePreviewFrame({
  frame,
  boundary,
  document: props.document,
  artifact: () => props.artifact.id,
  onMessage(message) {
    if (message.kind === 'navigate') {
      if (message.href.startsWith(base))
        void navigateTo(`/${message.href.slice(base.length)}`, {
          replace: message.replace,
        })
      return
    }
    if (message.kind === 'shortcut') {
      // The studio's own handlers decide, as if pressed here.
      const key = SHORTCUT_KEYS[message.action as PreviewShortcut]
      window.dispatchEvent(
        new KeyboardEvent('keydown', { ...key, ctrlKey: true, bubbles: true }),
      )
    }
  },
})

const shortFile = computed(() => {
  const folder = props.prototype.folder
  return props.artifact.file.slice(folder.lastIndexOf('/') + 1)
})
const { copy, copied } = useClipboard({ copiedDuring: 1500, legacy: true })
</script>

<template>
  <div
    ref="boundary"
    class="relative flex min-h-0 flex-1 flex-col"
    :data-preview-session="session"
    :data-preview-artifact="artifact.id"
    :data-preview-state="state"
    :data-preview-phase="phase"
    :data-preview-freshness="freshness"
  >
    <iframe
      ref="frame"
      data-preview-frame
      :src="src"
      :title="artifact.title"
      :data-preview-state="state"
      class="min-h-0 w-full flex-1 bg-white"
      :class="{ hidden: state === 'error' || state === 'empty' }"
    />
    <ViewError v-if="state === 'error'" :detail="detail" />
    <ViewEmpty
      v-else-if="state === 'empty'"
      :file="artifact.file"
      :short-file="shortFile"
    />
    <div
      v-if="silent"
      role="status"
      class="absolute inset-x-0 bottom-0 border-t border-default bg-default p-3 text-sm"
    >
      {{ t('view.silent') }}
    </div>
    <div
      v-else-if="state === 'loading' && slow"
      role="status"
      class="pointer-events-none absolute inset-x-0 bottom-0 border-t border-default bg-default p-3 text-sm"
    >
      {{ shown ? t('view.opening') : t('view.loading') }}
    </div>
    <div
      v-else-if="state === 'ready' && freshness === 'stale'"
      role="status"
      class="absolute inset-x-0 bottom-0 max-h-1/2 space-y-2 overflow-auto border-t border-default bg-default p-3 text-sm"
    >
      <p>
        {{ t('view.outOfDate') }}
        <template v-if="phase === 'error'">{{
          t('view.couldNotRender')
        }}</template>
        <template v-else-if="phase === 'updating'">{{
          t('view.updating')
        }}</template>
      </p>
      <template v-if="phase === 'error' && phaseDetail">
        <pre
          class="overflow-auto rounded-md bg-muted p-2 text-xs whitespace-pre-wrap text-muted"
          >{{ phaseDetail }}</pre>
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          :label="copied ? t('view.copied') : t('view.copyError')"
          @click="copy(phaseDetail)"
        />
      </template>
    </div>
  </div>
</template>
