<script setup lang="ts">
import types from '#studio/file-types'
import {
  embedPresentation,
  resolveReference,
  type ReferenceResolution,
} from '../../../../app/utils/artifactReference'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import { useCanvasFile } from '../composables/useCanvasFile'
import { useCanvasOpening } from '../composables/useCanvasOpening'
import type {
  CanvasEditorProps,
  CanvasHandle,
  CanvasItemHost,
  CanvasItemState,
} from '../island/mount'
import {
  itemAddress,
  parseCanvas,
  type ParsedCanvas,
} from '../types/canvas/format'
import { cameraKey } from '../utils/camera'
import { readCanvas, type CanvasText } from '../utils/readCanvas'
import CanvasError from './CanvasError.vue'
import CanvasItem from './CanvasItem.vue'
import CanvasOpening from './CanvasOpening.vue'
import CanvasSaveStatus from './CanvasSaveStatus.vue'

// One open canvas. The editor's code, the file's text and whether you may
// edit it are all ready before the editor mounts, so it never shows
// read-only first. A quiet surface covers the scene until it reveals. Your
// edits save by themselves, and changes made to the file elsewhere come in.
// Items (views, states, diagrams, cards) are drawn here, in the studio's own
// context, into the boxes Excalidraw gives them.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
}>()

const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL
const colorMode = useColorMode()
const artifacts = await usePrototypeArtifacts(() => props.prototype.id)

// What each link shows, kept while the prototype's artifacts stay the same,
// so an item re-renders only when its own artifact changes.
const extensions = Object.values(types).flatMap((type) => type.extensions)
const resolutions = computed(() => {
  void artifacts.value
  void props.prototype
  return new Map<string, ReferenceResolution>()
})
function resolve(link: string): ReferenceResolution {
  const cache = resolutions.value
  let found = cache.get(link)
  if (!found) {
    found = resolveReference(
      itemAddress(link, location.origin, base) ?? link,
      { prototype: props.prototype, artifact: props.artifact },
      artifacts.value,
      {
        extension: 'required',
        extensions,
        presentation: (type) => embedPresentation(types[type], 'canvas'),
      },
    )
    cache.set(link, found)
  }
  return found
}

// The items Excalidraw has boxes for, by element ID.
const items = shallowReactive(
  new Map<string, CanvasItemState & { box: HTMLElement }>(),
)
const same = (a: CanvasItemState, b: CanvasItemState) =>
  (Object.keys(b) as (keyof CanvasItemState)[]).every(
    (key) => a[key] === b[key],
  )
const itemHost: CanvasItemHost = {
  show(id, box, state) {
    const current = items.get(id)
    if (current?.box === box && same(current, state)) return
    items.set(id, { ...state, box })
  },
  hide(id, box) {
    if (items.get(id)?.box === box) items.delete(id)
  },
  preview(link) {
    const found = resolve(link)
    return found.state === 'resolved' && found.presentation === 'preview'
  },
}

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
  items: itemHost,
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
    class="canvas relative min-h-0 flex-1 overflow-hidden overscroll-none bg-muted/30"
    data-inline-dialogs
    :data-canvas-opening="revealed ? 'ready' : 'loading'"
    :data-canvas-empty="empty || undefined"
    :aria-busy="!revealed || undefined"
  >
    <CanvasOpening v-if="!revealed" :visible="statusVisible" />
    <!-- A stacking context of its own keeps Excalidraw's layers under the
         save status. -->
    <div
      class="canvas-scene absolute inset-0 isolate transition-opacity duration-160 ease-out motion-reduce:transition-none"
      :class="revealed ? 'opacity-100' : 'opacity-0'"
      :inert="!revealed || undefined"
      :aria-hidden="!revealed || undefined"
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
    <CanvasSaveStatus
      v-if="saving.active.value && revealed"
      :state="saving.state.value"
      @retry="saving.retry"
    />
  </div>
</template>
