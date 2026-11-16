<script setup lang="ts">
import { useStudioToast } from '../../../../app/composables/useStudioToast'
import ComponentGuide from '../../systems/components/ComponentGuide.vue'
import SystemPreview from '../../systems/components/SystemPreview.vue'
import type { CatalogExample } from '../../systems/composables/useSystemCatalog'
import { vueFence } from '../../systems/utils/code'

// One variant in the grid: an example's title, its preview, and its own
// code to show and copy. An example that needs more room than its column
// takes the whole row, and keeps it, so the grid doesn't flip back and
// forth as the column widens.
const props = defineProps<{
  systemId: string
  example: CatalogExample
  /** Its block of the examples file, or the whole file; unset until loaded. */
  code?: string
  /** The examples file, repository-relative. */
  file: string
}>()
const { t } = useI18n()
const toast = useStudioToast()

const wide = ref(false)
const showCode = ref(false)
const titleId = useId()
const fenced = computed(() =>
  props.code === undefined ? null : vueFence(props.code),
)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code ?? '')
    toast.success(t('lab.variants.copied'))
  } catch (error) {
    toast.error(t('lab.variants.copyFailed'), (error as Error).message)
  }
}
</script>

<template>
  <div
    data-variant
    class="min-w-0"
    :class="{ '@3xl:col-span-2': wide }"
    :data-variant-wide="wide || undefined"
  >
    <h3 :id="titleId" class="mb-2 text-xs font-medium text-muted">
      {{ example.title }}
    </h3>
    <SystemPreview
      :system-id="systemId"
      :artifact="example.id"
      :title="example.title"
      @wide="wide = true"
    />
    <div v-if="fenced" class="relative mt-2" data-variant-code>
      <UCollapsible v-model:open="showCode">
        <button
          type="button"
          :aria-describedby="titleId"
          class="flex h-6 cursor-pointer items-center gap-1.5 rounded-sm text-sm font-medium text-highlighted outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <UIcon
            name="i-lucide-chevron-down"
            class="size-3.5 text-muted transition-transform"
            :class="{ '-rotate-90': !showCode }"
          />
          {{ t('systems.component.showCode') }}
        </button>
        <template #content>
          <ComponentGuide class="mt-2" :source="fenced" :file="file" />
        </template>
      </UCollapsible>
      <UButton
        class="absolute top-0 right-0"
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-copy"
        :label="t('lab.variants.copy')"
        :aria-describedby="titleId"
        @click="copy"
      />
    </div>
  </div>
</template>
