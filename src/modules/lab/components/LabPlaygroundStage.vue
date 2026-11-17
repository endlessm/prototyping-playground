<script setup lang="ts">
import type {
  PreviewMessage,
  PreviewProps,
} from '../../../../tooling/preview/protocol'
import { usePreviewFrame } from '../../prototypes/composables/usePreviewFrame'

// A component's playground: its component file, rendered alone in the
// system's preview document with the given props. New props reach the
// mounted component by message, so it updates in place and the frame never
// reloads. Props that make it throw show the error in its place until the
// next props. The frame grows with the component up to a cap (smaller on
// narrow screens, where it sits above the controls), then scrolls inside,
// so pop-ups stay in it. When nothing in it takes any room, a note under it
// says why it may be blank.
// A prop the component changes itself (a modal closing) comes out as
// `update`. Escape in the stage hands the keyboard back to the studio
// (`escape`), once the component has closed what it had open, so an overlay
// that holds the focus never traps it.
const props = defineProps<{
  systemId: string
  /** The playground's preview ID: the catalog component's `playground`. */
  artifact: string
  title: string
  /** Plain JSON values; a key left out or undefined takes its default. */
  props: PreviewProps
}>()
const emit = defineEmits<{
  update: [prop: string, value: unknown]
  escape: []
}>()

const MIN_HEIGHT = 160
// Room for an error and the start of its detail.
const ERROR_HEIGHT = 200
const { t } = useI18n()
const { previewDocument } = await useSystems()
const frame = useTemplateRef('frame')
const boundary = useTemplateRef('boundary')
const { src, state, detail, shown } = usePreviewFrame({
  frame,
  boundary,
  document: previewDocument(props.systemId),
  artifact: () => props.artifact,
  props: () => props.props,
  onMessage: (message: PreviewMessage) => {
    if (message.kind === 'update') emit('update', message.prop, message.value)
  },
})

// The document is on the studio's origin, so its content can be measured.
const height = ref(MIN_HEIGHT)
const blank = ref(false)
let observer: ResizeObserver | undefined
let watcher: MutationObserver | undefined
function measure() {
  observer?.disconnect()
  watcher?.disconnect()
  const view = frame.value?.contentWindow as (Window & typeof globalThis) | null
  const app = view?.document.getElementById('app')
  if (!view || !app) return
  const fit = () => {
    const bottom = app.getBoundingClientRect().bottom + view.scrollY
    height.value = Math.max(MIN_HEIGHT, Math.ceil(bottom))
    blank.value = !showsSomething(view)
  }
  observer = new view.ResizeObserver(fit)
  observer.observe(app)
  // What the component moves to the page's body, such as an open overlay,
  // changes what shows without changing the stage's size.
  let pending = false
  watcher = new view.MutationObserver(() => {
    if (pending) return
    pending = true
    setTimeout(() => {
      pending = false
      fit()
    })
  })
  watcher.observe(view.document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  })
  fit()
  // Capturing, as an overlay may stop Escape from bubbling past it.
  view.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') void settled(view).then(() => emit('escape'))
    },
    true,
  )
}
onBeforeUnmount(() => {
  observer?.disconnect()
  watcher?.disconnect()
})

const SKIPPED = new Set(['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE'])
// Whether anything the component renders takes room: its own elements, or
// what it moved to the page's body. The stage's own box doesn't count.
function showsSomething(view: Window & typeof globalThis) {
  const stage = view.document.querySelector('[data-playground]')
  if (!stage) return true
  for (const element of view.document.body.querySelectorAll('*')) {
    if (element.contains(stage) || SKIPPED.has(element.tagName)) continue
    const { width, height } = element.getBoundingClientRect()
    if (
      width > 0 &&
      height > 0 &&
      view.getComputedStyle(element).visibility !== 'hidden'
    )
      return true
  }
  return false
}

// How long Escape waits for an overlay to close and its focus to return.
const SETTLE_MS = 1000
const POLL_MS = 50
const OVERLAY = '[role="dialog"],[role="alertdialog"]'
// Moving the focus out while an overlay still closes would have it pull the
// focus back into the stage when it returns focus to its trigger.
function settled(view: Window) {
  const until = performance.now() + SETTLE_MS
  return new Promise<void>((resolve) => {
    const check = () => {
      if (!view.document.querySelector(OVERLAY) || performance.now() > until)
        setTimeout(resolve, POLL_MS)
      else setTimeout(check, POLL_MS)
    }
    check()
  })
}

const wanted = computed(() =>
  state.value === 'error' ? Math.max(height.value, ERROR_HEIGHT) : height.value,
)
</script>

<template>
  <div>
    <div
      ref="boundary"
      class="relative overflow-hidden rounded-lg border border-default bg-white"
      :data-preview-artifact="artifact"
      :data-preview-state="state"
    >
      <iframe
        ref="frame"
        data-preview-frame
        :src="src"
        :title="title"
        class="block h-[min(var(--stage-height),40vh)] w-full border-0 lg:h-[min(var(--stage-height),70vh)]"
        :class="{ invisible: state === 'error' }"
        :style="{ '--stage-height': `${wanted}px` }"
        @load="measure"
      />
      <p
        v-if="state === 'loading' && !shown"
        role="status"
        class="absolute inset-0 bg-default p-4 text-sm text-muted"
      >
        {{ t('lab.stage.loading') }}
      </p>
      <div
        v-else-if="state === 'error'"
        role="alert"
        class="absolute inset-0 overflow-auto bg-default p-4 text-sm"
      >
        <p class="text-default">{{ t('lab.stage.error') }}</p>
        <pre
          v-if="detail"
          class="mt-2 font-mono text-xs whitespace-pre-wrap text-muted"
          >{{ detail }}</pre>
      </div>
    </div>
    <p role="status" class="mt-2 text-sm text-muted empty:hidden">
      <template v-if="state === 'ready' && blank">{{
        t('lab.stage.blank')
      }}</template>
    </p>
  </div>
</template>
