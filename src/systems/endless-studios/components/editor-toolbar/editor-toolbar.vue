<!--
  The Endless Studios editor toolbar: Nuxt UI's UEditorToolbar as the frontend's RichTextEditor uses it. Screens
  write <UEditorToolbar> inside a <UEditor>'s default slot, with these props; this file gives the component page its
  props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The editor it acts on, from `<UEditor v-slot="{ editor }">`. Screens always pass it. */
    editor?: object;
    /**
     * The buttons, in groups: `{ kind: 'mark', mark: 'bold', icon, tooltip: { text } }`, `kind: 'heading'` with a
     * `level`, `'bulletList'`, `'orderedList'`, `'blockquote'`, `'codeBlock'`, `'link'`, `'image'`, `'undo'`… or
     * `{ slot: 'name' }` for a button of your own in a slot of that name.
     */
    items?: Record<string, unknown>[] | Record<string, unknown>[][];
    /** `fixed` sits above the content; `bubble` floats over the selected text; `floating` beside an empty line. */
    layout?: 'fixed' | 'bubble' | 'floating';
    /** The buttons' colour and variant at rest. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link';
    /** The buttons' colour and variant while their format is on. */
    activeColor?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    activeVariant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  }>(),
  { layout: 'fixed', color: 'neutral', variant: 'ghost', activeColor: 'primary', activeVariant: 'soft', size: 'sm' },
);

// Without an editor, as in the Lab, the frame brings its own with sample text and buttons.
const content = ref('<p>Our level has <em>three</em> checkpoints. Select a word and make it <strong>bold</strong>.</p>');
const sampleItems = [
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Underline' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Strikethrough' } },
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: 'Bullet List' } },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: 'Ordered List' } },
  ],
];
</script>

<template>
  <UEditorToolbar v-if="editor" v-bind="props as any" />
  <UEditor
    v-else
    v-slot="{ editor: sampleEditor }"
    v-model="content"
    content-type="html"
    :image="false"
    :mention="false"
    :ui="{ root: 'w-full rounded-lg border border-default overflow-hidden', base: 'p-3 min-h-24' }"
  >
    <UEditorToolbar
      v-bind="props as any"
      :editor="sampleEditor"
      :items="items ?? sampleItems"
      class="flex-wrap gap-0.5 border-b border-default px-2 py-1"
    />
  </UEditor>
</template>
