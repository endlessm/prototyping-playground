<script setup lang="ts">
import type { ShownAuthor } from '../composables/useCommentAuthors'

// A numbered marker on what a thread is pinned to. Hovering previews the
// first message; a resolved thread's pin is grey with a check.
const props = defineProps<{
  number: number
  x: number
  y: number
  author: ShownAuthor
  preview: string
  resolved: boolean
  active: boolean
}>()
const emit = defineEmits<{ open: [] }>()

const { t } = useI18n()
// A screen reader hears the number, the author and the first words.
const WORDS = 8
const firstWords = computed(() => {
  const words = props.preview.trim().split(/\s+/)
  return words.length > WORDS
    ? `${words.slice(0, WORDS).join(' ')}…`
    : words.join(' ')
})
const name = computed(() =>
  t('comments.pin', {
    number: props.number,
    name: props.author.name,
    preview: firstWords.value,
  }),
)
</script>

<template>
  <button
    type="button"
    data-comment-ui
    data-comment-pin
    class="group pointer-events-auto absolute -mt-[13px] -ml-[13px] grid size-[26px] place-items-center rounded-full rounded-bl-sm text-xs font-semibold text-white shadow-md ring-2 ring-white hover:scale-110 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out dark:ring-neutral-900"
    :class="[resolved ? 'bg-neutral-500' : 'bg-info', active && 'scale-110']"
    :style="{ left: `${x}px`, top: `${y}px` }"
    :aria-label="name"
    :aria-expanded="active"
    @click="emit('open')"
  >
    <UIcon v-if="resolved" name="i-lucide-check" class="size-3" />
    <template v-else>{{ number }}</template>
    <span
      v-if="!active"
      aria-hidden="true"
      class="pointer-events-none absolute top-[-2px] left-[calc(100%+8px)] w-max max-w-60 rounded-lg border border-default bg-default px-2.5 py-1.5 text-left text-xs leading-snug font-normal text-default opacity-0 shadow-lg group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:transition-opacity motion-safe:duration-150 motion-safe:ease-out"
    >
      <strong class="block font-semibold text-highlighted">{{
        author.name
      }}</strong>
      {{ preview }}
    </span>
  </button>
</template>
