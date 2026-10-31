<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'

// After a rename, the files that still name the system's old folder, until
// an agent reviews them and removes `renameReview` from `system.ts`. The
// cleanup instructions for the agent can be copied. Local only.
const props = defineProps<{ system: SystemCatalog }>()
const { t } = useI18n()
const toast = useStudioToast()
const { copy } = useClipboard({ legacy: true })

const instructions = () =>
  `Review the remaining references after renaming the system to ${props.system.label} (${props.system.folder}). Read AGENTS.md and ${props.system.folder}/AGENTS.md. Check these files: ${props.system.renameReview.join(', ')}. Repair links to the system's old folder without changing external URLs. Verify the build, then remove renameReview from ${props.system.folder}/system.ts.`

async function copyInstructions() {
  try {
    await copy(instructions())
    toast.success(t('systems.references.copied'))
  } catch {
    toast.error(t('systems.references.failed'))
  }
}
</script>

<template>
  <UAlert
    v-if="system.renameReview.length"
    icon="i-lucide-file-search"
    color="neutral"
    variant="subtle"
    :title="t('systems.references.title')"
    class="mb-6"
    role="note"
    :aria-label="t('systems.references.title')"
  >
    <template #description>
      <p>{{ t('systems.references.description') }}</p>
      <ul class="my-2 list-disc pl-5">
        <li v-for="file in system.renameReview" :key="file">{{ file }}</li>
      </ul>
      <UButton
        size="sm"
        color="neutral"
        variant="outline"
        :label="t('systems.references.copy')"
        @click="copyInstructions"
      />
    </template>
  </UAlert>
</template>
