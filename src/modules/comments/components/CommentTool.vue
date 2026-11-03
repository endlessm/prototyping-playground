<script setup lang="ts">
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import { useStudioToast } from '../../../../app/composables/useStudioToast'
import type {
  ArtifactSurface,
  SurfaceAnchor,
  SurfaceLocation,
  SurfacePoint,
} from '../../../../app/utils/artifactSurface'
import {
  commentShortcut,
  isTyping,
  onApple,
} from '../../../../app/utils/shortcuts'
import { useCommentAuthors } from '../composables/useCommentAuthors'
import { useCommentThreads } from '../composables/useCommentThreads'
import { threadNumbers, type CommentThread } from '../threads'
import CommentComposer from './CommentComposer.vue'
import CommentPin from './CommentPin.vue'
import CommentThreadPopover from './CommentThreadPopover.vue'
import CommentToolbar from './CommentToolbar.vue'

// The comment tool over an artifact page, drawn in the studio's overlay: the
// toolbar, numbered pins on what was commented, the composer and a thread's
// popover. The page's surface says what is under the pointer and where each
// anchor is now; the tool asks again whenever the surface says things may
// have moved, so pins follow scrolling, resizing and re-renders. In comment
// mode the surface takes the pointer, so no press reaches the page.
const props = defineProps<{
  prototype: ManifestPrototype
  /** The open artifact, or a view's named state with the view's record. */
  artifact: ManifestArtifact & { state?: { id: string; view: string } }
  surface: ArtifactSurface | null
}>()

const { t } = useI18n()
const toast = useStudioToast()
const authorOf = await useCommentAuthors()
const { threads, create, reply, resolve } = useCommentThreads(
  () => props.prototype.id,
)

const root = useTemplateRef<HTMLElement>('root')
const commenting = ref(false)
const pinsShown = ref(true)
const openId = ref<string | null>(null)
const draft = shallowRef<{ anchor: SurfaceAnchor; label: string } | null>(null)
const draftText = ref('')
const replyText = ref('')
const busy = ref(false)

// A view's threads are numbered together, all its named states included,
// so the list never repeats a number; pins show the state on screen only.
const family = computed(() => {
  const view = props.artifact.state?.view ?? props.artifact.id
  return new Set([view, ...(props.artifact.states ?? []).map(({ id }) => id)])
})
const familyThreads = computed(() =>
  threads.value.filter(({ artifact }) => family.value.has(artifact)),
)
const numbers = computed(() => threadNumbers(familyThreads.value))
const pinned = computed(() =>
  familyThreads.value.filter(
    (thread) =>
      thread.artifact === props.artifact.id &&
      thread.anchor.kind !== 'artifact',
  ),
)
// What can show a pin now: open threads (unless hidden outside comment
// mode) and the open thread, whatever its status.
const placed = computed(() =>
  pinned.value.filter(
    (thread) =>
      thread.id === openId.value ||
      (thread.status === 'open' && (pinsShown.value || commenting.value)),
  ),
)
const current = computed(
  () => familyThreads.value.find(({ id }) => id === openId.value) ?? null,
)

// --- Where things are, in the overlay's own coordinates.
const DRAFT = '\0draft'
const places = shallowRef<Record<string, SurfaceLocation>>({})
const hover = shallowRef<{
  left: number
  top: number
  width: number
  height: number
  label: string
} | null>(null)
const size = shallowRef({ left: 0, top: 0, width: 0, height: 0 })
let pointer: SurfacePoint | null = null
let signature = ''

function measure() {
  const surface = props.surface
  const element = root.value
  if (!surface || !element) return
  const box = element.getBoundingClientRect()
  const next: Record<string, SurfaceLocation> = {}
  for (const thread of placed.value)
    next[thread.id] = surface.locate(thread.anchor as SurfaceAnchor)
  if (draft.value) next[DRAFT] = surface.locate(draft.value.anchor)
  const target =
    commenting.value && pointer && !draft.value
      ? surface.targetAt(pointer)
      : null
  const nextHover = target && {
    left: target.box.left - box.left,
    top: target.box.top - box.top,
    width: target.box.width,
    height: target.box.height,
    label: target.label,
  }
  const nextSize = {
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
  }
  const now = JSON.stringify([next, nextHover, nextSize])
  if (now === signature) return
  signature = now
  places.value = next
  hover.value = nextHover
  size.value = nextSize
}

const inOverlay = (location: SurfaceLocation | undefined) =>
  location && location.state !== 'missing'
    ? {
        x: location.point.x - size.value.left,
        y: location.point.y - size.value.top,
        shown: location.state === 'shown',
      }
    : null

// Measure only while there is something to place; this also measures again
// whenever what is placed changes.
watchEffect((onCleanup) => {
  const surface = props.surface
  if (!surface || !(commenting.value || draft.value || placed.value.length))
    return
  const stop = surface.onChange(measure)
  measure()
  onCleanup(stop)
})

// --- Comment mode: the surface takes the pointer.
watchEffect((onCleanup) => {
  const surface = props.surface
  if (!surface || !commenting.value) return
  const stop = surface.intercept({
    move: (point) => {
      pointer = point
      measure()
    },
    press: begin,
    leave: () => {
      pointer = null
      measure()
    },
    key: () => back(),
  })
  onCleanup(() => {
    stop()
    pointer = null
    hover.value = null
  })
})

function begin(point: SurfacePoint) {
  const target = props.surface?.targetAt(point)
  if (!target) return
  openId.value = null
  draftText.value = ''
  draft.value = { anchor: target.anchor, label: target.label }
}

/** One write at a time; a refusal shows as a toast with its sentence. */
async function write(action: () => Promise<unknown>) {
  if (busy.value) return
  busy.value = true
  try {
    await action()
  } catch (error) {
    toast.error(t('comments.failed'), (error as Error).message)
  } finally {
    busy.value = false
  }
}

const post = (body: string) =>
  write(async () => {
    if (!draft.value) return
    await create({
      artifact: props.artifact.id,
      artifactTitle: props.artifact.title,
      anchor: draft.value.anchor,
      body,
    })
    draft.value = null
    draftText.value = ''
    pinsShown.value = true
  })

function open(thread: CommentThread) {
  draft.value = null
  replyText.value = ''
  openId.value = openId.value === thread.id ? null : thread.id
}

const send = (body: string) =>
  write(async () => {
    if (!current.value) return
    await reply(current.value.id, body)
    replyText.value = ''
  })

const resolveCurrent = () =>
  write(async () => {
    if (!current.value) return
    await resolve(current.value.id)
    openId.value = null
    toast.success(t('comments.resolved'))
  })

/** Esc backs out one step: the draft, then the thread, then comment mode. */
function back() {
  if (draft.value) draft.value = null
  else if (openId.value) openId.value = null
  else if (commenting.value) commenting.value = false
  else return false
  return true
}

function toggle() {
  commenting.value = !commenting.value
  if (!commenting.value) draft.value = null
}

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  const ours = Boolean(
    event.target instanceof Node && root.value?.contains(event.target),
  )
  if (commentShortcut(event)) {
    // Outside the tool a text field keeps its keystrokes. Inside it, Ctrl+Alt
    // can be AltGr typing a character, so only a plain M counts there.
    if (isTyping(event.target) && !ours) return
    if (ours && isTyping(event.target) && !onApple() && event.key !== 'm')
      return
    if (!props.surface) return
    event.preventDefault()
    toggle()
    return
  }
  // Esc is the tool's only from the tool, the page or nowhere in particular,
  // and never while another dialog or menu of the studio is open.
  const fromPage =
    event.target === document.body ||
    (event.target instanceof Node &&
      Boolean(props.surface?.element.contains(event.target)))
  const otherOverlay = document.querySelector(
    '[role="dialog"]:not([data-comment-ui]),[role="alertdialog"],[role="menu"]',
  )
  if (
    event.key === 'Escape' &&
    !event.defaultPrevented &&
    (ours || (fromPage && !otherOverlay)) &&
    back()
  )
    event.preventDefault()
})

// A popover beside its point, flipped and kept inside the page.
const WIDTH = 320
function beside(point: { x: number; y: number } | null, height: number) {
  const { width, height: tall } = size.value
  if (!point) return { right: '16px', bottom: '72px' }
  let left = point.x + 22
  if (left + WIDTH > width - 12) left = point.x - 22 - WIDTH
  left = Math.min(Math.max(12, left), Math.max(12, width - WIDTH - 12))
  const top = Math.min(
    Math.max(12, point.y - 18),
    Math.max(12, tall - height - 12),
  )
  return { left: `${left}px`, top: `${top}px` }
}

const preview = (thread: CommentThread) => thread.messages[0]?.body ?? ''
const pins = computed(() =>
  placed.value.flatMap((thread) => {
    const place = inOverlay(places.value[thread.id])
    const active = openId.value === thread.id
    return place?.shown ? [{ thread, ...place, active }] : []
  }),
)
const draftPlace = computed(() => inOverlay(places.value[DRAFT]))
const currentPlace = computed(() =>
  current.value ? inOverlay(places.value[current.value.id]) : null,
)
const missing = computed(
  () =>
    Boolean(current.value) &&
    current.value!.artifact === props.artifact.id &&
    places.value[current.value!.id]?.state === 'missing',
)
</script>

<template>
  <div
    v-if="surface"
    ref="root"
    data-comment-tool
    class="pointer-events-none absolute inset-0 z-10 overflow-hidden"
  >
    <!-- What a click would comment on. -->
    <div
      v-if="hover"
      aria-hidden="true"
      class="absolute rounded-md border-2 border-info bg-info/10"
      :style="{
        left: `${hover.left}px`,
        top: `${hover.top}px`,
        width: `${hover.width}px`,
        height: `${hover.height}px`,
      }"
    >
      <span
        data-comment-hover-label
        class="absolute bottom-[calc(100%+4px)] -left-0.5 max-w-80 truncate rounded-md bg-info px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white"
        >{{ hover.label }}</span
      >
    </div>

    <CommentPin
      v-for="pin in pins"
      :key="pin.thread.id"
      :number="numbers.get(pin.thread.id) ?? 0"
      :x="pin.x"
      :y="pin.y"
      :author="authorOf(pin.thread.messages[0]!.author)"
      :preview="preview(pin.thread)"
      :resolved="pin.thread.status === 'resolved'"
      :active="pin.active"
      @open="open(pin.thread)"
    />
    <span
      v-if="draft && draftPlace?.shown"
      aria-hidden="true"
      class="absolute -mt-[13px] -ml-[13px] grid size-[26px] place-items-center rounded-full rounded-bl-sm border-2 border-dashed border-info text-xs font-semibold text-info"
      :style="{ left: `${draftPlace.x}px`, top: `${draftPlace.y}px` }"
      >{{ familyThreads.length + 1 }}</span
    >

    <CommentComposer
      v-if="draft"
      v-model="draftText"
      :label="draft.label"
      :quote="draft.anchor.quote"
      :posting="busy"
      :style="beside(draftPlace, 220)"
      @post="post"
      @cancel="draft = null"
    />
    <CommentThreadPopover
      v-if="current"
      :key="current.id"
      v-model="replyText"
      :thread="current"
      :number="numbers.get(current.id) ?? 0"
      :author="authorOf"
      :missing="missing"
      :sending="busy"
      :style="beside(missing ? null : currentPlace, 320)"
      @reply="send"
      @resolve="resolveCurrent"
      @close="openId = null"
    />

    <p
      v-if="commenting"
      role="status"
      data-comment-ui
      class="pointer-events-auto absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-inverted px-3 py-1.5 text-sm text-inverted shadow-lg"
    >
      <i18n-t keypath="comments.hint" scope="global">
        <template #key><UKbd value="Esc" /></template>
      </i18n-t>
    </p>

    <CommentToolbar
      :commenting="commenting"
      :pins-shown="pinsShown"
      @comment="toggle"
      @pins="pinsShown = !pinsShown"
    />
  </div>
</template>
