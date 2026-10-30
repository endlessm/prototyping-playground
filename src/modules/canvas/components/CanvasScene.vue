<script setup lang="ts">
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import { useCanvasFile } from '../composables/useCanvasFile'
import { useCanvasOpening } from '../composables/useCanvasOpening'
import type { CanvasEditorProps, CanvasHandle } from '../island/mount'
import { parseCanvas, type ParsedCanvas } from '../types/canvas/format'
import { cameraKey } from '../utils/camera'
import { readCanvas, type CanvasText } from '../utils/readCanvas'
import CanvasError from './CanvasError.vue'
import CanvasOpening from './CanvasOpening.vue'
import CanvasSaveStatus from './CanvasSaveStatus.vue'

// One open canvas. The editor's code, the file's text and whether you may
// edit it are all ready before the editor mounts, so it never shows
// read-only first. A quiet surface covers the scene until it reveals. Your
// edits save by themselves, and changes made to the file elsewhere come in.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
}>()

const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL
const colorMode = useColorMode()

const container = useTemplateRef<HTMLElement>('container')
const mountPoint = useTemplateRef<HTMLElement>('mountPoint')
const failure = ref<string>()
const scene = shallowRef<ParsedCanvas>()
const editable = ref(false)
const handle = shallowRef<CanvasHandle>()
const empty = ref(false)
let loaded: CanvasText | undefined

const saving = useCanvasFile({
  base,
  prototype: () => props.prototype.id,
  artifact: () => props.artifact.id,
})

const { revealed, statusVisible } = useCanvasOpening(
  container,
  computed(() => Boolean(handle.value)),
  () => handle.value?.openingEmbeds() ?? [],
)

// The hint shows only once the canvas has stayed empty for a moment, so a
// scene that is still arriving never flashes it.
const hintReady = ref(false)
let hintTimer = 0
watch([empty, revealed], ([isEmpty, isRevealed]) => {
  window.clearTimeout(hintTimer)
  hintReady.value = false
  if (isEmpty && isRevealed)
    hintTimer = window.setTimeout(() => (hintReady.value = true), 500)
})

const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

let island: ReturnType<typeof import('../island/mount').mountCanvas> | undefined
const editorProps = (): CanvasEditorProps => ({
  elements: scene.value!.elements,
  background: scene.value!.background,
  gridSize: scene.value!.gridSize,
  // A file from a newer format is never saved over.
  editable: editable.value && !scene.value!.tooNew,
  dark: colorMode.value === 'dark',
  base,
  cameraKey: cameraKey(props.artifact.id),
  labels: {
    undo: t('canvas.menu.undo'),
    redo: t('canvas.menu.redo'),
    grid: t('canvas.menu.grid'),
    snap: t('canvas.menu.snap'),
    hideControls: t('canvas.menu.hideControls'),
    showControls: t('canvas.menu.showControls'),
  },
  onReady: (ready) => {
    handle.value = ready
    // A file from a newer format is never saved over.
    if (loaded && !scene.value!.tooNew) saving.start(ready, loaded)
  },
  onEmptyChange: (now) => (empty.value = now),
  onSceneChange: saving.changed,
})

onMounted(async () => {
  let module: typeof import('../island/mount')
  let file: Awaited<ReturnType<typeof readCanvas>>
  try {
    ;[module, file] = await Promise.all([
      import('../island/mount'),
      readCanvas(base, props.prototype.id, props.artifact.id),
    ])
    scene.value = parseCanvas(file.text)
  } catch (error) {
    failure.value = message(error)
    return
  }
  loaded = file
  editable.value = file.editable
  empty.value = !scene.value.elements.some((element) => !element.isDeleted)
  await nextTick()
  if (!mountPoint.value) return
  island = module.mountCanvas(mountPoint.value, editorProps())
})

// The editor follows the studio's colour mode, live.
watch(
  () => colorMode.value,
  () => island?.update(editorProps()),
)

onBeforeUnmount(() => {
  window.clearTimeout(hintTimer)
  island?.unmount()
})
</script>

<template>
  <!-- Excalidraw's colour pickers call themselves dialogs; they are part of
       the page, so the studio's shortcuts still work beside them. -->
  <CanvasError v-if="failure" :detail="failure" />
  <div
    v-else
    ref="container"
    class="canvas relative min-h-0 flex-1 overflow-hidden overscroll-none rounded-md border border-default bg-muted/30"
    data-inline-dialogs
    :data-canvas-opening="revealed ? 'ready' : 'loading'"
    :aria-busy="!revealed || undefined"
  >
    <CanvasOpening v-if="!revealed" :visible="statusVisible" />
    <!-- A stacking context of its own keeps Excalidraw's layers under the
         empty hint. -->
    <div
      class="canvas-scene absolute inset-0 isolate transition-opacity duration-160 ease-out motion-reduce:transition-none"
      :class="revealed ? 'opacity-100' : 'opacity-0'"
      :inert="!revealed || undefined"
      :aria-hidden="!revealed || undefined"
    >
      <div ref="mountPoint" class="absolute inset-0" />
    </div>
    <CanvasSaveStatus
      v-if="saving.active.value && revealed"
      :state="saving.state.value"
      @retry="saving.retry"
    />
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
    >
      <div
        v-if="empty && revealed && hintReady"
        class="pointer-events-none absolute inset-0 flex items-center justify-center p-8"
      >
        <div
          class="max-w-sm rounded-xl border border-dashed border-default bg-default/80 p-8 text-center"
        >
          <p class="text-sm font-medium text-highlighted">
            {{ t('canvas.empty.title') }}
          </p>
          <p class="mt-1.5 text-sm text-muted">
            {{
              editable && !scene?.tooNew
                ? t('canvas.empty.editable')
                : t('canvas.empty.readOnly')
            }}
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>
