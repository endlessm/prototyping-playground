<script setup lang="ts">
import ContributorAvatar from '../../../../app/components/ContributorAvatar.vue'
import type { ShownAuthor } from '../composables/useCommentAuthors'
import type { Author, CommentThread } from '../threads'
import type { CommentGroup } from '../utils/commentGroup'
import { timeAgo } from '../utils/time'
import CommentReadOnly from './CommentReadOnly.vue'

// Every comment on the prototype, grouped by file (the open one first, a
// view's named states with their view), in a panel over the right of the
// page that never resizes it. Rows read the way the agent will (number,
// target, quote, first message) and choosing one goes to its file and state,
// brings its target into view and opens it. "Comment on the whole …"
// comments on the open file without pointing, so the tool works from the
// keyboard alone. Where the person can't write, the service's reason takes
// its place. Select turns rows into toggles, for resolving, reopening or
// deleting several comments at once from the bar at the bottom.
const props = defineProps<{
  groups: CommentGroup[]
  /** Each thread's number within its file. */
  numbers: Map<string, number>
  /** The open file's kind in words: view, document, diagram, canvas or file. */
  kind: string
  label: (thread: CommentThread) => string
  author: (author: Author) => ShownAuthor
  /** Threads whose target the page can't find now. */
  missing: Set<string>
  /** The named state a thread is on, when it isn't the one on screen. */
  elsewhere: (thread: CommentThread) => string | undefined
  openId: string | null
  /** The service's reason the person can't comment here, or null. */
  readOnly: { reason: string; join: boolean } | null
  /** Whether the person may delete this thread (its author, or an Admin). */
  mayDelete: (thread: CommentThread) => boolean
  /** A batch action is running. */
  busy: boolean
}>()
const emit = defineEmits<{
  choose: [thread: CommentThread]
  whole: []
  close: []
  resolve: [threads: CommentThread[]]
  reopen: [threads: CommentThread[]]
  delete: [threads: CommentThread[]]
}>()

const { t } = useI18n()
const tab = defineModel<'open' | 'resolved'>('tab', { default: 'open' })

const all = computed(() => props.groups.flatMap(({ threads }) => threads))
const count = (status: CommentThread['status']) => ({
  label: all.value.filter((thread) => thread.status === status).length,
  color: 'neutral' as const,
  variant: 'soft' as const,
})
const tabs = computed(() => [
  { label: t('comments.list.open'), value: 'open', badge: count('open') },
  {
    label: t('comments.list.resolved'),
    value: 'resolved',
    badge: count('resolved'),
  },
])
// Files with nothing on the chosen tab are left out.
const listed = computed(() =>
  props.groups.flatMap((group) => {
    const threads = group.threads
      .filter((thread) => thread.status === tab.value)
      .sort(
        (a, b) =>
          (props.numbers.get(a.id) ?? 0) - (props.numbers.get(b.id) ?? 0),
      )
    return threads.length ? [{ ...group, threads }] : []
  }),
)
const replies = (thread: CommentThread) => thread.messages.length - 1

// Selecting several threads on the tab on screen. A removed file's threads
// can be selected too: they still exist, only their page is gone.
const selecting = ref(false)
const selected = ref(new Set<string>())
const shown = computed(() => listed.value.flatMap(({ threads }) => threads))
const chosen = computed(() =>
  shown.value.filter(({ id }) => selected.value.has(id)),
)
const allChosen = computed(
  () => shown.value.length > 0 && chosen.value.length === shown.value.length,
)
const deletable = computed(
  () => chosen.value.length > 0 && chosen.value.every(props.mayDelete),
)
function toggle(thread: CommentThread) {
  const next = new Set(selected.value)
  if (!next.delete(thread.id)) next.add(thread.id)
  selected.value = next
}
function toggleAll() {
  selected.value = allChosen.value
    ? new Set()
    : new Set(shown.value.map(({ id }) => id))
}
function startSelecting() {
  selecting.value = true
}
function stopSelecting() {
  selecting.value = false
  selected.value = new Set()
}
// What was acted on leaves the tab, so the selection starts again; a tab
// shows other threads, so does a change of tab.
watch(tab, () => (selected.value = new Set()))
watch(shown, (now) => {
  const ids = new Set(now.map(({ id }) => id))
  if ([...selected.value].some((id) => !ids.has(id)))
    selected.value = new Set([...selected.value].filter((id) => ids.has(id)))
})
watch(
  () => props.readOnly,
  (refused) => refused && stopSelecting(),
)
function choose(thread: CommentThread, removed: boolean) {
  if (selecting.value) toggle(thread)
  else if (!removed) emit('choose', thread)
}
const onKey = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !selecting.value) return
  event.preventDefault()
  event.stopPropagation()
  stopSelecting()
}
const groupKind = (group: CommentGroup) =>
  group.removed
    ? t('comments.list.removed')
    : group.current
      ? t('comments.list.here', { kind: group.kind })
      : group.kind
</script>

<template>
  <aside
    :aria-label="t('comments.list.title')"
    data-comment-ui
    class="pointer-events-auto absolute inset-y-0 right-0 flex w-[340px] flex-col border-l border-default bg-default"
    @keydown="onKey"
  >
    <header class="flex items-center justify-between py-2 pr-2 pl-4">
      <h2 class="text-sm font-semibold text-highlighted">
        {{ t('comments.list.title') }}
      </h2>
      <UButton
        v-if="!readOnly"
        :icon="selecting ? undefined : 'i-lucide-list-checks'"
        :label="selecting ? t('comments.list.done') : t('comments.list.select')"
        :aria-pressed="selecting"
        color="neutral"
        variant="ghost"
        size="xs"
        class="ml-auto"
        @click="selecting ? stopSelecting() : startSelecting()"
      />
      <UTooltip :text="t('comments.list.close')">
        <UButton
          icon="i-lucide-x"
          :aria-label="t('comments.list.close')"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="emit('close')"
        />
      </UTooltip>
    </header>
    <UTabs
      v-model="tab"
      :items="tabs"
      :content="false"
      variant="pill"
      size="xs"
      color="neutral"
      class="px-3"
      :ui="{
        list: 'gap-1 bg-transparent p-0',
        indicator: 'bg-elevated shadow-none',
        trigger: 'data-[state=active]:text-highlighted',
      }"
    />
    <CommentReadOnly
      v-if="readOnly && !selecting"
      :reason="readOnly.reason"
      :join="readOnly.join"
      class="mx-3 mt-2.5 mb-1"
    />
    <UButton
      v-else-if="!selecting"
      icon="i-lucide-file"
      :label="t('comments.list.whole', { kind })"
      color="neutral"
      variant="outline"
      size="sm"
      class="mx-3 mt-2.5 mb-1 border border-dashed border-accented text-muted ring-0"
      @click="emit('whole')"
    />
    <div class="min-h-0 flex-1 overflow-auto px-2 pb-1">
      <section
        v-for="group in listed"
        :key="group.id"
        :aria-labelledby="`comment-group-${group.id}`"
      >
        <h3
          :id="`comment-group-${group.id}`"
          class="sticky top-0 z-10 flex min-w-0 items-baseline gap-1.5 bg-default px-2 pt-3 pb-1 text-xs"
        >
          <span class="min-w-0 truncate font-semibold text-highlighted">{{
            group.title
          }}</span>
          <span class="shrink-0 text-muted">{{ groupKind(group) }}</span>
          <span
            v-if="group.folder"
            class="ml-auto min-w-0 shrink truncate text-dimmed"
            >{{ group.folder }}</span
          >
        </h3>
        <ul>
          <li v-for="thread in group.threads" :key="thread.id">
            <button
              type="button"
              class="flex w-full flex-col gap-1 rounded-lg px-2 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-info enabled:hover:bg-elevated disabled:cursor-default"
              :class="
                (selecting ? selected.has(thread.id) : openId === thread.id) &&
                'bg-elevated'
              "
              :aria-current="(!selecting && openId === thread.id) || undefined"
              :aria-pressed="selecting ? selected.has(thread.id) : undefined"
              :disabled="group.removed && !selecting"
              @click="choose(thread, group.removed)"
            >
              <span class="flex min-w-0 items-center gap-2">
                <UIcon
                  v-if="selecting"
                  :name="
                    selected.has(thread.id)
                      ? 'i-lucide-square-check'
                      : 'i-lucide-square'
                  "
                  aria-hidden="true"
                  class="size-4 shrink-0"
                  :class="selected.has(thread.id) ? 'text-info' : 'text-dimmed'"
                />
                <span
                  class="grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[11px] font-semibold text-white"
                  :class="
                    thread.status === 'resolved' ? 'bg-neutral-500' : 'bg-info'
                  "
                  >{{ numbers.get(thread.id) }}</span
                >
                <span class="min-w-0 truncate text-xs font-medium text-muted">{{
                  label(thread)
                }}</span>
                <UIcon
                  v-if="thread.sentToAgent"
                  name="i-lucide-bot"
                  :aria-label="t('comments.thread.sentBadge')"
                  class="size-3.5 shrink-0 text-info"
                />
                <UBadge
                  v-if="elsewhere(thread)"
                  :label="
                    t('comments.list.onState', { state: elsewhere(thread) })
                  "
                  color="neutral"
                  variant="soft"
                  size="sm"
                  class="shrink-0"
                />
              </span>
              <span
                v-if="missing.has(thread.id)"
                class="flex w-fit items-center gap-1 rounded bg-warning/10 px-1.5 text-[11px] font-medium text-warning"
              >
                <UIcon name="i-lucide-triangle-alert" class="size-3" />
                {{ t('comments.list.notFound') }}
              </span>
              <span
                v-if="thread.anchor.quote"
                class="truncate text-xs text-muted italic"
                >“{{ thread.anchor.quote }}”</span
              >
              <span class="line-clamp-2 text-sm text-highlighted">{{
                thread.messages[0]?.body
              }}</span>
              <span class="flex items-center gap-1 text-xs text-muted">
                <UAvatar
                  v-if="thread.messages[0]?.author.agent"
                  icon="i-lucide-bot"
                  size="3xs"
                  aria-hidden="true"
                />
                <ContributorAvatar
                  v-else-if="thread.messages[0]"
                  :name="author(thread.messages[0].author).name"
                  :github="author(thread.messages[0].author).github"
                  :avatar="author(thread.messages[0].author).avatar"
                />
                <span class="truncate">
                  {{ author(thread.messages[0]!.author).name }} ·
                  {{ timeAgo(thread.messages[0]!.createdAt) }}
                  <template v-if="replies(thread)">
                    ·
                    {{
                      t(
                        'comments.list.replies',
                        { count: replies(thread) },
                        replies(thread),
                      )
                    }}
                  </template>
                </span>
              </span>
            </button>
          </li>
        </ul>
      </section>
      <p v-if="!listed.length" class="px-3 py-6 text-center text-sm text-muted">
        {{
          tab === 'open'
            ? t('comments.list.emptyOpen', { kind })
            : t('comments.list.emptyResolved')
        }}
      </p>
    </div>
    <footer
      v-if="selecting"
      class="flex flex-col gap-2 border-t border-default px-3 py-2.5"
    >
      <div class="flex items-center justify-between gap-2">
        <UCheckbox
          :model-value="
            allChosen ? true : chosen.length ? 'indeterminate' : false
          "
          :label="t('comments.list.selectAll')"
          :disabled="!shown.length"
          size="sm"
          @update:model-value="toggleAll"
        />
        <span role="status" class="text-xs text-muted">{{
          t('comments.list.selected', { count: chosen.length }, chosen.length)
        }}</span>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="tab === 'open'"
          icon="i-lucide-circle-check"
          :label="t('comments.list.resolveSelected')"
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="!chosen.length || busy"
          @click="emit('resolve', chosen)"
        />
        <UButton
          v-else
          icon="i-lucide-rotate-ccw"
          :label="t('comments.list.reopenSelected')"
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="!chosen.length || busy"
          @click="emit('reopen', chosen)"
        />
        <UTooltip
          :text="
            chosen.length && !deletable ? t('comments.list.cantDelete') : ''
          "
          :disabled="!chosen.length || deletable"
        >
          <UButton
            icon="i-lucide-trash-2"
            :label="t('comments.list.deleteSelected')"
            color="error"
            variant="outline"
            size="sm"
            :disabled="!deletable || busy"
            @click="emit('delete', chosen)"
          />
        </UTooltip>
      </div>
    </footer>
  </aside>
</template>
