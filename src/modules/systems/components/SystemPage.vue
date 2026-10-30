<script setup lang="ts">
import type { SystemCatalog } from '../../../../tooling/systems/catalog'

// A system's page, rendered, or, locally, its source (`?mode=source`, or
// ⌘' / Ctrl+') when it has one. Source mode never renders the page, so a
// broken file can still be opened and fixed. The rendered page stays in the
// studio's own look.
const props = defineProps<{
  system: SystemCatalog
  /** The file its source opens, inside the system's folder. */
  source?: string | null
  /** Fills the area, rather than a column of text (a text file). */
  wide?: boolean
}>()
const { t } = useI18n()

// The editor exists only in the studio running locally.
const SystemSource = import.meta.dev
  ? defineAsyncComponent({
      loader: () => import('./SystemSource.vue'),
      loadingComponent: {
        render: () =>
          h(
            'p',
            { class: 'p-4 text-sm text-muted' },
            t('systems.source.loadingEditor'),
          ),
      },
      delay: 0,
    })
  : undefined

const rendered = useTemplateRef<HTMLElement>('rendered')
const mode = props.source ? useSourceMode(rendered) : undefined
const editing = computed(() => Boolean(mode?.source.value && SystemSource))
</script>

<template>
  <div
    v-if="!editing"
    ref="rendered"
    tabindex="-1"
    class="outline-none"
    :class="wide ? 'h-full min-h-0' : 'mx-auto w-full max-w-3xl px-4 py-6'"
  >
    <slot />
  </div>
  <div v-else class="h-full min-h-0">
    <slot name="source" :done="mode!.toggle">
      <SystemSource :system="system" :path="source!" @done="mode!.toggle" />
    </slot>
  </div>
</template>
