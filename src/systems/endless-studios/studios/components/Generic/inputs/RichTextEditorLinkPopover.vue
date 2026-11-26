<script setup>
const props = defineProps({
  editor: {
    type: Object,
    required: true,
  },
  autoOpen: {
    type: Boolean,
    default: false,
  },
})

const open = ref(false)
const url = ref('')

const active = computed(() => props.editor.isActive('link'))
const disabled = computed(() => {
  if (!props.editor.isEditable) return true
  const { selection } = props.editor.state
  return selection.empty && !props.editor.isActive('link')
})

// The browser resolves a protocol-less href (e.g. "www.example.com") as a
// path relative to the current origin instead of navigating externally.
function withProtocol(href) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return href
  return `https://${href}`
}

watch(
  () => props.editor,
  (editor, _, onCleanup) => {
    if (!editor) return

    const updateUrl = () => {
      const { href } = editor.getAttributes('link')
      url.value = href || ''
    }

    updateUrl()
    editor.on('selectionUpdate', updateUrl)

    onCleanup(() => {
      editor.off('selectionUpdate', updateUrl)
    })
  },
  { immediate: true },
)

watch(active, (isActive) => {
  if (isActive && props.autoOpen) {
    open.value = true
  }
})

function setLink() {
  if (!url.value) return

  const href = withProtocol(url.value)
  const { selection } = props.editor.state
  const isEmpty = selection.empty
  const hasCode = props.editor.isActive('code')

  let chain = props.editor.chain().focus()

  if (hasCode && !isEmpty) {
    chain = chain.extendMarkRange('code').setLink({ href })
  } else {
    chain = chain.extendMarkRange('link').setLink({ href })

    if (isEmpty) {
      chain = chain.insertContent({ type: 'text', text: href })
    }
  }

  chain.run()
  open.value = false
}

function removeLink() {
  props.editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .unsetLink()
    .setMeta('preventAutolink', true)
    .run()

  url.value = ''
  open.value = false
}

function openLink() {
  if (!url.value) return
  window.open(withProtocol(url.value), '_blank', 'noopener,noreferrer')
}

function handleKeyDown(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    setLink()
  }
}
</script>

<template>
  <UPopover v-model:open="open" :ui="{ content: 'p-0.5' }">
    <UTooltip text="Link">
      <UButton
        icon="i-lucide-link"
        color="neutral"
        active-color="primary"
        variant="ghost"
        active-variant="soft"
        size="sm"
        :active="active"
        :disabled="disabled"
      />
    </UTooltip>

    <template #content>
      <UInput
        v-model="url"
        autofocus
        name="url"
        type="url"
        variant="none"
        placeholder="Paste a link..."
        @keydown="handleKeyDown"
      >
        <div class="flex items-center mr-0.5">
          <UButton
            icon="i-lucide-corner-down-left"
            variant="ghost"
            size="sm"
            :disabled="!url && !active"
            title="Apply link"
            @click="setLink"
          />

          <USeparator orientation="vertical" class="h-6 mx-1" />

          <UButton
            icon="i-lucide-external-link"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="!url && !active"
            title="Open in new window"
            @click="openLink"
          />

          <UButton
            icon="i-lucide-trash"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="!url && !active"
            title="Remove link"
            @click="removeLink"
          />
        </div>
      </UInput>
    </template>
  </UPopover>
</template>
