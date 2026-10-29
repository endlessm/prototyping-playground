<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { ManifestPrototype } from '../../../../app/composables/useManifest'

// A prototype with nothing in it yet stays at its address and says what to
// add, with a prompt to hand the agent. The deployed site has no folder to
// point at, so only the explanation shows there.
const props = defineProps<{ prototype: ManifestPrototype }>()
const { t } = useI18n()
const local = import.meta.dev
const prompt = computed(() =>
  t('prototypes.empty.prompt', { path: `${props.prototype.folder}/` }),
)
const { copy, copied } = useClipboard({ copiedDuring: 1500, legacy: true })
</script>

<template>
  <div class="flex h-full items-center justify-center p-8">
    <UEmpty
      variant="outline"
      icon="i-lucide-square-mouse-pointer"
      class="max-w-md"
      :title="t('prototypes.empty.title')"
      :description="t('prototypes.empty.description')"
    >
      <template v-if="local" #footer>
        <div
          class="flex items-center gap-2 rounded-md bg-muted py-1.5 pr-1.5 pl-3 text-left"
        >
          <code
            class="min-w-0 flex-1 truncate font-mono text-xs text-muted"
            :title="prompt"
          >
            {{ prompt.trim() }}
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
