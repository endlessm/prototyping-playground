<!--
  The Endless Studios editor toolbar's examples, written as screens write it: <UEditorToolbar> inside a <UEditor>'s
  default slot. Each <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const content = ref('<p>Select some of this text to see the <strong>bubble</strong> toolbar.</p>');
const short = ref('<p>Our level has <em>three</em> checkpoints.</p>');

const textStyles = [
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
] as const;

const bubble = [
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
    { kind: 'link', icon: 'i-lucide-link', tooltip: { text: 'Link' } },
  ],
] as const;

const withUndo = [
  [
    { kind: 'undo', icon: 'i-lucide-undo', tooltip: { text: 'Undo' } },
    { kind: 'redo', icon: 'i-lucide-redo', tooltip: { text: 'Redo' } },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
  ],
] as const;
</script>

<template>
  <Example name="Fixed">
    <UEditor
      v-slot="{ editor }"
      v-model="short"
      content-type="html"
      :image="false"
      :mention="false"
      :ui="{ root: 'w-full rounded-lg border border-default overflow-hidden', base: 'p-3 min-h-24' }"
    >
      <UEditorToolbar :editor="editor" :items="textStyles" class="flex-wrap gap-0.5 border-b border-default px-2 py-1" />
    </UEditor>
  </Example>

  <Example name="Bubble">
    <div class="w-full pt-12">
      <UEditor
        v-slot="{ editor }"
        v-model="content"
        content-type="html"
        :image="false"
        :mention="false"
        :ui="{ root: 'w-full rounded-lg border border-default', base: 'p-3 min-h-24' }"
      >
        <UEditorToolbar :editor="editor" :items="bubble" layout="bubble" />
      </UEditor>
    </div>
  </Example>

  <Example name="UndoAndRedo">
    <UEditor
      v-slot="{ editor }"
      v-model="short"
      content-type="html"
      :image="false"
      :mention="false"
      :ui="{ root: 'w-full rounded-lg border border-default overflow-hidden', base: 'p-3 min-h-24' }"
    >
      <UEditorToolbar :editor="editor" :items="withUndo" class="gap-0.5 border-b border-default px-2 py-1" />
    </UEditor>
  </Example>
</template>
