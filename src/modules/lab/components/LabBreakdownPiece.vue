<script setup lang="ts">
import type {
  HostBody,
  NodeBoxes,
  PreviewMessage,
  PreviewState,
} from '../../../../tooling/preview/protocol'
import type { BreakdownNode } from '../../../../tooling/systems/breakdown'
import SystemPreviewFrame from '../../systems/components/SystemPreviewFrame.vue'
import { fitPiece, LIVE_ZOOM, pieceBox } from '../utils/pieces'

// A card's piece, live: a frame of the same Breakdown preview as the root,
// at the root's width, shown through a window cut to the box its own
// document reports for the piece (a theme slot's element for a slot), at
// its size or shrunk to fit, centred. It hears the same host messages as
// the root, so it follows the component, its highlights and its changes.
// The frame mounts only while the card is near the canvas's view and the
// canvas is zoomed in enough to read it, so a large tree boots a few
// documents rather than one per piece. A piece the content doesn't render
// says so.
const props = defineProps<{
  node: BreakdownNode
  /** The pieces a list draws once per item, which show their first. */
  perItem: ReadonlySet<string>
  systemId: string
  artifact: string
  /** The component's name, for the frame's title. */
  name: string
  messages: HostBody[]
  /** The width the root renders the component at, in CSS pixels. */
  frameWidth: number
  /** The canvas's view, to mount the frame only near it. */
  viewport: HTMLElement | null
  /** The canvas's zoom. */
  zoom: number
}>()
const { t } = useI18n()

const room = useTemplateRef('room')
const near = ref(false)
useIntersectionObserver(
  room,
  (entries) => {
    near.value = entries.some((entry) => entry.isIntersecting)
  },
  { root: () => props.viewport, rootMargin: '160px' },
)
const { width, height } = useElementSize(room)
const live = computed(() => near.value && props.zoom >= LIVE_ZOOM)

const state = ref<PreviewState>('loading')
const nodes = shallowRef<Record<string, NodeBoxes> | null>(null)
watch(live, (mounted) => {
  if (mounted) return
  state.value = 'loading'
  nodes.value = null
})
function heard(message: PreviewMessage) {
  if (message.kind === 'nodes') nodes.value = message.nodes
}

const box = computed(() =>
  nodes.value && state.value === 'ready'
    ? pieceBox(nodes.value, props.node, props.perItem)
    : null,
)
const fit = computed(() =>
  box.value && width.value && height.value
    ? fitPiece(box.value, { width: width.value, height: height.value })
    : null,
)
const notShown = computed(
  () => state.value === 'ready' && nodes.value !== null && !box.value,
)
</script>

<template>
  <div ref="room" class="relative size-full self-stretch">
    <div
      v-if="live"
      :data-breakdown-clip="fit ? '' : undefined"
      class="absolute overflow-hidden"
      :style="
        fit
          ? {
              left: `${fit.left}px`,
              top: `${fit.top}px`,
              width: `${fit.width}px`,
              height: `${fit.height}px`,
            }
          : { left: 0, top: 0, width: 0, height: 0 }
      "
      inert
      aria-hidden="true"
    >
      <div
        class="origin-top-left"
        :style="{
          width: `${frameWidth}px`,
          transform: box
            ? `scale(${fit?.scale ?? 1}) translate(${-box.x}px, ${-box.y}px)`
            : undefined,
        }"
      >
        <Suspense>
          <SystemPreviewFrame
            class="rounded-none border-0"
            :system-id="systemId"
            :artifact="artifact"
            :title="t('lab.pieces.frame', { piece: node.name, name })"
            :messages="messages"
            :min-height="40"
            :error-height="40"
            :loading-text="t('lab.stage.loading')"
            :error-text="t('lab.stage.error')"
            @state="state = $event"
            @message="heard"
          />
        </Suspense>
      </div>
    </div>
    <p
      v-if="notShown || state === 'error'"
      class="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-muted"
    >
      {{ notShown ? t('lab.pieces.notShown') : t('lab.pieces.error') }}
    </p>
  </div>
</template>
