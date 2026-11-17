<script setup lang="ts">
import type {
  KnobHighlight,
  NodeBoxes,
  PreviewMessage,
  PreviewProps,
} from '../../../../tooling/preview/protocol'
import type { BreakdownNode } from '../../../../tooling/systems/breakdown'
import type { KnobTheme } from '../../../../tooling/preview/knobs'
import type { BreakdownChanges } from '../composables/useBreakdownChanges'
import LabBreakdownInspector from './LabBreakdownInspector.vue'
import LabBreakdownSave from './LabBreakdownSave.vue'
import SystemPreviewFrame from '../../systems/components/SystemPreviewFrame.vue'
import LabBreakdownCard from './LabBreakdownCard.vue'
import LabBreakdownPiece from './LabBreakdownPiece.vue'
import LabBreakdownToolbar from './LabBreakdownToolbar.vue'
import {
  CANVAS_PADDING,
  cardFile,
  clampZoom,
  layoutTree,
  SOURCE_CHIPS,
  treeNodes,
  zoomStep,
} from '../utils/breakdown'
import { onePerItem } from '../utils/pieces'
import { useBreakdownMessages } from '../composables/useBreakdownMessages'

// A Breakdown: a tree of pieces drawn top-down on a dotted canvas that pans
// (drag the empty canvas, or scroll) and zooms (the toolbar, or ⌘/Ctrl and
// scroll), with elbow connectors and a source chip on each. The root card
// shows the component live, in its system's preview document under the
// Breakdown's preview ID; the document reports where every piece is
// (`nodes`) and outlines the hovered and selected one. The toolbar's last
// button cross-fades to the component alone. Fed by a tree and a preview,
// so a system component and an experiment view mount the same stage.
const props = defineProps<{
  tree: BreakdownNode
  systemId: string
  /** The system's folder, which cards leave out of their files. */
  systemFolder: string
  /** The system's name, for the chip of its copied app's pieces. */
  systemLabel: string
  /** The preview document's ID of the instrumented file. */
  artifact: string
  /** The component's name, for the frames' and canvas's labels. */
  name: string
  /** What the preview mounts the file with, as plain JSON. */
  props?: PreviewProps
  /** The knobs' unsaved changes, kept by the page. */
  changes: BreakdownChanges
  /** The system's colours and text sizes the knobs offer. */
  theme: KnobTheme
  /** Where Save puts the changes; until `canSave`, it stays disabled. */
  saveAs?: 'experiment' | 'mine' | 'file'
  canSave?: boolean
}>()
/** The selected piece's node ID. */
const selected = defineModel<string | null>('selected', { default: null })
const mode = defineModel<'breakdown' | 'component'>('mode', {
  default: 'breakdown',
})
const emit = defineEmits<{
  nodes: [nodes: Record<string, NodeBoxes>]
  save: []
}>()
const { t } = useI18n()

const hovered = ref<string | null>(null)
/** Where each rendered piece is in the preview, as the document reports. */
const boxes = shallowRef<Record<string, NodeBoxes>>({})
function heard(message: PreviewMessage) {
  if (message.kind !== 'nodes') return
  boxes.value = message.nodes
  emit('nodes', message.nodes)
}
/** The area of the hovered knob, drawn in the pieces. */
const knobLit = ref<KnobHighlight | null>(null)
// Every frame hears the knobs' unsaved changes; the pieces also hear the
// hovered knob, whose own highlight replaces the selection's outline.
const { pieces: messages, shared } = useBreakdownMessages(
  () => ({
    hover: hovered.value,
    selected: knobLit.value ? null : selected.value,
  }),
  () => props.changes.overrides.value,
  () => knobLit.value,
)

const slotClasses = computed(() =>
  Object.fromEntries(
    Object.entries(boxes.value).map(([id, found]) => [id, found.classes]),
  ),
)

const nodes = computed(() => treeNodes(props.tree))
const perItem = computed(() => onePerItem(props.tree))
const selectedNode = computed(
  () => nodes.value.find(({ id }) => id === selected.value) ?? null,
)
// A selection the tree no longer has (the file changed) is let go.
watch(nodes, (next) => {
  if (selected.value && !next.some(({ id }) => id === selected.value))
    selected.value = null
})

const WIDTH = { root: 340, component: 232, leaf: 184 }
const INSET = { component: 96, leaf: 56 }
// The root's preview width: its card less the card's and inset's edges.
const FRAME_WIDTH = WIDTH.root - 16
const widthOf = (node: BreakdownNode) =>
  node.id === props.tree.id
    ? WIDTH.root
    : node.kind === 'component'
      ? WIDTH.component
      : WIDTH.leaf
const insetOf = (node: BreakdownNode) =>
  node.kind === 'component' ? INSET.component : INSET.leaf
// Cards are as tall as their content, measured once drawn.
const heights = ref<Record<string, number>>({})
const cardElements = useTemplateRef<HTMLElement[]>('cards')
const sizes = useResizeObserver(
  () => cardElements.value ?? [],
  (entries) => {
    const next = { ...heights.value }
    for (const entry of entries) {
      const id = (entry.target as HTMLElement).dataset.breakdownPlace!
      next[id] = Math.ceil(entry.borderBoxSize[0]?.blockSize ?? 0)
    }
    heights.value = next
  },
)
onBeforeUnmount(() => sizes.stop())

const layout = computed(() =>
  layoutTree(props.tree, (node) => ({
    width: widthOf(node),
    height: heights.value[node.id] ?? (node.kind === 'component' ? 180 : 120),
  })),
)

const CHIP = 14
const ARROW = 30
function edgePath(
  from: { x: number; y: number; width: number; height: number },
  to: { x: number; y: number; width: number },
) {
  const px = from.x + from.width / 2
  const py = from.y + from.height
  const cx = to.x + to.width / 2
  const cy = to.y - ARROW
  const middle = py + (cy - py) / 2
  if (Math.abs(cx - px) < 1) return `M ${px} ${py} V ${cy}`
  const turn = cx > px ? 1 : -1
  const r = Math.min(10, Math.abs(cx - px) / 2, (cy - py) / 2)
  return [
    `M ${px} ${py}`,
    `V ${middle - r}`,
    `Q ${px} ${middle} ${px + turn * r} ${middle}`,
    `H ${cx - turn * r}`,
    `Q ${cx} ${middle} ${cx} ${middle + r}`,
    `V ${cy}`,
  ].join(' ')
}
const chipLabel = (node: BreakdownNode) =>
  node.source === 'icons' && node.library
    ? node.library
    : t(`lab.breakdown.sources.${node.source}`, { system: props.systemLabel })

// Each view keeps its own place and zoom.
const viewport = useTemplateRef('viewport')
const views = reactive({
  breakdown: { x: 0, y: 0, zoom: 1, placed: false },
  component: { x: 0, y: 0, zoom: 1, placed: false },
})
const view = computed(() => views[mode.value])
const { width: viewportWidth, height: viewportHeight } =
  useElementSize(viewport)

const COMPONENT_WIDTH = 560
// The toolbar's height and its room from the canvas's bottom edge.
const TOOLBAR = 72

// The breakdown opens fitted to the canvas, above the toolbar (never below
// half size, so the cards stay readable), with the root at the top.
watchEffect(() => {
  const { width, height } = {
    width: viewportWidth.value,
    height: viewportHeight.value,
  }
  if (!width || !height) return
  if (!views.breakdown.placed && Object.keys(heights.value).length) {
    const zoom = clampZoom(
      Math.max(
        0.5,
        Math.min(
          1,
          (width - 2 * CANVAS_PADDING) / layout.value.width,
          (height - 2 * CANVAS_PADDING - TOOLBAR) / layout.value.height,
        ),
      ),
    )
    const root = layout.value.cards[0]!
    Object.assign(views.breakdown, {
      zoom,
      x: width / 2 - (root.x + root.width / 2) * zoom,
      y: CANVAS_PADDING,
      placed: true,
    })
  }
  if (!views.component.placed) {
    Object.assign(views.component, {
      x: width / 2 - COMPONENT_WIDTH / 2,
      y: CANVAS_PADDING,
      placed: true,
    })
  }
})

function zoomTo(
  next: number,
  at = { x: viewportWidth.value / 2, y: viewportHeight.value / 2 },
) {
  const current = view.value
  const zoom = clampZoom(next)
  // The point under `at` stays where it is.
  current.x = at.x - ((at.x - current.x) * zoom) / current.zoom
  current.y = at.y - ((at.y - current.y) * zoom) / current.zoom
  current.zoom = zoom
}

let drag: { id: number; x: number; y: number; moved: boolean } | null = null
function pressed(event: PointerEvent) {
  if (event.button !== 0) return
  drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    moved: false,
  }
}
function moved(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId) return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  if (!drag.moved && Math.hypot(dx, dy) < 4) return
  if (!drag.moved) viewport.value?.setPointerCapture(event.pointerId)
  drag.moved = true
  drag.x = event.clientX
  drag.y = event.clientY
  view.value.x += dx
  view.value.y += dy
}
function released(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId) return
  const wasDrag = drag.moved
  drag = null
  // A click on the empty canvas lets the selection go.
  if (!wasDrag && mode.value === 'breakdown') selected.value = null
}
function wheel(event: WheelEvent) {
  if (event.ctrlKey || event.metaKey) {
    const bounds = viewport.value!.getBoundingClientRect()
    zoomTo(view.value.zoom * Math.exp(-event.deltaY * 0.01), {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    })
    return
  }
  view.value.x -= event.deltaX
  view.value.y -= event.deltaY
}
useEventListener(
  viewport,
  'wheel',
  (event: WheelEvent) => {
    event.preventDefault()
    wheel(event)
  },
  { passive: false },
)

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape' && selected.value && !event.defaultPrevented)
    selected.value = null
})

function toggle() {
  mode.value = mode.value === 'breakdown' ? 'component' : 'breakdown'
}
const transform = (current: { x: number; y: number; zoom: number }) =>
  `translate(${current.x}px, ${current.y}px) scale(${current.zoom})`
const dots = computed(() => {
  const size = 16 * view.value.zoom
  return {
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: `${view.value.x}px ${view.value.y}px`,
  }
})

defineExpose({ boxes })
</script>

<template>
  <section
    :aria-label="t('lab.breakdown.canvas', { name })"
    :data-breakdown-mode="mode"
    class="relative h-[min(75vh,52rem)] min-h-96 overflow-hidden rounded-lg border border-default bg-elevated/40"
  >
    <div
      ref="viewport"
      data-breakdown-canvas
      class="absolute inset-0 cursor-grab touch-none bg-[radial-gradient(var(--ui-border-accented)_1px,transparent_1px)] select-none active:cursor-grabbing"
      :style="dots"
      @pointerdown="pressed"
      @pointermove="moved"
      @pointerup="released"
      @pointercancel="drag = null"
    >
      <div
        class="absolute inset-0 transition-opacity duration-150"
        :class="
          mode === 'breakdown' ? 'opacity-100' : 'pointer-events-none opacity-0'
        "
        :inert="mode !== 'breakdown'"
        :aria-hidden="mode !== 'breakdown'"
      >
        <div
          role="group"
          :aria-label="t('lab.breakdown.pieces', { name })"
          class="absolute top-0 left-0 origin-top-left"
          :style="{
            transform: transform(views.breakdown),
            width: `${layout.width}px`,
            height: `${layout.height}px`,
          }"
        >
          <svg
            class="pointer-events-none absolute inset-0 overflow-visible text-(--ui-border-accented)"
            :width="layout.width"
            :height="layout.height"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="lab-breakdown-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            <g v-for="edge in layout.edges" :key="edge.id">
              <circle
                :cx="edge.from.x + edge.from.width / 2"
                :cy="edge.from.y + edge.from.height + 4"
                r="3"
                fill="currentColor"
              />
              <path
                :d="edgePath(edge.from, edge.to)"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                marker-end="url(#lab-breakdown-arrow)"
              />
            </g>
          </svg>
          <div
            v-for="group in layout.groups"
            :key="group.id"
            class="absolute rounded-2xl border border-dashed border-accented bg-default/50"
            :style="{
              left: `${group.x}px`,
              top: `${group.y}px`,
              width: `${group.width}px`,
              height: `${group.height}px`,
            }"
          />
          <span
            v-for="edge in layout.edges"
            :key="`chip:${edge.id}`"
            data-breakdown-chip
            class="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1"
            :class="SOURCE_CHIPS[edge.child.source].class"
            :style="{
              left: `${edge.to.x + edge.to.width / 2}px`,
              top: `${edge.to.y - CHIP}px`,
            }"
          >
            <UIcon
              :name="SOURCE_CHIPS[edge.child.source].icon"
              class="size-3"
            />
            {{ chipLabel(edge.child) }}
          </span>
          <div
            v-for="placed in layout.cards"
            :key="placed.node.id"
            ref="cards"
            :data-breakdown-place="placed.node.id"
            class="absolute"
            :style="{
              left: `${placed.x}px`,
              top: `${placed.y}px`,
              width: `${placed.width}px`,
            }"
            @pointerdown.stop
          >
            <LabBreakdownCard
              :node="placed.node"
              :file="cardFile(placed.node.file, systemFolder)"
              :selected="selected === placed.node.id"
              :inset="placed.depth === 0 ? undefined : insetOf(placed.node)"
              @select="selected = placed.node.id"
              @hover="hovered = $event ? placed.node.id : null"
            >
              <template v-if="placed.depth === 0" #preview>
                <Suspense>
                  <SystemPreviewFrame
                    class="w-full rounded-none border-0"
                    :system-id="systemId"
                    :artifact="artifact"
                    :title="t('lab.breakdown.stage', { name })"
                    :props="props.props"
                    :messages="messages"
                    :min-height="120"
                    :error-height="160"
                    :loading-text="t('lab.stage.loading')"
                    :error-text="t('lab.stage.error')"
                    @message="heard"
                  />
                </Suspense>
              </template>
              <template v-else #preview>
                <LabBreakdownPiece
                  :node="placed.node"
                  :per-item="perItem"
                  :system-id="systemId"
                  :artifact="artifact"
                  :name="name"
                  :props="props.props"
                  :messages="messages"
                  :frame-width="FRAME_WIDTH"
                  :viewport="viewport"
                  :zoom="views.breakdown.zoom"
                />
              </template>
            </LabBreakdownCard>
          </div>
        </div>
      </div>
      <div
        class="absolute inset-0 transition-opacity duration-150"
        :class="
          mode === 'component' ? 'opacity-100' : 'pointer-events-none opacity-0'
        "
        :inert="mode !== 'component'"
        :aria-hidden="mode !== 'component'"
      >
        <div
          class="absolute top-0 left-0 origin-top-left"
          :style="{
            transform: transform(views.component),
            width: `${COMPONENT_WIDTH}px`,
          }"
          @pointerdown.stop
        >
          <Suspense>
            <SystemPreviewFrame
              :system-id="systemId"
              :artifact="artifact"
              :title="t('lab.breakdown.component', { name })"
              :props="props.props"
              :messages="shared"
              :min-height="160"
              :error-height="200"
              :loading-text="t('lab.stage.loading')"
              :error-text="t('lab.stage.error')"
            />
          </Suspense>
        </div>
      </div>
    </div>
    <div
      class="absolute bottom-4 left-1/2 flex w-full -translate-x-1/2 justify-center"
    >
      <LabBreakdownToolbar
        :zoom="view.zoom"
        :mode="mode"
        :selected="selectedNode?.name ?? null"
        @zoom-in="zoomTo(zoomStep(view.zoom, 1))"
        @zoom-out="zoomTo(zoomStep(view.zoom, -1))"
        @toggle="toggle"
      >
        <template #inspector>
          <LabBreakdownInspector
            v-if="selectedNode"
            :key="selectedNode.id"
            :node="selectedNode"
            :classes="slotClasses"
            :measured="Object.keys(boxes).length > 0"
            :theme="theme"
            :changes="changes"
            @highlight="knobLit = $event"
          />
        </template>
        <template v-if="selectedNode || changes.pending.value" #actions>
          <LabBreakdownSave
            :pending="changes.pending.value"
            :save-as="saveAs ?? 'experiment'"
            :can-save="canSave ?? false"
            @reset="changes.reset()"
            @save="emit('save')"
          />
        </template>
      </LabBreakdownToolbar>
    </div>
  </section>
</template>
