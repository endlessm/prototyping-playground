<!--
  The Endless Studios editor's examples, written as the app's RichTextEditor builds it: <UEditor> with a fixed
  <UEditorToolbar> in its default slot. Each <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const description = ref(
  '<h2>Game jam kickoff</h2><p>Join us for a <strong>48-hour game jam</strong>. Bring an idea, or find a team on the night.</p><ul><li>Pizza at 6 pm</li><li>Theme reveal at 7 pm</li></ul>',
);
const empty = ref('');

const toolbar = [
  [
    { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', tooltip: { text: 'Heading 1' } },
    { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', tooltip: { text: 'Heading 2' } },
    { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', tooltip: { text: 'Heading 3' } },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Underline' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Strikethrough' } },
  ],
  [
    { kind: 'blockquote', icon: 'i-lucide-quote', tooltip: { text: 'Blockquote' } },
    { kind: 'codeBlock', icon: 'i-lucide-square-code', tooltip: { text: 'Code Block' } },
    { kind: 'link', icon: 'i-lucide-link', tooltip: { text: 'Link' } },
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: 'Bullet List' } },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: 'Ordered List' } },
  ],
] as const;
</script>

<template>
  <Example name="Default">
    <div class="w-full">
      <p class="mb-2 text-sm font-medium text-muted">Event description</p>
      <UEditor
        v-slot="{ editor }"
        v-model="description"
        content-type="html"
        :image="false"
        :mention="false"
        :starter-kit="{ horizontalRule: false }"
        :ui="{ root: 'rounded-lg border border-default overflow-hidden', base: 'p-3 h-[200px] overflow-y-auto' }"
      >
        <UEditorToolbar :editor="editor" :items="toolbar" class="flex-wrap gap-0.5 border-b border-default px-2 py-1" />
      </UEditor>
    </div>
  </Example>

  <Example name="Placeholder">
    <UEditor
      v-slot="{ editor }"
      v-model="empty"
      content-type="html"
      placeholder="Share something with your cohort…"
      :image="false"
      :mention="false"
      :ui="{ root: 'w-full rounded-lg border border-default overflow-hidden', base: 'p-3 h-[140px] overflow-y-auto' }"
    >
      <UEditorToolbar :editor="editor" :items="toolbar" class="flex-wrap gap-0.5 border-b border-default px-2 py-1" />
    </UEditor>
  </Example>

  <Example name="ReadOnly">
    <UEditor
      :model-value="description"
      content-type="html"
      :editable="false"
      :image="false"
      :mention="false"
      :ui="{ root: 'w-full', base: 'p-0' }"
    />
  </Example>
</template>
