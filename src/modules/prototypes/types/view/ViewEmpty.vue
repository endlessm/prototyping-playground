<script setup lang="ts">
// What a view shows until something is built in it (its file holds nothing
// but comments): a quiet page that says so, with a prompt to hand the agent.
// It is the studio's page, so it looks the same whichever system the
// prototype uses. The deployed site has no source to point at, so only the
// explanation shows there.
const props = defineProps<{
  /** Repository-relative, as the prompt names it. */
  file: string
  /** Shorter, to fit: `prototype/file.vue`. */
  shortFile: string
}>()

const { t } = useI18n()
const local = import.meta.dev
const prompt = computed(() => t('view.empty.prompt', { path: props.file }))
const { copy, copied } = useClipboard({ copiedDuring: 1500, legacy: true })
</script>

<template>
  <div class="flex h-full items-center justify-center p-8">
    <UEmpty
      variant="outline"
      class="max-w-md"
      :title="t('view.empty.title')"
      :description="t('view.empty.description')"
    >
      <template v-if="local" #footer>
        <div
          class="flex items-center gap-2 rounded-md bg-muted py-1.5 pr-1.5 pl-3 text-left"
        >
          <code
            class="min-w-0 flex-1 truncate font-mono text-xs text-muted"
            :title="prompt"
          >
            {{ t('view.empty.prompt', { path: shortFile }).trim() }}
          </code>
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            :label="copied ? t('view.copied') : t('view.empty.copy')"
            @click="copy(prompt)"
          />
        </div>
      </template>
    </UEmpty>
  </div>
</template>
