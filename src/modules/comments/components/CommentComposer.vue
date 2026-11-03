<script setup lang="ts">
// Writing a new comment beside the spot that was clicked: it opens focused,
// Enter posts and Shift+Enter starts a new line.
defineProps<{ label: string; quote?: string; posting: boolean }>()
const emit = defineEmits<{ post: [body: string]; cancel: [] }>()

const { t } = useI18n()
const text = defineModel<string>({ default: '' })
const field = useTemplateRef<{ textareaRef?: HTMLTextAreaElement }>('field')

function onKey(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  if (text.value.trim()) emit('post', text.value)
}
onMounted(() => field.value?.textareaRef?.focus())
</script>

<template>
  <div
    role="dialog"
    :aria-label="t('comments.composer.title')"
    data-comment-ui
    class="pointer-events-auto absolute flex w-80 flex-col gap-2.5 rounded-xl border border-default bg-default p-3 shadow-lg"
  >
    <p
      class="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-muted"
    >
      <UIcon name="i-lucide-mouse-pointer-2" class="size-3.5 shrink-0" />
      <span class="truncate">{{ label }}</span>
    </p>
    <blockquote
      v-if="quote"
      class="border-l-2 border-info pl-2 text-sm text-muted"
    >
      {{ quote }}
    </blockquote>
    <UTextarea
      ref="field"
      v-model="text"
      :rows="3"
      autoresize
      :maxrows="8"
      :placeholder="t('comments.composer.placeholder')"
      :aria-label="t('comments.composer.field')"
      @keydown="onKey"
    />
    <div class="flex items-center gap-2">
      <span class="flex-1 text-xs text-muted">{{
        t('comments.composer.enter')
      }}</span>
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        :label="t('comments.composer.cancel')"
        @click="emit('cancel')"
      />
      <UButton
        color="info"
        size="sm"
        :label="t('comments.composer.post')"
        :loading="posting"
        :disabled="!text.trim()"
        @click="emit('post', text)"
      />
    </div>
  </div>
</template>
