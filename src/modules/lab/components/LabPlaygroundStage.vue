<script setup lang="ts">
import type {
  PreviewMessage,
  PreviewProps,
  PreviewState,
} from '../../../../tooling/preview/protocol'
import SystemPreviewFrame from '../../systems/components/SystemPreviewFrame.vue'

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

const { t } = useI18n()
const state = ref<PreviewState>('loading')
function heard(message: PreviewMessage) {
  if (message.kind === 'update') emit('update', message.prop, message.value)
}

const blank = ref(false)
let watcher: MutationObserver | undefined
function fit(view: Window & typeof globalThis) {
  blank.value = !showsSomething(view)
}
function loaded(view: Window & typeof globalThis) {
  // What the component moves to the page's body, such as an open overlay,
  // changes what shows without changing the stage's size.
  watcher?.disconnect()
  let pending = false
  watcher = new view.MutationObserver(() => {
    if (pending) return
    pending = true
    setTimeout(() => {
      pending = false
      fit(view)
    })
  })
  watcher.observe(view.document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  })
  // Capturing, as an overlay may stop Escape from bubbling past it.
  view.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') void settled(view).then(() => emit('escape'))
    },
    true,
  )
}
onBeforeUnmount(() => watcher?.disconnect())

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
</script>

<template>
  <div>
    <SystemPreviewFrame
      :system-id="systemId"
      :artifact="artifact"
      :title="title"
      :props="props.props"
      :min-height="160"
      :error-height="200"
      :loading-text="t('lab.stage.loading')"
      :error-text="t('lab.stage.error')"
      frame-class="h-[min(var(--frame-height),40vh)] lg:h-[min(var(--frame-height),70vh)]"
      @fit="fit"
      @load="loaded"
      @state="state = $event"
      @message="heard"
    />
    <p role="status" class="mt-2 text-sm text-muted empty:hidden">
      <template v-if="state === 'ready' && blank">{{
        t('lab.stage.blank')
      }}</template>
    </p>
  </div>
</template>
