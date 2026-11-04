<script setup lang="ts">
import ContributorAvatar from '../../../../app/components/ContributorAvatar.vue'
import type { ShownAuthor } from '../composables/useCommentAuthors'
import type { Author, CommentThread } from '../threads'
import { timeAgo } from '../utils/time'
import CommentReadOnly from './CommentReadOnly.vue'

// Every comment on the open file, every named state of a view included, in
// a panel over the right of the page that never resizes it. Rows read the
// way the agent will (number, target, quote, first message) and choosing
// one brings its target into view and opens it. "Comment on the whole …"
// comments without pointing, so the tool works from the keyboard alone.
// Where the person can't write, the service's reason takes its place.
const props = defineProps<{
  threads: CommentThread[]
  numbers: Map<string, number>
  /** The file's kind in words: view, document, diagram, canvas or file. */
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
}>()
const emit = defineEmits<{
  choose: [thread: CommentThread]
  whole: []
  close: []
}>()

const { t } = useI18n()
const tab = defineModel<'open' | 'resolved'>('tab', { default: 'open' })

const count = (status: CommentThread['status']) => ({
  label: props.threads.filter((thread) => thread.status === status).length,
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
const listed = computed(() =>
  props.threads
    .filter((thread) => thread.status === tab.value)
    .sort(
      (a, b) => (props.numbers.get(a.id) ?? 0) - (props.numbers.get(b.id) ?? 0),
    ),
)
const replies = (thread: CommentThread) => thread.messages.length - 1
</script>

<template>
  <aside
    :aria-label="t('comments.list.title')"
    data-comment-ui
    class="pointer-events-auto absolute inset-y-0 right-0 flex w-[340px] flex-col border-l border-default bg-default"
  >
    <header class="flex items-center justify-between py-2 pr-2 pl-4">
      <h2 class="text-sm font-semibold text-highlighted">
        {{ t('comments.list.title') }}
      </h2>
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
      v-if="readOnly"
      :reason="readOnly.reason"
      :join="readOnly.join"
      class="mx-3 mt-2.5 mb-1"
    />
    <UButton
      v-else
      icon="i-lucide-file"
      :label="t('comments.list.whole', { kind })"
      color="neutral"
      variant="outline"
      size="sm"
      class="mx-3 mt-2.5 mb-1 border border-dashed border-accented text-muted ring-0"
      @click="emit('whole')"
    />
    <ul class="min-h-0 flex-1 overflow-auto px-2 py-1">
      <li v-for="thread in listed" :key="thread.id">
        <button
          type="button"
          class="flex w-full flex-col gap-1 rounded-lg px-2 py-2.5 text-left hover:bg-elevated focus-visible:outline-2 focus-visible:outline-info"
          :class="openId === thread.id && 'bg-elevated'"
          :aria-current="openId === thread.id || undefined"
          @click="emit('choose', thread)"
        >
          <span class="flex min-w-0 items-center gap-2">
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
            <UBadge
              v-if="elsewhere(thread)"
              :label="t('comments.list.onState', { state: elsewhere(thread) })"
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
      <li
        v-if="!listed.length"
        class="px-3 py-6 text-center text-sm text-muted"
      >
        {{
          tab === 'open'
            ? t('comments.list.emptyOpen', { kind })
            : t('comments.list.emptyResolved')
        }}
      </li>
    </ul>
  </aside>
</template>
