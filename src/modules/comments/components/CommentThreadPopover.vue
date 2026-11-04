<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import ContributorAvatar from '../../../../app/components/ContributorAvatar.vue'
import { afterMenuCloses } from '../../../../app/utils/menus'
import type { ShownAuthor } from '../composables/useCommentAuthors'
import { useFocusReturn } from '../composables/useFocusReturn'
import {
  mayChangeMessage,
  mayDeleteThread,
  type Author,
  type CommentAccess,
  type CommentMessage,
  type CommentThread,
} from '../threads'
import { timeAgo } from '../utils/time'
import CommentReadOnly from './CommentReadOnly.vue'

// A thread beside its pin: who said what, Reply, Resolve or Reopen, and its
// "…" menu (Copy link, and Delete comment for its author or an Admin). Your
// own messages can be edited and deleted. It offers only what the service
// will allow, by the service's own rules; where nothing may be written, the
// service's reason replaces the Reply field. It opens with the Reply field
// focused and gives focus back when it closes.
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
  /** What the service says the person may do, or null until it answers. */
  access: CommentAccess | null
}>()
const emit = defineEmits<{
  reply: [body: string]
  resolve: []
  reopen: []
  edit: [message: string, body: string]
  'delete-message': [message: string]
  delete: []
  'copy-link': []
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

const readOnly = computed(() =>
  props.access?.refusal
    ? { reason: props.access.refusal, join: props.access.join }
    : null,
)
const mine = (message: CommentMessage) =>
  !readOnly.value &&
  Boolean(props.access?.author) &&
  mayChangeMessage(props.access!.author!, message)

// The menus only ask the tool, which reports its own failures.
const failed = () => {}
const menu = computed<DropdownMenuItem[]>(() => [
  {
    label: t('comments.thread.copyLink'),
    icon: 'i-lucide-link',
    onSelect: afterMenuCloses(() => emit('copy-link'), failed),
  },
  ...(!readOnly.value &&
  props.access &&
  mayDeleteThread(props.access, props.thread)
    ? [
        {
          label: t('comments.thread.delete'),
          icon: 'i-lucide-trash-2',
          color: 'error' as const,
          onSelect: afterMenuCloses(() => emit('delete'), failed),
        },
      ]
    : []),
])

// Editing a message in place: Enter saves, Esc puts it back.
const editing = ref<string | null>(null)
const draft = ref('')
const editField =
  useTemplateRef<{ textareaRef?: HTMLTextAreaElement }[]>('editField')
function startEditing(message: CommentMessage) {
  editing.value = message.id
  draft.value = message.body
  void nextTick(() => editField.value?.[0]?.textareaRef?.focus())
}
function stopEditing() {
  editing.value = null
  void nextTick(() => field.value?.textareaRef?.focus() ?? root.value?.focus())
}
function save() {
  const id = editing.value
  if (!id || !draft.value.trim()) return
  emit('edit', id, draft.value)
  stopEditing()
}
function onEditKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    // Only the edit backs out, not the thread.
    event.preventDefault()
    event.stopPropagation()
    stopEditing()
  } else if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    save()
  }
}
const messageMenu = (message: CommentMessage, index: number) => [
  {
    label: t('comments.message.edit'),
    icon: 'i-lucide-pencil',
    onSelect: afterMenuCloses(() => startEditing(message), failed),
  },
  // The first message is the comment itself: it goes with the comment.
  ...(index > 0
    ? [
        {
          label: t('comments.message.delete'),
          icon: 'i-lucide-trash-2',
          color: 'error' as const,
          onSelect: afterMenuCloses(
            () => emit('delete-message', message.id),
            failed,
          ),
        },
      ]
    : []),
]

function onKey(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  if (text.value.trim()) emit('reply', text.value)
}
// Read-only, there is no Reply field: the thread itself takes focus.
onMounted(() => (field.value?.textareaRef ?? root.value)?.focus())
</script>

<template>
  <div
    ref="root"
    role="dialog"
    tabindex="-1"
    :aria-label="t('comments.thread.title', { number })"
    data-comment-ui
    class="pointer-events-auto absolute flex max-h-[calc(100%-24px)] w-80 flex-col gap-2.5 rounded-xl border border-default bg-default p-3 shadow-lg outline-none"
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
        v-if="thread.status === 'open' && !readOnly"
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
      <UDropdownMenu
        :items="menu"
        :content="{ align: 'end' }"
        :ui="{ content: 'min-w-40' }"
      >
        <UButton
          icon="i-lucide-ellipsis"
          :aria-label="t('comments.thread.more')"
          color="neutral"
          variant="ghost"
          size="xs"
        />
      </UDropdownMenu>
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
      <span class="flex-1">{{
        t('comments.thread.resolvedBy', { name: resolver })
      }}</span>
      <UButton
        v-if="!readOnly"
        :label="t('comments.thread.reopen')"
        color="neutral"
        variant="link"
        size="xs"
        class="p-0 font-medium text-highlighted"
        @click="emit('reopen')"
      />
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
        v-for="(message, index) in thread.messages"
        :key="message.id"
        class="group flex gap-2"
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
            <span v-if="message.editedAt" class="text-muted">{{
              t('comments.message.edited')
            }}</span>
            <UDropdownMenu
              v-if="mine(message) && editing !== message.id"
              :items="messageMenu(message, index)"
              :content="{ align: 'end' }"
            >
              <UButton
                icon="i-lucide-ellipsis"
                :aria-label="t('comments.message.actions')"
                color="neutral"
                variant="ghost"
                size="xs"
                class="ml-auto -my-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
              />
            </UDropdownMenu>
          </p>
          <div v-if="editing === message.id" class="mt-1 flex flex-col gap-1.5">
            <UTextarea
              ref="editField"
              v-model="draft"
              :rows="1"
              autoresize
              :maxrows="6"
              :aria-label="t('comments.message.field')"
              @keydown="onEditKey"
            />
            <div class="flex justify-end gap-1.5">
              <UButton
                :label="t('comments.message.cancel')"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="stopEditing"
              />
              <UButton
                :label="t('comments.message.save')"
                color="info"
                size="xs"
                :disabled="!draft.trim()"
                @click="save"
              />
            </div>
          </div>
          <p
            v-else
            class="text-sm break-words whitespace-pre-wrap text-default"
          >
            {{ message.body }}
          </p>
        </div>
      </li>
    </ol>
    <CommentReadOnly
      v-if="readOnly"
      :reason="readOnly.reason"
      :join="readOnly.join"
    />
    <div v-else class="flex items-end gap-2">
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
