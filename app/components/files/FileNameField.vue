<script setup lang="ts">
// The file tree's inline name field, for creating and renaming. The name is
// selected without its extension; Enter or leaving the field confirms,
// Escape cancels. Keys stay in the field, away from the tree's own.
const props = defineProps<{ initial: string }>()
const emit = defineEmits<{ done: [name: string | null] }>()
const { t } = useI18n()

const value = ref(props.initial)
const input = useTemplateRef<HTMLInputElement>('input')
let finished = false
function finish(name: string | null) {
  if (finished) return
  finished = true
  emit('done', name)
}

onMounted(() => {
  const element = input.value
  if (!element) return
  element.focus()
  const dot = props.initial.lastIndexOf('.')
  element.setSelectionRange(0, dot > 0 ? dot : props.initial.length)
})

function onKeydown(event: KeyboardEvent) {
  event.stopPropagation()
  if (event.key === 'Enter') {
    event.preventDefault()
    finish(value.value.trim())
  } else if (event.key === 'Escape') {
    event.preventDefault()
    finish(null)
  }
}
</script>

<template>
  <input
    ref="input"
    v-model="value"
    :aria-label="t('files.name')"
    spellcheck="false"
    autocomplete="off"
    class="h-6 w-full min-w-0 rounded-sm border border-accented bg-default px-1.5 text-xs text-highlighted outline-none focus:border-primary"
    @keydown="onKeydown"
    @click.stop
    @blur="finish(value.trim())"
  />
</template>
