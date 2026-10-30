<script setup lang="ts">
import { sourceLanguage } from '../utils/sourceLanguage'

// A text file that no other reader handles (a script in a skill's folder),
// shown read-only as its text under its path: locally in the source editor,
// highlighted; on the deployed site, which never loads the editor, as plain
// monospace text.
const props = defineProps<{
  /** Where the file is, from the studio's root. */
  path: string
  text: string
}>()
const { t } = useI18n()

const SourceCode = import.meta.dev
  ? defineAsyncComponent(() => import('./source/SourceCode.vue'))
  : undefined
</script>

<template>
  <div class="flex h-full min-h-0 min-w-0 flex-col bg-default">
    <div
      class="flex h-14 shrink-0 items-center gap-3 border-b border-default px-4 text-xs"
    >
      <span class="min-w-0 truncate font-mono text-muted" :title="path">
        {{ path }}
      </span>
      <span class="ml-auto shrink-0 text-muted">{{
        t('source.readOnly')
      }}</span>
      <slot name="actions" />
    </div>
    <SourceCode
      v-if="SourceCode"
      :model-value="props.text"
      :language="sourceLanguage(path)"
      :editable="false"
      :label="t('source.label', { path })"
    />
    <pre
      v-else
      :aria-label="t('source.label', { path })"
      class="min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-[13px] leading-relaxed"
    ><code>{{ text }}</code></pre>
  </div>
</template>
