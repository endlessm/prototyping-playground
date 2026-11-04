<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
} from 'vue'
import Icon from './Icon.vue'
import {
  ME,
  PEOPLE,
  forAgent,
  type Artifact,
  type Person,
  type Start,
  type Thread,
} from './comments'
import { commentShortcut, useDark } from './useLook'

// The comment tool over an artifact page, as the studio would draw it: a
// toolbar in the corner, numbered pins on what was commented, a popover to
// write or read a thread, and a list of every comment on the file. The page
// marks what can be commented with `data-target` and `data-label`; in
// comment mode a click on one starts a comment there, and selected text is
// quoted. Pins follow their target as the page scrolls, pans or changes.
const props = withDefaults(
  defineProps<{
    artifact: Artifact
    threads: Thread[]
    start?: Start
    /** The thread a state opens, or the target it hovers or comments on. */
    focus?: string
    /** Quoted text of a state's draft. */
    quote?: string
    /** Room the page's own controls need under the toolbar. */
    raise?: number
    /** Whether selecting text quotes it. */
    quotes?: boolean
  }>(),
  { start: 'browse', focus: undefined, quote: undefined, raise: 0 },
)

const PANEL = 340
const dark = useDark()
const shortcut = ref('Ctrl+Alt+M')
const root = useTemplateRef<HTMLElement>('root')
const draftField = useTemplateRef<HTMLTextAreaElement>('draftField')
const replyField = useTemplateRef<HTMLTextAreaElement>('replyField')

// Props of a named state arrive reactive; the layer keeps its own copy.
const threads = ref<Thread[]>(JSON.parse(JSON.stringify(props.threads)))
const mode = ref(props.start === 'comment' || props.start === 'draft')
const showPins = ref(true)
const panel = ref(props.start === 'list')
const tab = ref<'open' | 'resolved'>('open')
const openId = ref<string | null>(
  props.start === 'thread' ? (props.focus ?? null) : null,
)
const hover = ref<string | null>(
  props.start === 'comment' ? (props.focus ?? null) : null,
)
interface Draft {
  target: string
  label: string
  at: { x: number; y: number }
  quote?: string
}
const draft = ref<Draft | null>(null)
const draftText = ref('')
const replyText = ref('')
const chip = ref<{ x: number; y: number; draft: Draft } | null>(null)
const toast = ref('')
const fresh = ref<string | null>(null)
const menu = ref(false)

const number = (thread: Thread) => threads.value.indexOf(thread) + 1
const openThreads = computed(() =>
  threads.value.filter((thread) => thread.status === 'open'),
)
const listed = computed(() =>
  threads.value.filter((thread) => thread.status === tab.value),
)
const current = computed(
  () => threads.value.find((thread) => thread.id === openId.value) ?? null,
)
const kindName = computed(
  () =>
    ({
      view: 'view',
      document: 'document',
      diagram: 'diagram',
      canvas: 'canvas',
    })[props.artifact.kind],
)

// --- Where things are: measured every frame, so pins follow scrolling,
// panning, zooming and re-rendering without each page reporting it.
interface Point {
  x: number
  y: number
  visible: boolean
}
const points = shallowRef<Record<string, Point>>({})
const size = shallowRef({ width: 0, height: 0 })
const hoverBox = shallowRef<{
  left: number
  top: number
  width: number
  height: number
  label: string
} | null>(null)
let frame = 0
let signature = ''

function find(target: string) {
  return root.value?.querySelector<Element>(`[data-target="${target}"]`)
}
function pointOn(target: string, at: { x: number; y: number }, box: DOMRect) {
  const element = find(target)
  if (!element) return undefined
  const rect = element.getBoundingClientRect()
  const x = rect.left - box.left + rect.width * at.x
  const y = rect.top - box.top + rect.height * at.y
  const right = box.width - (panel.value ? PANEL : 0)
  return { x, y, visible: x >= 0 && y >= 0 && x <= right && y <= box.height }
}
function measure() {
  frame = requestAnimationFrame(measure)
  const element = root.value
  if (!element) return
  const box = element.getBoundingClientRect()
  const next: Record<string, Point> = {}
  for (const thread of threads.value) {
    if (thread.detached || thread.target === 'artifact') continue
    const point = pointOn(thread.target, thread.at, box)
    if (point) next[thread.id] = point
  }
  if (draft.value && draft.value.target !== 'artifact') {
    const point = pointOn(draft.value.target, draft.value.at, box)
    if (point) next.draft = point
  }
  let nextHover = null
  if (mode.value && hover.value && !draft.value) {
    const target = find(hover.value)
    if (target) {
      const rect = target.getBoundingClientRect()
      nextHover = {
        left: rect.left - box.left,
        top: rect.top - box.top,
        width: rect.width,
        height: rect.height,
        label: target.getAttribute('data-label') ?? 'Element',
      }
    }
  }
  const nextSize = { width: box.width, height: box.height }
  const now = JSON.stringify([next, nextHover, nextSize])
  if (now === signature) return
  signature = now
  points.value = next
  hoverBox.value = nextHover
  size.value = nextSize
}

// A popover beside its pin, kept inside the page and clear of the list.
function beside(point: { x: number; y: number } | undefined, height = 320) {
  const width = 320
  const right = size.value.width - (panel.value ? PANEL : 0)
  if (!point)
    return {
      left: `${Math.max(12, right - width - 20)}px`,
      bottom: `${76 + props.raise}px`,
    }
  let left = point.x + 22
  if (left + width > right - 12) left = point.x - 22 - width
  left = Math.min(Math.max(12, left), Math.max(12, right - width - 12))
  const top = Math.min(
    Math.max(12, point.y - 18),
    Math.max(12, size.value.height - height - 12),
  )
  return { left: `${left}px`, top: `${top}px` }
}

// --- Choosing what to comment on.
function targetOf(node: EventTarget | Node | null) {
  const element =
    node instanceof Element
      ? node
      : node instanceof Node
        ? node.parentElement
        : null
  const target = element?.closest('[data-target]')
  if (!target || !root.value?.contains(target)) return null
  if (target.closest('[data-comment-ui]')) return null
  return target
}
const isUi = (node: EventTarget | null) =>
  node instanceof Element && Boolean(node.closest('[data-comment-ui]'))

function selected(): Draft | null {
  if (!props.quotes) return null
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || !selection.rangeCount) return null
  const text = selection.toString().replace(/\s+/g, ' ').trim()
  if (!text) return null
  const range = selection.getRangeAt(0)
  const target = targetOf(range.commonAncestorContainer)
  if (!target) return null
  const rects = range.getClientRects()
  const end = rects[rects.length - 1] ?? range.getBoundingClientRect()
  const box = target.getBoundingClientRect()
  return {
    target: target.getAttribute('data-target')!,
    label: target.getAttribute('data-label') ?? 'Text',
    at: {
      x: (end.right - box.left) / box.width,
      y: (end.top - box.top) / box.height,
    },
    quote: text.length > 160 ? `${text.slice(0, 157)}…` : text,
  }
}

function begin(next: Draft) {
  draft.value = next
  draftText.value = ''
  openId.value = null
  chip.value = null
  menu.value = false
  window.getSelection()?.removeAllRanges()
  void nextTick(() => draftField.value?.focus())
}

function onClick(event: MouseEvent) {
  if (!mode.value || isUi(event.target)) return
  event.preventDefault()
  event.stopPropagation()
  const quote = selected()
  if (quote) return begin(quote)
  const target = targetOf(event.target)
  if (!target) return
  const rect = target.getBoundingClientRect()
  begin({
    target: target.getAttribute('data-target')!,
    label: target.getAttribute('data-label') ?? 'Element',
    at: {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    },
  })
}
function onMove(event: MouseEvent) {
  if (!mode.value) return
  const target = isUi(event.target) ? null : targetOf(event.target)
  hover.value = target?.getAttribute('data-target') ?? null
}
// Reading a document: selecting text offers "Comment" beside it.
function onMouseUp(event: MouseEvent) {
  if (mode.value || isUi(event.target)) return
  setTimeout(offerChip)
}
function offerChip() {
  const quote = selected()
  if (!quote || !root.value) return (chip.value = null)
  const range = window.getSelection()!.getRangeAt(0)
  const rects = range.getClientRects()
  const end = rects[rects.length - 1] ?? range.getBoundingClientRect()
  const box = root.value.getBoundingClientRect()
  chip.value = {
    x: end.right - box.left,
    y: end.top - box.top - 40,
    draft: quote,
  }
}
// A state that shows text being selected: the target's first sentence.
function selectFirstSentence(target: string) {
  const element = find(target)
  const text = element?.firstChild
  if (!text || text.nodeType !== Node.TEXT_NODE) return
  const content = text.textContent ?? ''
  const end = content.indexOf('.') + 1 || content.length
  const range = document.createRange()
  range.setStart(text, 0)
  range.setEnd(text, end)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  offerChip()
}

function toggleMode() {
  mode.value = !mode.value
  hover.value = null
  if (!mode.value) draft.value = null
}

// --- Threads.
function post() {
  const body = draftText.value.trim()
  if (!body || !draft.value) return
  const id = `new-${Date.now()}`
  threads.value.push({
    id,
    ...draft.value,
    status: 'open',
    messages: [{ author: ME, body, time: 'Just now' }],
  })
  draft.value = null
  fresh.value = id
  showPins.value = true
  setTimeout(() => (fresh.value = null), 400)
}
function open(thread: Thread) {
  draft.value = null
  menu.value = false
  replyText.value = ''
  openId.value = openId.value === thread.id ? null : thread.id
  if (openId.value) void nextTick(() => replyField.value?.focus())
}
function reveal(thread: Thread) {
  if (thread.status === 'resolved') tab.value = 'resolved'
  if (!thread.detached && thread.target !== 'artifact') {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    find(thread.target)?.scrollIntoView({
      block: 'center',
      inline: 'center',
      behavior: reduced ? 'auto' : 'smooth',
    })
  }
  openId.value = null
  open(thread)
}
function sendReply() {
  const body = replyText.value.trim()
  if (!body || !current.value) return
  current.value.messages.push({ author: ME, body, time: 'Just now' })
  replyText.value = ''
}
function resolve(thread: Thread) {
  thread.status = 'resolved'
  thread.resolvedBy = ME
  openId.value = null
  say('Comment resolved')
}
function reopen(thread: Thread) {
  thread.status = 'open'
  thread.resolvedBy = undefined
  tab.value = 'open'
}
function remove(thread: Thread) {
  threads.value.splice(threads.value.indexOf(thread), 1)
  openId.value = null
  say('Comment deleted')
}
function wholeFile() {
  begin({
    target: 'artifact',
    label: `The whole ${kindName.value}`,
    at: { x: 0, y: 0 },
  })
}
async function copy() {
  const text = forAgent(props.artifact, threads.value)
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Clipboard access can be refused inside a frame; the toast still shows.
  }
  const count = openThreads.value.length
  say(`Copied ${count} open comment${count === 1 ? '' : 's'} for your agent`)
}
let toastTimer: ReturnType<typeof setTimeout> | undefined
function say(text: string) {
  toast.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2400)
}

function onKey(event: KeyboardEvent) {
  if (
    event.code === 'KeyM' &&
    event.altKey &&
    (event.ctrlKey || event.metaKey)
  ) {
    event.preventDefault()
    return toggleMode()
  }
  if (event.key !== 'Escape') return
  if (menu.value) menu.value = false
  else if (draft.value) draft.value = null
  else if (openId.value) openId.value = null
  else if (chip.value) chip.value = null
  else if (mode.value) toggleMode()
}
function onDraftKey(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    post()
  }
}
function onReplyKey(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendReply()
  }
}

onMounted(() => {
  shortcut.value = commentShortcut()
  window.addEventListener('keydown', onKey)
  frame = requestAnimationFrame(measure)
  if (props.start === 'draft' && props.focus) {
    const target = find(props.focus)
    begin({
      target: props.focus,
      label: target?.getAttribute('data-label') ?? 'Element',
      at: { x: 0.92, y: 0.5 },
      quote: props.quote,
    })
  }
  if (props.start === 'select' && props.focus) {
    const target = props.focus
    setTimeout(() => selectFirstSentence(target), 300)
  }
  if (openId.value) void nextTick(() => replyField.value?.focus())
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('keydown', onKey)
  clearTimeout(toastTimer)
})

const person = (key: Person) => PEOPLE[key]
const preview = (thread: Thread) => thread.messages[0]?.body ?? ''
</script>

<template>
  <div
    ref="root"
    class="layer"
    :class="{ dark, commenting: mode }"
    @click.capture="onClick"
    @mousemove.capture="onMove"
    @mouseleave="hover = null"
    @mouseup="onMouseUp"
    @scroll.capture="chip = null"
  >
    <div class="page">
      <slot />
    </div>

    <!-- What the pointer would comment on. -->
    <div
      v-if="hoverBox"
      class="hover"
      :style="{
        left: `${hoverBox.left}px`,
        top: `${hoverBox.top}px`,
        width: `${hoverBox.width}px`,
        height: `${hoverBox.height}px`,
      }"
      aria-hidden="true"
    >
      <span class="hover-label">{{ hoverBox.label }}</span>
    </div>

    <div
      class="pins"
      :style="{ right: panel ? `${PANEL}px` : '0' }"
      data-comment-ui
    >
      <template v-for="thread in threads" :key="thread.id">
        <button
          v-if="
            points[thread.id]?.visible &&
            (showPins || mode || openId === thread.id) &&
            (thread.status === 'open' ||
              tab === 'resolved' ||
              openId === thread.id)
          "
          type="button"
          class="pin"
          :class="{
            resolved: thread.status === 'resolved',
            active: openId === thread.id,
            fresh: fresh === thread.id,
          }"
          :style="{
            left: `${points[thread.id]!.x}px`,
            top: `${points[thread.id]!.y}px`,
          }"
          :aria-label="`Comment ${number(thread)} by ${person(thread.messages[0]!.author).name}: ${preview(thread)}`"
          :aria-expanded="openId === thread.id"
          @click="open(thread)"
        >
          <Icon v-if="thread.status === 'resolved'" name="check" :size="12" />
          <template v-else>{{ number(thread) }}</template>
          <span class="peek" aria-hidden="true">
            <strong>{{ person(thread.messages[0]!.author).name }}</strong>
            {{ preview(thread) }}
          </span>
        </button>
      </template>
      <span
        v-if="draft && points.draft?.visible"
        class="pin draft"
        :style="{ left: `${points.draft.x}px`, top: `${points.draft.y}px` }"
        aria-hidden="true"
        >{{ threads.length + 1 }}</span
      >
    </div>

    <!-- Selecting text while reading. -->
    <button
      v-if="chip && !mode"
      type="button"
      class="chip"
      data-comment-ui
      :style="{ left: `${chip.x}px`, top: `${Math.max(8, chip.y)}px` }"
      @mousedown.prevent
      @click="begin(chip.draft)"
    >
      <Icon name="message-plus" :size="14" /> Comment
    </button>

    <!-- Writing a new comment. -->
    <div
      v-if="draft"
      class="popover"
      role="dialog"
      aria-label="New comment"
      data-comment-ui
      :style="beside(draft.target === 'artifact' ? undefined : points.draft, 220)"
    >
      <div class="popover-head">
        <span class="target">
          <Icon :name="draft.target === 'artifact' ? 'file' : 'pointer'" :size="14" />
          {{ draft.label }}
        </span>
      </div>
      <blockquote v-if="draft.quote" class="quote">
        {{ draft.quote }}
      </blockquote>
      <textarea
        ref="draftField"
        v-model="draftText"
        class="field"
        rows="3"
        placeholder="Add a comment"
        aria-label="Comment"
        @keydown="onDraftKey"
      />
      <div class="popover-foot">
        <span class="hint">Enter to post</span>
        <button type="button" class="button ghost" @click="draft = null">
          Cancel
        </button>
        <button
          type="button"
          class="button solid"
          :disabled="!draftText.trim()"
          @click="post"
        >
          Comment
        </button>
      </div>
    </div>

    <!-- Reading a thread. -->
    <div
      v-if="current"
      class="popover thread"
      role="dialog"
      :aria-label="`Comment ${number(current)}`"
      data-comment-ui
      :style="beside(points[current.id])"
    >
      <div class="popover-head">
        <span class="number" :class="{ resolved: current.status === 'resolved' }">{{
          number(current)
        }}</span>
        <span class="target">{{ current.label }}</span>
        <button
          v-if="current.status === 'open'"
          type="button"
          class="icon-button"
          data-tip="Resolve"
          aria-label="Resolve"
          @click="resolve(current)"
        >
          <Icon name="circle-check" />
        </button>
        <span class="menu-wrap">
          <button
            type="button"
            class="icon-button"
            data-tip="More"
            aria-label="More"
            :aria-expanded="menu"
            @click="menu = !menu"
          >
            <Icon name="more" />
          </button>
          <span v-if="menu" class="menu" role="menu">
            <button type="button" role="menuitem" @click="say('Link copied'); menu = false">
              <Icon name="copy" :size="14" /> Copy link
            </button>
            <button
              v-if="current.messages[0]!.author === ME"
              type="button"
              role="menuitem"
              class="danger"
              @click="remove(current)"
            >
              <Icon name="x" :size="14" /> Delete comment
            </button>
          </span>
        </span>
        <button
          type="button"
          class="icon-button"
          data-tip="Close"
          aria-label="Close"
          @click="openId = null"
        >
          <Icon name="x" />
        </button>
      </div>
      <p v-if="current.status === 'resolved'" class="banner">
        <Icon name="circle-check" :size="14" />
        Resolved by {{ current.resolvedBy === ME ? 'you' : person(current.resolvedBy ?? ME).name }}
        <button type="button" class="link" @click="reopen(current)">
          Reopen
        </button>
      </p>
      <p v-if="current.detached" class="banner warn">
        <Icon name="alert" :size="14" />
        Target not found. It was removed or changed.
      </p>
      <blockquote v-if="current.quote" class="quote">
        {{ current.quote }}
      </blockquote>
      <ol class="messages">
        <li v-for="(message, index) in current.messages" :key="index">
          <span
            class="avatar"
            :style="{ background: person(message.author).tint }"
            aria-hidden="true"
          >
            <Icon v-if="message.author === 'agent'" name="bot" :size="12" />
            <template v-else>{{ person(message.author).initials }}</template>
          </span>
          <div>
            <p class="byline">
              <strong>{{ person(message.author).name }}</strong>
              <span v-if="message.author === 'agent'" class="badge">Agent</span>
              <span class="time">{{ message.time }}</span>
            </p>
            <p class="body">{{ message.body }}</p>
          </div>
        </li>
      </ol>
      <div class="reply">
        <textarea
          ref="replyField"
          v-model="replyText"
          class="field"
          rows="1"
          placeholder="Reply"
          aria-label="Reply"
          @keydown="onReplyKey"
        />
        <button
          type="button"
          class="send"
          aria-label="Send reply"
          :disabled="!replyText.trim()"
          @click="sendReply"
        >
          <Icon name="send" :size="14" />
        </button>
      </div>
    </div>

    <!-- Every comment on this file. -->
    <aside
      v-if="panel"
      class="panel"
      aria-label="Comments"
      data-comment-ui
      :style="{ width: `${PANEL}px` }"
    >
      <header class="panel-head">
        <h2>Comments</h2>
        <button
          type="button"
          class="icon-button"
          aria-label="Close comments"
          data-tip="Close"
          @click="panel = false"
        >
          <Icon name="x" />
        </button>
      </header>
      <div class="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'open'"
          @click="tab = 'open'"
        >
          Open <span>{{ openThreads.length }}</span>
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'resolved'"
          @click="tab = 'resolved'"
        >
          Resolved
          <span>{{ threads.length - openThreads.length }}</span>
        </button>
      </div>
      <button type="button" class="whole" @click="wholeFile">
        <Icon name="file" :size="14" /> Comment on the whole {{ kindName }}
      </button>
      <ul class="list">
        <li v-for="thread in listed" :key="thread.id">
          <button
            type="button"
            class="item"
            :class="{ active: openId === thread.id }"
            @click="reveal(thread)"
          >
            <span class="item-head">
              <span class="number" :class="{ resolved: thread.status === 'resolved' }">{{
                number(thread)
              }}</span>
              <span class="item-target">{{ thread.label }}</span>
            </span>
            <span v-if="thread.detached" class="detached">
              <Icon name="alert" :size="12" /> Target not found
            </span>
            <span v-if="thread.quote" class="item-quote">“{{ thread.quote }}”</span>
            <span class="item-body">{{ preview(thread) }}</span>
            <span class="item-meta">
              <span
                class="avatar small"
                :style="{ background: person(thread.messages[0]!.author).tint }"
                aria-hidden="true"
                >{{ person(thread.messages[0]!.author).initials }}</span
              >
              {{ person(thread.messages[0]!.author).name }} ·
              {{ thread.messages[0]!.time }}
              <template v-if="thread.messages.length > 1">
                · {{ thread.messages.length - 1 }}
                {{ thread.messages.length === 2 ? 'reply' : 'replies' }}
              </template>
            </span>
          </button>
        </li>
        <li v-if="!listed.length" class="empty">
          {{
            tab === 'open'
              ? `No open comments. Turn on Comment and click anything on the ${kindName}.`
              : 'No resolved comments yet.'
          }}
        </li>
      </ul>
      <footer class="panel-foot">
        <button
          type="button"
          class="button outline wide"
          :disabled="!openThreads.length"
          @click="copy"
        >
          <Icon name="copy" :size="14" /> Copy for agent
        </button>
      </footer>
    </aside>

    <p v-if="mode" class="mode-hint" role="status" data-comment-ui>
      <template v-if="quotes">
        Click anything to comment. Select text to quote it.
      </template>
      <template v-else>Click anything to comment.</template>
      <kbd>Esc</kbd> to stop.
    </p>

    <div
      class="toolbar"
      role="toolbar"
      aria-label="Comment tools"
      data-comment-ui
      :style="{
        bottom: `${16 + raise}px`,
        right: `${16 + (panel ? PANEL : 0)}px`,
      }"
    >
      <button
        type="button"
        class="tool primary"
        aria-label="Comment"
        aria-keyshortcuts="Control+Alt+M Meta+Alt+M"
        :aria-pressed="mode"
        :data-tip="`Comment (${shortcut})`"
        @click="toggleMode"
      >
        <Icon name="message-plus" />
        <span>Comment</span>
      </button>
      <span class="divider" aria-hidden="true" />
      <button
        type="button"
        class="tool"
        :aria-pressed="!showPins"
        :aria-label="showPins ? 'Hide comments' : 'Show comments'"
        :data-tip="showPins ? 'Hide comments' : 'Show comments'"
        @click="showPins = !showPins"
      >
        <Icon :name="showPins ? 'eye' : 'eye-off'" />
      </button>
      <button
        type="button"
        class="tool"
        :aria-pressed="panel"
        aria-label="All comments"
        data-tip="All comments"
        @click="panel = !panel"
      >
        <Icon name="panel" />
        <span v-if="openThreads.length" class="count">{{ openThreads.length }}</span>
      </button>
      <button
        type="button"
        class="tool"
        aria-label="Copy for agent"
        data-tip="Copy for agent"
        :disabled="!openThreads.length"
        @click="copy"
      >
        <Icon name="copy" />
      </button>
    </div>

    <p v-if="toast" class="toast" role="status" data-comment-ui>
      <Icon name="check" :size="14" /> {{ toast }}
    </p>
  </div>
</template>

<style scoped>
.layer {
  --c-bg: #ffffff;
  --c-muted-bg: #fafafa;
  --c-elevated: #f5f5f5;
  --c-border: #e5e5e5;
  --c-border-strong: #d4d4d4;
  --c-text: #404040;
  --c-strong: #171717;
  --c-muted: #737373;
  --c-pin: #2563eb;
  --c-pin-soft: rgb(37 99 235 / 0.1);
  --c-warn: #b45309;
  --c-warn-soft: #fffbeb;
  --c-shadow: 0 10px 30px -10px rgb(0 0 0 / 0.25), 0 1px 3px rgb(0 0 0 / 0.08);
  position: relative;
  height: 100%;
  min-height: 100vh;
  overflow: hidden;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 14px;
  color: var(--c-text);
}
.layer.dark {
  --c-bg: #171717;
  --c-muted-bg: #1c1c1c;
  --c-elevated: #262626;
  --c-border: #2e2e2e;
  --c-border-strong: #404040;
  --c-text: #d4d4d4;
  --c-strong: #ffffff;
  --c-muted: #a3a3a3;
  --c-pin: #3b82f6;
  --c-pin-soft: rgb(59 130 246 / 0.16);
  --c-warn: #fbbf24;
  --c-warn-soft: rgb(251 191 36 / 0.12);
  --c-shadow: 0 10px 30px -10px rgb(0 0 0 / 0.7), 0 0 0 1px #2e2e2e;
}
.page {
  position: absolute;
  inset: 0;
}
.commenting .page,
.commenting .page :deep(*) {
  cursor: crosshair !important;
}
.commenting .page :deep([data-target]:hover) {
  outline: none;
}

button {
  font: inherit;
  color: inherit;
}
button:focus-visible {
  outline: 2px solid var(--c-pin);
  outline-offset: 2px;
}
.field:focus {
  outline: none;
  border-color: var(--c-pin);
  box-shadow: 0 0 0 3px var(--c-pin-soft);
}

.hover {
  position: absolute;
  pointer-events: none;
  border: 2px solid var(--c-pin);
  background: var(--c-pin-soft);
  border-radius: 6px;
  z-index: 5;
}
.hover-label {
  position: absolute;
  left: -2px;
  bottom: calc(100% + 4px);
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--c-pin);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.pins {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 6;
}
.pin {
  position: absolute;
  pointer-events: auto;
  width: 26px;
  height: 26px;
  margin: -13px 0 0 -13px;
  display: grid;
  place-items: center;
  border: 2px solid #fff;
  border-radius: 999px 999px 999px 4px;
  background: var(--c-pin);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.25);
  cursor: pointer;
  transition: transform 120ms ease-out;
}
.pin:hover,
.pin.active {
  transform: scale(1.12);
}
.pin.resolved {
  background: #a3a3a3;
}
.pin.draft {
  background: transparent;
  color: var(--c-pin);
  border: 2px dashed var(--c-pin);
  box-shadow: none;
}
.pin.fresh {
  animation: pop 180ms ease-out;
}
@keyframes pop {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
}
.peek {
  position: absolute;
  left: calc(100% + 8px);
  top: -2px;
  width: max-content;
  max-width: 240px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--c-bg);
  color: var(--c-text);
  border: 1px solid var(--c-border);
  box-shadow: var(--c-shadow);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  text-align: left;
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease-out;
}
.peek strong {
  display: block;
  color: var(--c-strong);
  font-weight: 600;
}
.pin:hover .peek {
  opacity: 1;
}
.pin.active .peek {
  display: none;
}

.chip {
  position: absolute;
  z-index: 8;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: none;
  border-radius: 999px;
  background: var(--c-strong);
  color: var(--c-bg);
  font-size: 13px;
  font-weight: 500;
  box-shadow: var(--c-shadow);
  cursor: pointer;
  transform: translateX(-50%);
}

.popover {
  position: absolute;
  z-index: 9;
  box-sizing: border-box;
  width: 320px;
  max-height: calc(100% - 24px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-bg);
  box-shadow: var(--c-shadow);
  animation: rise 140ms ease-out;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}
.popover-head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
}
.target {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--c-muted);
  font-size: 12px;
  font-weight: 500;
}
.number {
  flex: none;
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--c-pin);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}
.number.resolved {
  background: #a3a3a3;
}
.icon-button {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
}
.icon-button:hover {
  background: var(--c-elevated);
  color: var(--c-strong);
}
.menu-wrap {
  position: relative;
}
.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 2;
  min-width: 170px;
  padding: 4px;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  background: var(--c-bg);
  box-shadow: var(--c-shadow);
}
.menu button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.menu button:hover {
  background: var(--c-elevated);
}
.menu .danger {
  color: #dc2626;
}
.banner {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--c-elevated);
  color: var(--c-muted);
  font-size: 12px;
}
.banner.warn {
  background: var(--c-warn-soft);
  color: var(--c-warn);
}
.link {
  margin-left: auto;
  border: none;
  background: none;
  color: var(--c-strong);
  font-size: 12px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}
.quote {
  margin: 0;
  padding: 2px 0 2px 10px;
  border-left: 3px solid var(--c-pin);
  color: var(--c-text);
  font-size: 13px;
  font-style: italic;
  line-height: 1.45;
}
.field {
  width: 100%;
  box-sizing: border-box;
  resize: none;
  padding: 8px 10px;
  border: 1px solid var(--c-border-strong);
  border-radius: 6px;
  background: var(--c-bg);
  color: var(--c-strong);
  font: inherit;
  line-height: 1.45;
}
.field::placeholder {
  color: var(--c-muted);
}
.popover-foot {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hint {
  flex: 1;
  color: var(--c-muted);
  font-size: 12px;
}
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.button:disabled {
  opacity: 0.45;
  cursor: default;
}
.button.solid {
  border: none;
  background: var(--c-strong);
  color: var(--c-bg);
}
.button.ghost {
  border: none;
  background: transparent;
}
.button.ghost:hover {
  background: var(--c-elevated);
}
.button.outline {
  border: 1px solid var(--c-border-strong);
  background: var(--c-bg);
}
.button.outline:hover:not(:disabled) {
  background: var(--c-elevated);
}
.button.wide {
  width: 100%;
  height: 32px;
}

.messages {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
}
.messages li {
  display: flex;
  gap: 8px;
}
.avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  color: #262626;
  font-size: 9px;
  font-weight: 700;
}
.avatar.small {
  width: 16px;
  height: 16px;
  font-size: 7px;
}
.byline {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 1px 0 2px;
  font-size: 12px;
}
.byline strong {
  color: var(--c-strong);
  font-weight: 600;
}
.badge {
  padding: 0 5px;
  border: 1px solid var(--c-border-strong);
  border-radius: 4px;
  color: var(--c-muted);
  font-size: 10px;
  font-weight: 500;
}
.time {
  color: var(--c-muted);
}
.body {
  margin: 0;
  color: var(--c-text);
  font-size: 13px;
  line-height: 1.45;
}
.reply {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}
.send {
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 999px;
  background: var(--c-strong);
  color: var(--c-bg);
  cursor: pointer;
}
.send:disabled {
  opacity: 0.35;
  cursor: default;
}

.panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--c-border);
  background: var(--c-bg);
  animation: slide 160ms ease-out;
}
@keyframes slide {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px 16px;
}
.panel-head h2 {
  margin: 0;
  color: var(--c-strong);
  font-size: 14px;
  font-weight: 600;
}
.tabs {
  display: flex;
  gap: 4px;
  padding: 0 12px;
}
.tabs button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--c-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.tabs button[aria-selected='true'] {
  background: var(--c-elevated);
  color: var(--c-strong);
}
.tabs span {
  color: var(--c-muted);
  font-size: 12px;
}
.whole {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 12px 4px;
  padding: 8px 10px;
  border: 1px dashed var(--c-border-strong);
  border-radius: 8px;
  background: transparent;
  color: var(--c-muted);
  font-size: 13px;
  cursor: pointer;
}
.whole:hover {
  color: var(--c-strong);
  border-color: var(--c-muted);
}
.list {
  flex: 1;
  margin: 0;
  padding: 4px 8px;
  overflow: auto;
  list-style: none;
}
.item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.item:hover,
.item.active {
  background: var(--c-elevated);
}
.item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.item-target {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--c-muted);
  font-size: 12px;
  font-weight: 500;
}
.detached {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--c-warn-soft);
  color: var(--c-warn);
  font-size: 11px;
  font-weight: 500;
}
.item-quote {
  color: var(--c-muted);
  font-size: 12px;
  font-style: italic;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.item-body {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--c-strong);
  font-size: 13px;
  line-height: 1.45;
}
.item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--c-muted);
  font-size: 12px;
}
.empty {
  padding: 24px 12px;
  color: var(--c-muted);
  font-size: 13px;
  text-align: center;
}
.panel-foot {
  padding: 12px;
  border-top: 1px solid var(--c-border);
}

.mode-hint {
  position: absolute;
  top: 12px;
  left: 50%;
  z-index: 11;
  margin: 0;
  padding: 6px 12px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: var(--c-pin);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: var(--c-shadow);
}
.mode-hint kbd {
  padding: 0 5px;
  border-radius: 4px;
  background: rgb(255 255 255 / 0.2);
  font: inherit;
  font-size: 12px;
}

.toolbar {
  position: absolute;
  z-index: 11;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--c-border);
  border-radius: 999px;
  background: var(--c-bg);
  box-shadow: var(--c-shadow);
}
.tool {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  min-width: 32px;
  justify-content: center;
  padding: 0 8px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--c-text);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.tool.primary {
  padding: 0 12px 0 10px;
}
.tool:hover:not(:disabled) {
  background: var(--c-elevated);
  color: var(--c-strong);
}
.tool[aria-pressed='true'] {
  background: var(--c-elevated);
  color: var(--c-strong);
}
.tool.primary[aria-pressed='true'] {
  background: var(--c-pin);
  color: #fff;
}
.tool:disabled {
  opacity: 0.4;
  cursor: default;
}
.count {
  position: absolute;
  top: 1px;
  right: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  box-sizing: border-box;
  border-radius: 999px;
  background: var(--c-pin);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
}
.divider {
  width: 1px;
  height: 18px;
  margin: 0 2px;
  background: var(--c-border);
}
[data-tip]::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--c-strong);
  color: var(--c-bg);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 100ms ease-out;
}
[data-tip]:hover::after,
[data-tip]:focus-visible::after {
  opacity: 1;
  transition-delay: 300ms;
}
.popover [data-tip]::after {
  bottom: auto;
  top: calc(100% + 6px);
}

.toast {
  position: absolute;
  left: 50%;
  bottom: 20px;
  z-index: 12;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 8px 14px;
  transform: translateX(-50%);
  border-radius: 8px;
  background: var(--c-strong);
  color: var(--c-bg);
  font-size: 13px;
  font-weight: 500;
  box-shadow: var(--c-shadow);
  animation: rise 140ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .pin,
  .pin.fresh,
  .popover,
  .panel,
  .toast,
  .peek,
  [data-tip]::after {
    animation: none;
    transition: none;
  }
}
</style>
