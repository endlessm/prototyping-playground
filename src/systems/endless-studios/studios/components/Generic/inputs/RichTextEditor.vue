<template>
  <div :id="id" class="input-section" :class="inputClass ? inputClass : ''">
    <p v-if="title" class="input-section__title">{{ title }}</p>
    <UEditor
      v-model="value"
      content-type="html"
      :image="false"
      :mention="!!mentionSource"
      :starter-kit="starterKit"
      :extensions="[ImageWithAttributes, linkExtension]"
      :handlers="handlers"
      :ui="{
        root: 'rounded-lg border border-gray-200 overflow-hidden',
        base: 'p-3 h-[200px] overflow-y-auto',
      }"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
    >
      <template #default="{ editor }">
        <UEditorToolbar
          :editor="editor"
          :items="toolbarItems"
          class="flex-wrap gap-0.5 border-b border-gray-200 px-2 py-1"
        >
          <template #link>
            <RichTextEditorLinkPopover :editor="editor" />
          </template>
        </UEditorToolbar>
        <UEditorMentionMenu
          v-if="mentionSource"
          :editor="editor"
          :items="mentionItems"
          ignore-filter
          @update:search-term="onMentionSearch"
        />
      </template>
    </UEditor>
    <p v-if="errorMessage" class="input-section__field__error">
      <i class="ml-2 mr-1 far fa-times-circle text-red-800"></i>
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup>
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { UploadBase64File } from '~/graphql_schemas/globals'
import RichTextEditorLinkPopover from './RichTextEditorLinkPopover.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  modelValue: {
    type: String,
    required: true,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  inputClass: {
    type: String,
    default: '',
  },
  // Async source for @-mentions: (query) => Promise<{ id, label }[]>.
  // When null, mentions are disabled (all editors except the community feed).
  mentionSource: {
    type: Function,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'input', 'focus', 'blur'])

const { $graphqlRequest } = useNuxtApp()
const { showBackendErrorToast } = useBackendError()

const value = computed({
  get: () => props.modelValue,
  set: (newValue) => {
    emit('update:modelValue', newValue)
    emit('input', newValue)
  },
})

// Preserve the attributes the backend puts on uploaded images (and the ones
// users add by resizing), which the default TipTap image node would strip.
const ImageWithAttributes = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      height: { default: null },
      class: { default: null },
      'data-original': { default: null },
      s3bucket: { default: null },
      region: { default: null },
      key: { default: null },
    }
  },
})

async function uploadAndInsert(editor) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.click()

  input.onchange = async () => {
    const file = input.files[0]
    if (!file) return

    try {
      const base64 = await fileToDataUrl(file)
      const blob = new Blob([base64], { type: 'text/plain' })
      const fileObject = new File([blob], file.name, { type: file.type })

      const response = await $graphqlRequest.mutate(UploadBase64File, {
        input: {
          name: file.name,
          mime_type: file.type,
          base64_content: fileObject,
        },
      })
      editor
        .chain()
        .focus()
        .insertContent(response.data.uploadBase64File.img_tag)
        .run()
    } catch (error) {
      showBackendErrorToast(error instanceof Error ? error.message : undefined)
    }
  }
}

// Disabled in starterKit (which only configures options, not class
// behavior) and re-registered here so we can override `inclusive` — tied to
// `autolink` by default, which keeps extending a link into whatever gets
// typed right after it.
const linkExtension = Link.extend({ inclusive: () => false }).configure({
  openOnClick: false,
  defaultProtocol: 'https',
  autolink: true,
})

const starterKit = {
  horizontalRule: false,
  link: false,
  dropcursor: { color: 'var(--ui-primary)', width: 2 },
}

const mentionItems = ref([])

async function onMentionSearch(query) {
  if (!props.mentionSource) return
  mentionItems.value = await props.mentionSource(query)
}

const handlers = {
  image: {
    canExecute: () => true,
    // The toolbar calls execute(...).run(), so return a chain; the async
    // upload runs as a side effect and inserts the image when it resolves.
    execute: (editor) => {
      uploadAndInsert(editor)
      return editor.chain().focus()
    },
    isActive: () => false,
  },
}

const toolbarItems = [
  [
    {
      kind: 'heading',
      level: 1,
      icon: 'i-lucide-heading-1',
      tooltip: { text: 'Heading 1' },
    },
    {
      kind: 'heading',
      level: 2,
      icon: 'i-lucide-heading-2',
      tooltip: { text: 'Heading 2' },
    },
    {
      kind: 'heading',
      level: 3,
      icon: 'i-lucide-heading-3',
      tooltip: { text: 'Heading 3' },
    },
  ],
  [
    {
      kind: 'mark',
      mark: 'bold',
      icon: 'i-lucide-bold',
      tooltip: { text: 'Bold' },
    },
    {
      kind: 'mark',
      mark: 'italic',
      icon: 'i-lucide-italic',
      tooltip: { text: 'Italic' },
    },
    {
      kind: 'mark',
      mark: 'underline',
      icon: 'i-lucide-underline',
      tooltip: { text: 'Underline' },
    },
    {
      kind: 'mark',
      mark: 'strike',
      icon: 'i-lucide-strikethrough',
      tooltip: { text: 'Strikethrough' },
    },
  ],
  [
    {
      kind: 'blockquote',
      icon: 'i-lucide-quote',
      tooltip: { text: 'Blockquote' },
    },
    {
      kind: 'codeBlock',
      icon: 'i-lucide-square-code',
      tooltip: { text: 'Code Block' },
    },
    { slot: 'link', icon: 'i-lucide-link' },
  ],
  [
    {
      kind: 'bulletList',
      icon: 'i-lucide-list',
      tooltip: { text: 'Bullet List' },
    },
    {
      kind: 'orderedList',
      icon: 'i-lucide-list-ordered',
      tooltip: { text: 'Ordered List' },
    },
    { kind: 'image', icon: 'i-lucide-image', tooltip: { text: 'Image' } },
  ],
]
</script>

<style scoped>
@reference "~/assets/css/main.css";

.input-section {
  width: 100%;
}

.input-section__title {
  @apply mb-2 font-medium text-caption-2 leading-caption-2 text-gray-light;
}

.input-section__field__error {
  @apply font-thin text-body-small leading-body-small text-red-800;
}
</style>
