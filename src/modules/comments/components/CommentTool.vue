<script setup lang="ts">
import {
  useManifest,
  usePrototypeArtifacts,
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
import {
  mayDeleteThread,
  threadNumbers,
  type Anchor,
  type CommentThread,
} from '../threads'
import type { CommentGroup } from '../utils/commentGroup'
import CommentComposer from './CommentComposer.vue'
import CommentDeleteModal from './CommentDeleteModal.vue'
import CommentList from './CommentList.vue'
import CommentPin from './CommentPin.vue'
import CommentThreadPopover from './CommentThreadPopover.vue'
import CommentToolbar from './CommentToolbar.vue'

// The comment tool over an artifact page, drawn in the studio's overlay: the
// toolbar (in the page's top bar), numbered pins on what was commented, the composer, a thread's
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
  /** The end of the page's top bar, where the toolbar sits. */
  toolbar: HTMLElement | null
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const overlay = useOverlay()
const toast = useStudioToast()
const authorOf = await useCommentAuthors()
const manifest = await useManifest()
const artifacts = await usePrototypeArtifacts(() => props.prototype.id)
const {
  threads,
  create,
  reply,
  resolve,
  reopen,
  sendToAgent,
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
const kindOf = (type: string) =>
  t(`comments.kinds.${KINDS.includes(type) ? type : 'other'}`)
const kind = computed(() => kindOf(props.artifact.type))
const wholeLabel = computed(() => t('comments.whole', { kind: kind.value }))
// The list names whole-file threads of other files by their own kind.
const fileOf = (artifact: string) => {
  const owner = owners.value.get(artifact)
  return owner ? owner.file : null
}
const labelOf = (thread: CommentThread) =>
  thread.anchor.kind === 'artifact'
    ? t('comments.whole', {
        kind: kindOf(fileOf(thread.artifact)?.type ?? props.artifact.type),
      })
    : (thread.anchor.label ?? thread.anchor.kind)

// Which file each artifact ID belongs to: a named state to its view, every
// other artifact to itself. A view's threads are numbered together, all its
// named states included, so a file's group never repeats a number; pins
// show the state on screen only.
const owners = computed(() => {
  const map = new Map<
    string,
    { file: ManifestArtifact; state?: { id: string; title: string } }
  >()
  for (const file of artifacts.value) {
    map.set(file.id, { file })
    for (const state of file.states ?? []) map.set(state.id, { file, state })
  }
  return map
})
const fileId = computed(() => props.artifact.state?.view ?? props.artifact.id)
const groupOf = (thread: CommentThread) =>
  owners.value.get(thread.artifact)?.file.id ??
  // Before the artifact list arrives, the page still knows its own file.
  ((props.artifact.states ?? []).some(({ id }) => id === thread.artifact) ||
  thread.artifact === props.artifact.id
    ? fileId.value
    : `removed:${thread.artifact}`)
const familyThreads = computed(() =>
  threads.value.filter((thread) => groupOf(thread) === fileId.value),
)
// Every thread of the prototype, by file: the open file first, then the
// rest in file-tree order, then comments on files removed since.
const groups = computed<CommentGroup[]>(() => {
  const byFile = new Map<string, CommentThread[]>()
  for (const thread of threads.value) {
    const key = groupOf(thread)
    byFile.set(key, [...(byFile.get(key) ?? []), thread])
  }
  const order = [
    fileId.value,
    ...artifacts.value.map(({ id }) => id).filter((id) => id !== fileId.value),
    ...[...byFile.keys()].filter((key) => key.startsWith('removed:')),
  ]
  return order.flatMap((key): CommentGroup[] => {
    const list = byFile.get(key)
    if (!list?.length) return []
    const file = artifacts.value.find(({ id }) => id === key)
    const path = (file?.path ?? '').split('/').slice(0, -1).join('/')
    if (key === fileId.value || file)
      return [
        {
          id: key,
          title: file?.title ?? props.artifact.title,
          folder: path,
          kind: kindOf(file?.type ?? props.artifact.type),
          current: key === fileId.value,
          removed: false,
          threads: list,
        },
      ]
    return [
      {
        id: key,
        title: list[0]!.artifactTitle,
        folder: '',
        kind: kindOf('other'),
        current: false,
        removed: true,
        threads: list,
      },
    ]
  })
})
const numbers = computed(
  () =>
    new Map(groups.value.flatMap((group) => [...threadNumbers(group.threads)])),
)
const openCount = computed(
  () => threads.value.filter(({ status }) => status === 'open').length,
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
  () =>
    threads.value.find(
      ({ id, artifact }) => id === openId.value && owners.value.has(artifact),
    ) ??
    familyThreads.value.find(({ id }) => id === openId.value) ??
    null,
)
// A thread opens on its own file and state: a link to it from another one
// goes there.
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
    : (owners.value.get(thread.artifact)?.state?.title ??
      props.artifact.states?.find(({ id }) => id === thread.artifact)?.title)

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

const post = (body: string, send: boolean) =>
  write(async () => {
    if (!draft.value) return
    await create({
      artifact: props.artifact.id,
      artifactTitle: props.artifact.title,
      anchor: draft.value.anchor,
      body,
      send,
    })
    draft.value = null
    draftText.value = ''
    pinsShown.value = true
    if (send) toast.success(t('comments.sent'))
  })

function open(thread: CommentThread) {
  draft.value = null
  replyText.value = ''
  openId.value = openId.value === thread.id ? null : thread.id
}

/** A row of the list: bring its target into view and open it. */
function choose(thread: CommentThread) {
  // A removed file's comments are listed only: there is no page to open.
  if (
    thread.artifact !== props.artifact.id &&
    !owners.value.has(thread.artifact)
  )
    return
  draft.value = null
  replyText.value = ''
  if (thread.anchor.kind !== 'artifact') revealing.value = thread.id
  // Going to another file or named state is a step the person can go back
  // from; the thread opens once it shows.
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

/** Sends the open thread to the person's agent, or stops sending it. */
const sendCurrent = (on: boolean) =>
  write(async () => {
    if (!current.value) return
    await sendToAgent(current.value.id, on)
    toast.success(t(on ? 'comments.sent' : 'comments.unsent'))
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

// Several threads at once, from the list. Each is its own write, so one
// refused (someone else's comment, a file changed meanwhile) leaves the
// others done; the toast says how many went through and why one didn't.
const mayDelete = (thread: CommentThread) =>
  Boolean(access.value && mayDeleteThread(access.value, thread))

async function each(
  threads: CommentThread[],
  action: (id: string) => Promise<unknown>,
) {
  const done: string[] = []
  let refusal: string | null = null
  for (const { id } of threads)
    try {
      await action(id)
      done.push(id)
    } catch (error) {
      refusal ??= (error as Error).message
    }
  if (refusal) toast.error(t('comments.failed'), refusal)
  return done
}

/** One batch at a time, and never beside a single write. */
async function batch(run: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  try {
    await run()
  } finally {
    busy.value = false
  }
}

const resolveMany = (threads: CommentThread[]) =>
  batch(async () => {
    const done = await each(threads, resolve)
    if (openId.value && done.includes(openId.value)) openId.value = null
    if (!done.length) return
    const resolved = threads.filter(({ id }) => done.includes(id))
    toast.success(
      t('comments.resolvedMany', { count: done.length }, done.length),
      undefined,
      {
        label: t('comments.undo'),
        onClick: () => batch(async () => void (await each(resolved, reopen))),
      },
    )
  })

const reopenMany = (threads: CommentThread[]) =>
  batch(async () => {
    const done = await each(threads, reopen)
    if (done.length)
      toast.success(
        t('comments.reopenedMany', { count: done.length }, done.length),
      )
  })

async function deleteMany(threads: CommentThread[]) {
  if (busy.value || !threads.length) return
  const [only] = threads
  const confirmed = await overlay
    .create(CommentDeleteModal, { destroyOnClose: true })
    .open(
      threads.length === 1
        ? {
            number: numbers.value.get(only!.id) ?? 0,
            replies: only!.messages.length - 1,
          }
        : { number: 0, replies: 0, count: threads.length },
    )
  if (!confirmed) return
  await batch(async () => {
    const done = await each(threads, deleteThread)
    if (openId.value && done.includes(openId.value)) openId.value = null
    if (done.length)
      toast.success(
        t('comments.deletedMany', { count: done.length }, done.length),
      )
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
  ) ??
  props.toolbar?.querySelector<HTMLElement>('[role="toolbar"] button:enabled')

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
    event.target instanceof Node &&
    (root.value?.contains(event.target) ||
      props.toolbar?.contains(event.target)),
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

// A popover beside its point, flipped and kept inside the page and clear of
// the list; at the top right, under the toolbar, when it has no point.
const WIDTH = 320
function beside(point: { x: number; y: number } | null, height: number) {
  const { height: tall } = size.value
  const width = size.value.width - (listOpen.value ? PANEL : 0)
  if (!point)
    return {
      left: `${Math.max(12, width - WIDTH - 12)}px`,
      top: '12px',
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
      @send="sendCurrent"
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
        :groups="groups"
        :numbers="numbers"
        :kind="kind"
        :label="labelOf"
        :author="authorOf"
        :missing="missingIds"
        :elsewhere="elsewhere"
        :open-id="openId"
        :read-only="readOnly"
        :may-delete="mayDelete"
        :busy="busy"
        @choose="choose"
        @resolve="resolveMany"
        @reopen="reopenMany"
        @delete="deleteMany"
        @whole="whole"
        @close="listOpen = false"
      />
    </Transition>

    <Teleport v-if="toolbar" :to="toolbar">
      <CommentToolbar
        :commenting="commenting"
        :pins-shown="pinsShown"
        :list-open="listOpen"
        :open-count="openCount"
        :can-point="Boolean(surface)"
        :read-only="readOnly"
        @comment="toggle"
        @pins="pinsShown = !pinsShown"
        @list="listOpen = !listOpen"
        @copy="copyForAgent"
      />
    </Teleport>
  </div>
</template>
