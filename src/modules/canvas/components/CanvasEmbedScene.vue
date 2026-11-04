<script setup lang="ts">
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import { useCanvasItems } from '../composables/useCanvasItems'
import { useCanvasOpening } from '../composables/useCanvasOpening'
import type { CanvasPreviewHandle, CanvasPreviewProps } from '../island/mount'
import { parseCanvas, type ParsedCanvas } from '../types/canvas/format'
import { loadImages } from '../utils/canvasImages'
import { readCanvas } from '../utils/readCanvas'
import CanvasItem from './CanvasItem.vue'
import CanvasOpening from './CanvasOpening.vue'

// A canvas in a document: a fitted, read-only picture of the whole scene,
// through the same island as the canvas page, with its items live. It opens
// like the page (a quiet surface, the status after 200 ms, one reveal, at
// most 2 s waiting for previews) and keeps its frame's size throughout. In
// development it follows its file without opening again.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
  width: number
  height: number
  startedAt?: number
}>()

const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL
const colorMode = useColorMode()
const artifacts = await usePrototypeArtifacts(() => props.prototype.id)
const { items, host, resolve } = useCanvasItems({
  prototype: () => props.prototype,
  artifact: () => props.artifact,
  artifacts,
  base,
})

const container = useTemplateRef<HTMLElement>('container')
const mountPoint = useTemplateRef<HTMLElement>('mountPoint')
const failed = ref(false)
const file = shallowRef<ParsedCanvas>()
const handle = shallowRef<CanvasPreviewHandle>()
const { revealed, statusVisible } = useCanvasOpening(
  container,
  computed(() => Boolean(handle.value)),
  () => handle.value?.openingEmbeds() ?? [],
  props.startedAt,
)

const pictures: CanvasPreviewProps['loadImages'] = (wanted) =>
  loadImages(base, props.prototype.id, wanted)

let island:
  ReturnType<typeof import('../island/mount').mountPreview> | undefined
const previewProps = (): CanvasPreviewProps => ({
  file: file.value!,
  loadImages: pictures,
  dark: colorMode.value === 'dark',
  base,
  width: props.width,
  height: props.height,
  items: host,
  onReady: (ready) => (handle.value = ready),
})

async function read() {
  return parseCanvas(
    (await readCanvas(base, props.prototype.id, props.artifact.id)).text,
  )
}

let closed = false
onMounted(async () => {
  let module: typeof import('../island/mount')
  try {
    ;[module, file.value] = await Promise.all([
      import('../island/mount'),
      read(),
    ])
  } catch {
    failed.value = true
    return
  }
  await nextTick()
  if (closed || !mountPoint.value) return
  island = module.mountPreview(mountPoint.value, previewProps())
})

// It follows the colour mode, its size and its file, live.
watch(
  () => [colorMode.value, props.width, props.height],
  () => island?.update(previewProps()),
)
if (import.meta.hot) {
  const hot = import.meta.hot
  const changed = async ({ files }: { files: string[] }) => {
    if (!island || !files.includes(props.artifact.file)) return
    try {
      file.value = await read()
    } catch {
      // A half-written file: the next change brings the rest.
      return
    }
    island?.update(previewProps())
  }
  hot.on('studio:source', changed)
  onScopeDispose(() => hot.off('studio:source', changed))
}

onBeforeUnmount(() => {
  closed = true
  island?.unmount()
})
</script>

<template>
  <p
    v-if="failed"
    role="alert"
    class="p-4 text-sm"
    :style="{ width: `${width}px`, height: `${height}px` }"
  >
    {{ t('canvas.embedFailed') }}
  </p>
  <div
    v-else
    ref="container"
    class="canvas canvas-preview relative overflow-hidden bg-muted/30"
    :style="{ width: `${width}px`, height: `${height}px` }"
    :data-canvas-opening="revealed ? 'ready' : 'loading'"
    :data-preview-artifact="artifact.id"
  >
    <CanvasOpening v-if="!revealed" :visible="statusVisible" />
    <!-- A picture: no pointer, focus or keys reach the scene. -->
    <div
      class="canvas-scene pointer-events-none absolute inset-0 isolate transition-opacity duration-160 ease-out motion-reduce:transition-none"
      :class="revealed ? 'opacity-100' : 'opacity-0'"
      inert
      aria-hidden="true"
    >
      <div ref="mountPoint" class="absolute inset-0" />
    </div>
    <Teleport v-for="[id, item] of items" :key="id" :to="item.box">
      <CanvasItem
        :prototype="prototype"
        :resolution="resolve(item.link)"
        :width="item.width"
        :height="item.height"
        :mounted="item.mounted"
        :offscreen="item.offscreen"
        :overview="item.overview"
      />
    </Teleport>
  </div>
</template>
