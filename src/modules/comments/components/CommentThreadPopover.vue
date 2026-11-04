<script setup lang="ts">
import ContributorAvatar from '../../../../app/components/ContributorAvatar.vue'
import type { ShownAuthor } from '../composables/useCommentAuthors'
import { useFocusReturn } from '../composables/useFocusReturn'
import type { Author, CommentThread } from '../threads'
import { timeAgo } from '../utils/time'

// A thread beside its pin: who said what, Reply, and Resolve. It opens
// with the Reply field focused and gives focus back when it closes.
const props = defineProps<{
  thread: CommentThread
  number: number
  /** What it is pinned to, in words. */
  label: string
  /** Where focus goes when where it came from is gone. */
  fallback?: () => HTMLElement | null | undefined
  author: (author: Author) => ShownAuthor
  /** Its target was removed or changed since it was made. */
  missing: boolean
  sending: boolean
}>()
const emit = defineEmits<{
  reply: [body: string]
  resolve: []
  close: []
}>()

const { t } = useI18n()
const text = defineModel<string>({ default: '' })
const field = useTemplateRef<{ textareaRef?: HTMLTextAreaElement }>('field')
const root = useTemplateRef<HTMLElement>('root')
useFocusReturn(root, () => props.fallback?.())
const resolver = computed(() =>
  props.thread.resolvedBy ? props.author(props.thread.resolvedBy).name : '',
)

function onKey(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  if (text.value.trim()) emit('reply', text.value)
}
onMounted(() => field.value?.textareaRef?.focus())
</script>

<template>
  <div
    ref="root"
    role="dialog"
    :aria-label="t('comments.thread.title', { number })"
    data-comment-ui
    class="pointer-events-auto absolute flex max-h-[calc(100%-24px)] w-80 flex-col gap-2.5 rounded-xl border border-default bg-default p-3 shadow-lg"
  >
    <div class="flex items-center gap-1.5">
      <span
        class="grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-semibold text-white"
        :class="thread.status === 'resolved' ? 'bg-neutral-500' : 'bg-info'"
        >{{ number }}</span
      >
      <span class="min-w-0 flex-1 truncate text-xs font-medium text-muted">{{
        label
      }}</span>
      <UTooltip
        v-if="thread.status === 'open'"
        :text="t('comments.thread.resolve')"
      >
        <UButton
          icon="i-lucide-circle-check"
          :aria-label="t('comments.thread.resolve')"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="emit('resolve')"
        />
      </UTooltip>
      <UTooltip :text="t('comments.thread.close')">
        <UButton
          icon="i-lucide-x"
          :aria-label="t('comments.thread.close')"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="emit('close')"
        />
      </UTooltip>
    </div>
    <p
      v-if="thread.status === 'resolved'"
      class="flex items-center gap-1.5 rounded-lg bg-elevated px-2 py-1.5 text-xs text-muted"
    >
      <UIcon name="i-lucide-circle-check" class="size-3.5 shrink-0" />
      {{ t('comments.thread.resolvedBy', { name: resolver }) }}
    </p>
    <p
      v-if="missing"
      role="status"
      class="flex items-center gap-1.5 rounded-lg bg-warning/10 px-2 py-1.5 text-xs text-warning"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-3.5 shrink-0" />
      {{ t('comments.thread.notFound') }}
    </p>
    <blockquote
      v-if="thread.anchor.quote"
      class="border-l-2 border-info pl-2 text-sm text-muted"
    >
      {{ thread.anchor.quote }}
    </blockquote>
    <ol class="flex min-h-0 flex-col gap-3 overflow-auto">
      <li
        v-for="message in thread.messages"
        :key="message.id"
        class="flex gap-2"
      >
        <UAvatar
          v-if="message.author.agent"
          icon="i-lucide-bot"
          size="3xs"
          aria-hidden="true"
        />
        <ContributorAvatar
          v-else
          :name="author(message.author).name"
          :github="author(message.author).github"
          :avatar="author(message.author).avatar"
        />
        <div class="min-w-0 flex-1">
          <p class="flex flex-wrap items-center gap-1.5 text-xs">
            <strong class="font-semibold text-highlighted">{{
              author(message.author).name
            }}</strong>
            <UBadge
              v-if="message.author.agent"
              :label="t('comments.agentBadge')"
              color="neutral"
              variant="soft"
              size="sm"
            />
            <span class="text-muted">{{ timeAgo(message.createdAt) }}</span>
          </p>
          <p class="text-sm break-words whitespace-pre-wrap text-default">
            {{ message.body }}
          </p>
        </div>
      </li>
    </ol>
    <div class="flex items-end gap-2">
      <UTextarea
        ref="field"
        v-model="text"
        :rows="1"
        autoresize
        :maxrows="6"
        class="flex-1"
        :placeholder="t('comments.thread.reply')"
        :aria-label="t('comments.thread.reply')"
        @keydown="onKey"
      />
      <UButton
        icon="i-lucide-send-horizontal"
        :aria-label="t('comments.thread.send')"
        color="info"
        size="sm"
        :loading="sending"
        :disabled="!text.trim()"
        @click="emit('reply', text)"
      />
    </div>
  </div>
</template>
