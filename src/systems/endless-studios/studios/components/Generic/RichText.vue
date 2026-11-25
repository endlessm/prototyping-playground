<template>
  <div
    class="rich-text prose max-w-none wrap-break-word hyphens-auto"
    v-html="sanitizedHtml"
  />
</template>

<script>
import DOMPurify from 'dompurify'
import linkifyHtml from 'linkify-html'

export default {
  props: {
    html: {
      type: String,
      default: '',
    },
  },
  computed: {
    sanitizedHtml() {
      // Rich text fields come back as null when they were never filled in.
      return DOMPurify.sanitize(linkifyHtml(this.html || ''))
    },
  },
}
</script>

<style scoped>
.rich-text {
  &:deep(.ql-syntax) {
    white-space: pre-wrap !important;
    font-family: ui-monospace, monospace;
  }

  &:deep(p:has(br)) {
    display: none !important;
  }

  &:deep(.mention),
  &:deep(.user-mention) {
    background-color: transparent !important;
    font-weight: 600;
  }

  &:deep(span.mention) {
    cursor: pointer;
  }
}
</style>
