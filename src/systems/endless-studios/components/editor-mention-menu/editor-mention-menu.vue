<!--
  The Endless Studios mention menu: Nuxt UI's UEditorMentionMenu as the frontend's RichTextEditor uses it in the
  community feed. Screens write <UEditorMentionMenu> inside a <UEditor mention>'s default slot, with these props;
  this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The editor it acts on, from `<UEditor v-slot="{ editor }">`. Screens always pass it. */
    editor?: object;
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

// Without an editor, as in the Lab, the frame brings its own and types the trigger character, so the menu shows.
const content = ref('<p>Great level! Thanks to</p>');
const samplePeople = [
  { label: 'ana.learner', description: 'Ana Souza', avatar: { text: 'AS' } },
  { label: 'marco.mentor', description: 'Marco Lima · Mentor', avatar: { text: 'ML' } },
  { label: 'carla.reis', description: 'Carla Reis', avatar: { text: 'CR' } },
  { label: 'joao.lima', description: 'João Lima', avatar: { text: 'JL' } },
];
const sampleEditor = ref<{ editor?: { chain: () => any } }>();

// The menu registers its suggestion on mount, so the character goes in once both exist.
watch(
  () => sampleEditor.value?.editor,
  (editor) => {
    if (!editor) return;
    setTimeout(() => editor.chain().focus('end').insertContent(` ${props.char}`).run(), 100);
  },
);
</script>

<template>
  <UEditorMentionMenu v-if="editor" v-bind="props as any" />
  <!-- The open menu floats outside the layout, so this keeps room for it on the Lab's stage, as the examples do. -->
  <div v-else class="h-72 w-full">
    <UEditor
      ref="sampleEditor"
      v-slot="{ editor: instance }"
      v-model="content"
      content-type="html"
      :image="false"
      :ui="{ root: 'w-full rounded-lg border border-default', base: 'p-3 min-h-24' }"
    >
      <UEditorMentionMenu v-bind="props as any" :editor="instance" :items="items ?? samplePeople" />
    </UEditor>
  </div>
</template>
