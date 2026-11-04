<script setup lang="ts">
import {
  useManifest,
  type ManifestArtifact,
  type ManifestPrototype,
} from '../../../../app/composables/useManifest'
import { useStudioToast } from '../../../../app/composables/useStudioToast'
import type {
  ArtifactSurface,
  SurfaceAnchor,
  SurfaceLocation,
  SurfacePoint,
  SurfaceTarget,
} from '../../../../app/utils/artifactSurface'
import {
  commentShortcut,
  isTyping,
  onApple,
} from '../../../../app/utils/shortcuts'
import { artifactTitle } from '../../../../tooling/manifest/titles'
import { agentText } from '../agentText'
import { useCommentAccess } from '../composables/useCommentAccess'
import { useCommentAuthors } from '../composables/useCommentAuthors'
import { useCommentThreads } from '../composables/useCommentThreads'
import { threadNumbers, type Anchor, type CommentThread } from '../threads'
import CommentComposer from './CommentComposer.vue'
import CommentDeleteModal from './CommentDeleteModal.vue'
import CommentList from './CommentList.vue'
import CommentPin from './CommentPin.vue'
import CommentThreadPopover from './CommentThreadPopover.vue'
import CommentToolbar from './CommentToolbar.vue'

// The comment tool over an artifact page, drawn in the studio's overlay: the
// toolbar, numbered pins on what was commented, the composer, a thread's
// popover and the list of every comment. The page's surface says what is
// under the pointer and where each anchor is now; the tool asks again
// whenever the surface says things may have moved, so pins follow
// scrolling, resizing and re-renders. In comment mode the surface takes the
// pointer, so no press reaches the page. The open thread is kept in the
// address (`?comment=<id>`), so a link or a reload reopens it. What the
// person may write is the service's to say: where it refuses everything
// (not registered, an archived prototype) its reason replaces the fields.
const props = defineProps<{
  prototype: ManifestPrototype
  /** The open artifact, or a view's named state with the view's record. */
  artifact: ManifestArtifact & {
    state?: { id: string; title: string; view: string }
  }
  surface: ArtifactSurface | null
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const overlay = useOverlay()
const toast = useStudioToast()
const authorOf = await useCommentAuthors()
const manifest = await useManifest()
const {
  threads,
  create,
  reply,
  resolve,
  reopen,
  edit,
  deleteMessage,
  deleteThread,
} = useCommentThreads(() => props.prototype.id)
const access = useCommentAccess(() => props.prototype)
const readOnly = computed(() =>
  access.value?.refusal
    ? { reason: access.value.refusal, join: access.value.join }
    : null,
)

const root = useTemplateRef<HTMLElement>('root')
const commenting = ref(false)
const pinsShown = ref(true)
const listOpen = ref(false)
const tab = ref<'open' | 'resolved'>('open')
// The list's width: it sits over the page and never resizes it.
const PANEL = 340

// The open thread lives in the address, replaced rather than pushed, so
// opening and closing threads adds no history entries.
const openId = computed<string | null>({
  get: () =>
    typeof route.query.comment === 'string' ? route.query.comment : null,
  set: (id) => {
    if (id === openId.value) return
    const query = { ...route.query }
    if (id) query.comment = id
    else delete query.comment
    void navigateTo({ query, hash: route.hash }, { replace: true })
  },
})
const draft = shallowRef<{ anchor: Anchor; label: string } | null>(null)
const draftText = ref('')
// Text selected while reading, offered for a comment.
const offer = shallowRef<SurfaceTarget | null>(null)
const replyText = ref('')
const busy = ref(false)
// The thread whose target is brought into view once the page shows it:
// one chosen in the list, or one a link opened.
const revealing = ref<string | null>(openId.value)
watch(openId, (id) => {
  if (id !== revealing.value) revealing.value = null
})

const KINDS = ['view', 'document', 'diagram', 'canvas']
const kind = computed(() =>
  t(
    `comments.kinds.${KINDS.includes(props.artifact.type) ? props.artifact.type : 'other'}`,
  ),
)
const wholeLabel = computed(() => t('comments.whole', { kind: kind.value }))
const labelOf = (thread: CommentThread) =>
  thread.anchor.kind === 'artifact'
    ? wholeLabel.value
    : (thread.anchor.label ?? thread.anchor.kind)

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
const openCount = computed(
  () => familyThreads.value.filter(({ status }) => status === 'open').length,
)
// The threads on the page's own targets; a whole-file thread has no pin.
const pinned = computed(() =>
  familyThreads.value.filter(
    (thread) =>
      thread.artifact === props.artifact.id &&
      thread.anchor.kind !== 'artifact',
  ),
)
// What can show a pin now: the open thread, whatever its status; and unless
// pins are hidden outside comment mode, open threads, and resolved ones
// while the list shows them.
const placed = computed(() =>
  pinned.value.filter(
    (thread) =>
      thread.id === openId.value ||
      ((pinsShown.value || commenting.value) &&
        (thread.status === 'open' ||
          (listOpen.value && tab.value === 'resolved'))),
  ),
)
const chosen = computed(
  () => familyThreads.value.find(({ id }) => id === openId.value) ?? null,
)
// A thread opens on its own state: a link to it from another one goes there.
const current = computed(() =>
  chosen.value?.artifact === props.artifact.id ? chosen.value : null,
)
const addressOf = (artifact: string) =>
  `/prototypes/${props.prototype.id}/artifacts/${artifact}`
watch(
  chosen,
  (thread) => {
    if (thread && thread.artifact !== props.artifact.id)
      void navigateTo(
        { path: addressOf(thread.artifact), query: route.query },
        { replace: true },
      )
  },
  { immediate: true },
)
/** The named state a listed thread is on, when another one is on screen. */
const elsewhere = (thread: CommentThread) =>
  thread.artifact === props.artifact.id
    ? undefined
    : props.artifact.states?.find(({ id }) => id === thread.artifact)?.title

// --- Where things are, in the overlay's own coordinates.
const DRAFT = '\0draft'
const OFFER = '\0offer'
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
  for (const thread of pinned.value)
    next[thread.id] = surface.locate(thread.anchor as SurfaceAnchor)
  if (draft.value && draft.value.anchor.kind !== 'artifact')
    next[DRAFT] = surface.locate(draft.value.anchor as SurfaceAnchor)
  if (offer.value) next[OFFER] = surface.locate(offer.value.anchor)
  const wanted = revealing.value ? next[revealing.value] : undefined
  if (wanted && wanted.state !== 'missing') {
    const thread = pinned.value.find(({ id }) => id === revealing.value)
    revealing.value = null
    if (thread && wanted.state === 'offscreen')
      surface.reveal(thread.anchor as SurfaceAnchor)
  }
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

// Measure only while there is something to place, list or bring into view;
// this also measures again whenever what is placed changes.
watchEffect((onCleanup) => {
  const surface = props.surface
  if (
    !surface ||
    !(
      commenting.value ||
      draft.value ||
      offer.value ||
      placed.value.length ||
      listOpen.value ||
      revealing.value
    )
  )
    return
  const stop = surface.onChange(measure)
  measure()
  onCleanup(stop)
})

// Nothing to write with where the service refuses every write.
watch(readOnly, (refused) => {
  if (!refused) return
  commenting.value = false
  draft.value = null
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

// Selected text is quoted; otherwise a press is about what is under it.
function begin(point: SurfacePoint) {
  const target = props.surface?.selection?.() ?? props.surface?.targetAt(point)
  if (target) start(target)
}

function start(target: SurfaceTarget) {
  offer.value = null
  openId.value = null
  draftText.value = ''
  draft.value = { anchor: target.anchor, label: target.label }
}

// Reading, with comment mode off: text selected in the page offers
// "Comment" beside it, once the selection is made (pointer or keys up).
function offerSelection() {
  const surface = props.surface
  offer.value =
    (surface?.selection &&
      !commenting.value &&
      !draft.value &&
      !readOnly.value &&
      surface.selection()) ||
    null
}
const offerLater = () => setTimeout(offerSelection)
useEventListener(document, 'mouseup', offerLater)
useEventListener(document, 'keyup', offerLater)
useEventListener(document, 'selectionchange', () => {
  if (offer.value && window.getSelection()?.isCollapsed) offer.value = null
})
watch(commenting, () => (offer.value = null))

/** A comment on the whole file: listed, with no pin. */
function whole() {
  openId.value = null
  draftText.value = ''
  draft.value = { anchor: { kind: 'artifact' }, label: wholeLabel.value }
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

/** A row of the list: bring its target into view and open it. */
function choose(thread: CommentThread) {
  draft.value = null
  replyText.value = ''
  if (thread.anchor.kind !== 'artifact') revealing.value = thread.id
  // Going to another named state is a step the person can go back from;
  // the thread opens once it shows.
  if (thread.artifact !== props.artifact.id)
    void navigateTo({
      path: addressOf(thread.artifact),
      query: { ...route.query, comment: thread.id },
    })
  else openId.value = thread.id
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
    const { id } = current.value
    await resolve(id)
    openId.value = null
    toast.success(t('comments.resolved'), undefined, {
      label: t('comments.undo'),
      onClick: () => write(() => reopen(id)),
    })
  })

// The list follows a reopened thread to the Open tab.
const reopenCurrent = () =>
  write(async () => {
    if (!current.value) return
    await reopen(current.value.id)
    tab.value = 'open'
  })

const editCurrent = (message: string, body: string) =>
  write(async () => {
    if (current.value) await edit(current.value.id, message, body)
  })

const deleteCurrentMessage = (message: string) =>
  write(async () => {
    if (!current.value) return
    await deleteMessage(current.value.id, message)
    toast.success(t('comments.messageDeleted'))
  })

async function deleteCurrent() {
  const thread = current.value
  if (!thread) return
  const confirmed = await overlay
    .create(CommentDeleteModal, { destroyOnClose: true })
    .open({
      number: numbers.value.get(thread.id) ?? 0,
      replies: thread.messages.length - 1,
    })
  if (!confirmed) return
  await write(async () => {
    await deleteThread(thread.id)
    if (openId.value === thread.id) openId.value = null
    toast.success(t('comments.deleted'))
  })
}

/** The address that opens the thread, on its own state. */
async function copyLink() {
  const thread = current.value
  if (!thread) return
  const { href } = router.resolve({
    path: addressOf(thread.artifact),
    query: { comment: thread.id },
  })
  try {
    await navigator.clipboard.writeText(
      new URL(href, window.location.origin).href,
    )
    toast.success(t('comments.linkCopied'))
  } catch (error) {
    toast.error(t('comments.copyFailed'), (error as Error).message)
  }
}

/**
 * The open comments of the open file, as the agent text `yarn comments`
 * prints, with what the page can't find as of now. Threads on another named
 * state can't be measured from here, so they are never "not found".
 */
async function copyForAgent() {
  measure()
  const open = familyThreads.value.filter(({ status }) => status === 'open')
  const view = props.artifact.state?.view ?? props.artifact.id
  const text = agentText(
    [
      {
        type: props.artifact.type,
        title: artifactTitle(props.artifact.path.split('/').pop()!),
        file: props.artifact.file,
        address: addressOf(view),
        threads: open,
        numbers: numbers.value,
        states: Object.fromEntries(
          (props.artifact.states ?? []).map(({ id, title }) => [id, title]),
        ),
        missing: missingIds.value,
      },
    ],
    {
      name: (contributor) =>
        manifest.value.contributors.find(({ id }) => id === contributor)?.name,
    },
  )
  try {
    await navigator.clipboard.writeText(text)
    toast.success(t('comments.copied', { count: open.length }, open.length))
  } catch (error) {
    toast.error(t('comments.copyAgentFailed'), (error as Error).message)
  }
}

// Where focus goes when a popover's opener is gone, such as the row of a
// thread just resolved.
const fallbackFocus = () =>
  root.value?.querySelector<HTMLElement>(
    '[data-comment-list] [role="tab"][aria-selected="true"]',
  ) ?? root.value?.querySelector<HTMLElement>('[role="toolbar"] button:enabled')

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
    if (!props.surface || readOnly.value) return
    event.preventDefault()
    toggle()
    return
  }
  // Esc is the tool's only from the tool, the page or nowhere in particular,
  // and never while another dialog or menu of the studio is open.
  // The page's own content is in the studio's document for some types, so
  // focus may rest on the page or an element around it.
  const page = props.surface?.element
  const fromPage =
    event.target === document.body ||
    (event.target instanceof Node &&
      Boolean(
        page &&
        (page.contains(event.target) || (event.target as Node).contains(page)),
      ))
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

// Room the page's own controls take at its bottom edge, kept clear.
const inset = computed(() => props.surface?.bottomInset ?? 0)

// A popover beside its point, flipped and kept inside the page and clear of
// the list; above the toolbar when it has no point.
const WIDTH = 320
function beside(point: { x: number; y: number } | null, height: number) {
  const { height: tall } = size.value
  const width = size.value.width - (listOpen.value ? PANEL : 0)
  if (!point)
    return {
      left: `${Math.max(12, width - WIDTH - 16)}px`,
      bottom: `${72 + inset.value}px`,
    }
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
// Pins under the list are hidden.
const pins = computed(() =>
  placed.value.flatMap((thread) => {
    const place = inOverlay(places.value[thread.id])
    const active = openId.value === thread.id
    const covered =
      listOpen.value && place && place.x > size.value.width - PANEL
    return place?.shown && !covered ? [{ thread, ...place, active }] : []
  }),
)
const missingIds = computed(
  () =>
    new Set(
      Object.entries(places.value)
        .filter(([id, place]) => id !== DRAFT && place.state === 'missing')
        .map(([id]) => id),
    ),
)
const draftPlace = computed(() => inOverlay(places.value[DRAFT]))
const offerPlace = computed(() =>
  offer.value ? inOverlay(places.value[OFFER]) : null,
)
const currentPlace = computed(() =>
  current.value ? inOverlay(places.value[current.value.id]) : null,
)
const missing = computed(
  () => Boolean(current.value) && missingIds.value.has(current.value!.id),
)
</script>

<template>
  <div
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

    <!-- Selected text while reading: comment on it. -->
    <UButton
      v-if="offer && offerPlace?.shown"
      data-comment-ui
      data-comment-selection
      icon="i-lucide-message-square-plus"
      :label="t('comments.selection.label')"
      :aria-label="t('comments.selection.aria')"
      color="neutral"
      variant="solid"
      size="sm"
      class="pointer-events-auto absolute -translate-x-1/2 rounded-full shadow-lg"
      :style="{
        left: `${offerPlace.x}px`,
        top: `${Math.max(8, offerPlace.y - 44)}px`,
      }"
      @mousedown.prevent
      @click="start(offer)"
    />

    <CommentComposer
      v-if="draft"
      v-model="draftText"
      :label="draft.label"
      :quote="draft.anchor.quote"
      :whole="draft.anchor.kind === 'artifact'"
      :posting="busy"
      :fallback="fallbackFocus"
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
      :label="labelOf(current)"
      :author="authorOf"
      :fallback="fallbackFocus"
      :missing="missing"
      :sending="busy"
      :access="access"
      :style="beside(missing ? null : currentPlace, 320)"
      @reply="send"
      @resolve="resolveCurrent"
      @reopen="reopenCurrent"
      @edit="editCurrent"
      @delete-message="deleteCurrentMessage"
      @delete="deleteCurrent"
      @copy-link="copyLink"
      @close="openId = null"
    />

    <p
      v-if="commenting"
      role="status"
      data-comment-ui
      class="pointer-events-auto absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-inverted px-3 py-1.5 text-sm text-inverted shadow-lg"
    >
      <i18n-t
        :keypath="surface?.selection ? 'comments.hintQuote' : 'comments.hint'"
        scope="global"
      >
        <template #key><UKbd value="Esc" /></template>
      </i18n-t>
    </p>

    <Transition
      enter-active-class="motion-safe:transition motion-safe:duration-150 motion-safe:ease-out"
      enter-from-class="motion-safe:translate-x-3 motion-safe:opacity-0"
    >
      <CommentList
        v-if="listOpen"
        v-model:tab="tab"
        data-comment-list
        :threads="familyThreads"
        :numbers="numbers"
        :kind="kind"
        :label="labelOf"
        :author="authorOf"
        :missing="missingIds"
        :elsewhere="elsewhere"
        :open-id="openId"
        :read-only="readOnly"
        @choose="choose"
        @whole="whole"
        @close="listOpen = false"
      />
    </Transition>

    <CommentToolbar
      :commenting="commenting"
      :pins-shown="pinsShown"
      :list-open="listOpen"
      :open-count="openCount"
      :can-point="Boolean(surface)"
      :read-only="readOnly"
      :inset="inset"
      @comment="toggle"
      @pins="pinsShown = !pinsShown"
      @list="listOpen = !listOpen"
      @copy="copyForAgent"
    />
  </div>
</template>
