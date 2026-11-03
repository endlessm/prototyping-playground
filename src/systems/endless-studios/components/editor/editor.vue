<!--
  The Endless Studios rich text editor: Nuxt UI's UEditor as the frontend's RichTextEditor uses it. Screens write
  <UEditor> directly, with these props, v-model and a default slot that receives `{ editor }` for the toolbar and
  menus; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The content, bound with `v-model`: an HTML string in the app. */
    modelValue?: string | object;
    /** How `modelValue` is read and written. The app uses `html`. */
    contentType?: 'html' | 'json' | 'markdown';
    /** Grey text in an empty editor. */
    placeholder?: string;
    /** Tiptap's StarterKit options. The app turns off `horizontalRule` and replaces `link` with its own. */
    starterKit?: Record<string, unknown>;
    /** Images in the content. The app turns this off and inserts uploaded images through its own handler. */
    image?: boolean;
    /** @-mentions, filled by a `UEditorMentionMenu` in the default slot. Only the community feed turns this on. */
    mention?: boolean;
    /** Replaces or adds toolbar actions, such as the app's image upload. */
    handlers?: Record<string, unknown>;
    /** Extra Tiptap extensions. */
    extensions?: unknown[];
    /** `false` shows the content read-only. */
    editable?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: root, content, base. */
    ui?: Record<string, string>;
  }>(),
  { image: true, mention: true, editable: true },
);
</script>

<template>
  <UEditor v-slot="{ editor }" v-bind="props">
    <slot :editor="editor" />
  </UEditor>
</template>
