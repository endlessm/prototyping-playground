<script setup lang="ts">
import type {
  CatalogComponent,
  SystemCatalog,
} from '../composables/useSystemCatalog'
import { systemAddress } from '../utils/pages'

// A component's Source: the libraries that list it, linking to their
// Libraries entry, where it comes from, its docs elsewhere and its file.
// Nothing for a component without a file.
const props = defineProps<{
  system: SystemCatalog
  component: CatalogComponent
}>()
const { t } = useI18n()

const libraries = computed(() =>
  props.system.libraries.filter((library) =>
    library.components.includes(props.component.slug),
  ),
)
// A link from the page's frontmatter, if it's a web address.
const docsLink = computed(() => {
  try {
    const url = new URL(props.component.docsUrl ?? '')
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : null
  } catch {
    return null
  }
})
const file = computed(
  () =>
    props.component.source ??
    props.component.doc ??
    props.component.examplesFile,
)
</script>

<template>
  <section v-if="file" class="mt-12" aria-labelledby="component-source">
    <h2
      id="component-source"
      class="mb-4 text-lg font-semibold tracking-tight text-highlighted"
    >
      {{ t('systems.component.source') }}
    </h2>
    <div class="flex items-start gap-3 rounded-lg border border-default p-4">
      <UIcon
        name="i-lucide-library"
        class="mt-0.5 size-4 shrink-0 text-muted"
      />
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-3">
        <div class="min-w-0 flex-1 basis-56">
          <div
            v-if="libraries.length"
            class="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium"
          >
            <ULink
              v-for="library in libraries"
              :key="library.id"
              :to="{
                path: systemAddress(system.id, 'libraries'),
                hash: `#${library.id}`,
              }"
              class="inline-flex items-center gap-1 text-highlighted hover:underline"
              :aria-label="
                t('systems.component.inLibraries', { name: library.label })
              "
            >
              {{ library.label }}
              <UIcon name="i-lucide-arrow-right" class="size-3.5 text-muted" />
            </ULink>
          </div>
          <p
            v-if="component.sourceNote"
            class="text-sm leading-6 text-muted"
            :class="{ 'mt-1': libraries.length }"
          >
            {{ component.sourceNote }}
          </p>
        </div>
        <a
          v-if="docsLink"
          :href="docsLink"
          target="_blank"
          rel="noreferrer"
          class="ml-auto inline-flex items-center gap-1 text-sm text-highlighted underline underline-offset-4 hover:text-muted"
        >
          {{ t('systems.component.componentDocs') }}
          <UIcon name="i-lucide-external-link" class="size-3.5" />
        </a>
        <p class="w-full font-mono text-xs break-all text-muted">
          <span class="font-sans">{{ t('systems.component.file') }}</span>
          {{ file }}
        </p>
      </div>
    </div>
  </section>
</template>
