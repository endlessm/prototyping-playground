<!--
  The Endless Studios editor toolbar: Nuxt UI's UEditorToolbar as the frontend's RichTextEditor uses it. Screens
  write <UEditorToolbar> inside a <UEditor>'s default slot, with these props; this file gives the component page its
  props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The editor it acts on, from `<UEditor v-slot="{ editor }">`. */
    editor: object;
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
</script>

<template>
  <UEditorToolbar v-bind="props as any" />
</template>
