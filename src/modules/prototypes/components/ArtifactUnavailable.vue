<script setup lang="ts">
import type { ArtifactUnavailable } from '../../../../tooling/manifest/build'

// An artifact that can't open here says why; locally its source still opens.
defineProps<{ unavailable: ArtifactUnavailable }>()
const emit = defineEmits<{ source: [] }>()
const { t } = useI18n()
const local = import.meta.dev
</script>

<template>
  <div role="status" class="max-w-2xl space-y-4 p-2 text-sm">
    <p>
      {{
        t('artifact.typeOff', {
          type: unavailable.type,
          module: unavailable.module,
        })
      }}
    </p>
    <UButton
      v-if="local"
      color="neutral"
      variant="outline"
      size="sm"
      icon="i-lucide-code-xml"
      :label="t('artifact.openSource')"
      @click="emit('source')"
    />
  </div>
</template>
