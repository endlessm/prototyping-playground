<!--
  The Endless Studios mention menu: Nuxt UI's UEditorMentionMenu as the frontend's RichTextEditor uses it in the
  community feed. Screens write <UEditorMentionMenu> inside a <UEditor mention>'s default slot, with these props;
  this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The editor it acts on, from `<UEditor v-slot="{ editor }">`. */
    editor: object;
    /** The people to suggest, each with `label` and optionally `avatar` or `icon` and `description`. */
    items?: Record<string, unknown>[] | Record<string, unknown>[][];
    /** The character that opens the menu. */
    char?: string;
    /**
     * Shows `items` as given instead of filtering them by what's typed. The app searches the server on
     * `@update:search-term` and passes the results back as `items`.
     */
    ignoreFilter?: boolean;
    /** The most suggestions it shows. */
    limit?: number;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  }>(),
  { char: '@' },
);
</script>

<template>
  <UEditorMentionMenu v-bind="props as any" />
</template>
